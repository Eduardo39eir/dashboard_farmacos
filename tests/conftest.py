import os
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
os.environ['DATABASE_URL'] = 'sqlite://'
os.environ['JWT_SECRET_KEY'] = 'chave-exclusiva-de-testes-sem-uso-em-producao'
import pytest
from app import app, db, Usuario
from werkzeug.security import generate_password_hash

@pytest.fixture()
def client():
    app.config.update(TESTING=True)
    with app.app_context():
        db.create_all()
        db.session.add(Usuario(nome='Admin Teste', email='admin@example.test',
                              senha=generate_password_hash('senha-forte-teste'), administrador=True))
        db.session.add(Usuario(nome='Leitor', email='leitor@example.test',
                              senha=generate_password_hash('senha-forte-teste'), administrador=False))
        db.session.commit()
    yield app.test_client()
    with app.app_context():
        db.session.remove()
        db.drop_all()

@pytest.fixture()
def headers(client):
    resposta = client.post('/api/login', json={'email':'admin@example.test','senha':'senha-forte-teste'})
    return {'Authorization':'Bearer '+resposta.json['token']}
