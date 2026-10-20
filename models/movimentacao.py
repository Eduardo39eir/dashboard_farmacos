from database import db

from datetime import datetime

class Movimentacao(db.Model):
    __tablename__ = 'movimentacao'
    id = db.Column(db.Integer, primary_key=True)
    id_lote = db.Column(db.Integer, db.ForeignKey('lote.id'), nullable=False)
    id_usuario = db.Column(db.Integer, db.ForeignKey('usuarios.id_usuario'), nullable=False)
    tipo_movimentacao = db.Column(db.String(50), nullable=False)  # Entrada ou Saída
    quantidade = db.Column(db.Integer, nullable=False)
    data_movimentacao = db.Column(db.DateTime, nullable=False)
    observacao = db.Column(db.String(255), nullable=True)
