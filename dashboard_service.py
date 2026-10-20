"""Indicadores do painel, com os mesmos modelos usados no controle de estoque."""
from datetime import date, datetime, timedelta
from sqlalchemy import func
from database import db
from models.farmaco import Farmaco
from models.fornecedor import Fornecedor
from models.lote import Lote
from models.movimentacao import Movimentacao
from models.usuario import Usuario


def montar_dashboard(dias):
    hoje = date.today()
    inicio = hoje - timedelta(days=dias - 1)
    lotes = (db.session.query(Lote, Farmaco.nome)
             .join(Farmaco, Lote.id_farmaco == Farmaco.id)
             .join(Fornecedor, Farmaco.id_fornecedor == Fornecedor.id)
             .filter(Lote.status.is_(True), Farmaco.status.is_(True),
                     Fornecedor.status.is_(True), Lote.data_fabricacao <= hoje).all())
    categorias = {"Em dia": 0, "Vencem em até 10 dias": 0, "Vencidos": 0}
    estoque = {}
    alertas = []
    unidades = 0
    for lote, nome in lotes:
        restante = (lote.data_validade - hoje).days
        categoria = "Vencidos" if restante < 0 else "Vencem em até 10 dias" if restante <= 10 else "Em dia"
        categorias[categoria] += 1
        if restante >= 0:
            unidades += lote.quantidade
            estoque[nome] = estoque.get(nome, 0) + lote.quantidade
        if restante <= 10 and lote.quantidade > 0:
            alertas.append({"farmaco": nome, "lote": lote.numero_lote,
                            "validade": lote.data_validade.isoformat(),
                            "dias": restante, "quantidade": lote.quantidade})
    # Agregação por dia funciona em PostgreSQL e SQLite.
    dia = func.date(Movimentacao.data_movimentacao)
    agregados = (db.session.query(dia, Movimentacao.tipo_movimentacao,
                                  func.sum(Movimentacao.quantidade))
                 .filter(Movimentacao.data_movimentacao >= datetime.combine(inicio, datetime.min.time()),
                         Movimentacao.data_movimentacao < datetime.combine(hoje + timedelta(days=1), datetime.min.time()))
                 .group_by(dia, Movimentacao.tipo_movimentacao).all())
    serie = {(inicio + timedelta(days=i)).isoformat(): {"entradas": 0, "saidas": 0} for i in range(dias)}
    for data, tipo, total in agregados:
        chave = data.isoformat() if isinstance(data, date) else str(data)
        if chave in serie:
            serie[chave]["entradas" if tipo == "Entrada" else "saidas"] += int(total)
    recentes = (db.session.query(Movimentacao, Lote.numero_lote, Farmaco.nome, Usuario.nome)
                .join(Lote, Movimentacao.id_lote == Lote.id)
                .join(Farmaco, Lote.id_farmaco == Farmaco.id)
                .join(Usuario, Movimentacao.id_usuario == Usuario.id_usuario)
                .filter(Movimentacao.data_movimentacao >= datetime.combine(inicio, datetime.min.time()),
                        Movimentacao.data_movimentacao < datetime.combine(hoje + timedelta(days=1), datetime.min.time()))
                .order_by(Movimentacao.data_movimentacao.desc(), Movimentacao.id.desc()).limit(6).all())
    return {
        "lotes_ativos": len(lotes), "farmacos": Farmaco.query.filter_by(status=True).count(),
        "movimentacoes": Movimentacao.query.count(), "unidades_disponiveis": unidades,
        "fornecedores": Fornecedor.query.filter_by(status=True).count(),
        "entradas_periodo": sum(x["entradas"] for x in serie.values()),
        "saidas_periodo": sum(x["saidas"] for x in serie.values()),
        "validade": [{"nome": nome, "quantidade": total} for nome, total in categorias.items()],
        "evolucao": [{"data": data, **totais} for data, totais in serie.items()],
        "estoque_por_farmaco": [{"nome": nome, "quantidade": total} for nome, total in
                                sorted(estoque.items(), key=lambda x: (-x[1], x[0]))[:8]],
        "alertas": sorted(alertas, key=lambda x: (x["dias"], x["farmaco"])),
        "recentes": [{"id": mov.id, "farmaco": nome, "lote": numero, "usuario": usuario,
                      "tipo": mov.tipo_movimentacao, "quantidade": mov.quantidade,
                      "data": mov.data_movimentacao.isoformat()} for mov, numero, nome, usuario in recentes],
        "periodo_dias": dias, "atualizado_em": datetime.now().isoformat(),
    }
