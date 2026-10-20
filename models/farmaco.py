from database import db
from datetime import datetime

class Farmaco(db.Model):
    __tablename__ = 'farmaco'
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    id_fornecedor = db.Column(db.Integer, db.ForeignKey('fornecedor.id'), nullable=False)
    status = db.Column(db.Boolean, nullable=False, default=True)
