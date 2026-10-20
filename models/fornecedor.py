from database import db


class Fornecedor(db.Model):
    __tablename__ = 'fornecedor'
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    cnpj = db.Column(db.String(20), unique=True, nullable=False)
    telefone = db.Column(db.String(20), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    status = db.Column(db.Boolean, nullable=False, default=True)

    farmacos = db.relationship("Farmaco", backref="fornecedor")
