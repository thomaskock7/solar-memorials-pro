import sqlite3
import os
from pathlib import Path

def init_database():
    """Inicializa o banco de dados com o schema"""
    db_path = os.path.join(os.path.dirname(__file__), '..', 'solar_memorials.db')
    schema_path = os.path.join(os.path.dirname(__file__), 'schema.sql')
    
    # Criar conexão
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Ler e executar o schema
    with open(schema_path, 'r', encoding='utf-8') as f:
        schema = f.read()
        cursor.executescript(schema)
    
    conn.commit()
    conn.close()
    
    print(f"✓ Banco de dados inicializado em: {db_path}")

if __name__ == '__main__':
    init_database()
