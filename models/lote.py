from database import db

from datetime import datetime

class Lote(db.Model):
    __tablename__ = 'lote'
    id = db.Column(db.Integer, primary_key=True)
    id_farmaco = db.Column(db.Integer, db.ForeignKey('farmaco.id'), nullable=False)
    numero_lote = db.Column(db.String(50), nullable=False)
    data_fabricacao = db.Column(db.Date, nullable=False)
    data_validade = db.Column(db.Date, nullable=False)
    quantidade = db.Column(db.Integer, nullable=False)
    capacidade = db.Column(db.Integer, nullable=False)
    status = db.Column(db.Boolean, nullable=False, default=True)