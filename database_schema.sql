-- Tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    nome TEXT NOT NULL,
    senha_hash TEXT NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de projetos
CREATE TABLE IF NOT EXISTS projetos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    nome_cliente TEXT NOT NULL,
    cpf_cnpj TEXT,
    uc TEXT,
    endereco TEXT,
    cidade TEXT,
    uf TEXT,
    cep TEXT,
    concessionaria TEXT,
    data_projeto DATE,
    tipo_projeto TEXT,
    
    -- Ampliação
    modulos_existentes INTEGER,
    inversores_existentes TEXT,
    
    -- Grid Zero
    controlador TEXT,
    transdutor_tc TEXT,
    chave_seccionadora TEXT,
    
    -- Art. 73-A
    media_consumo REAL,
    fator_carga REAL,
    fator_ajuste REAL,
    
    -- Novo Sistema
    modulos_novos TEXT,
    inversores_novos TEXT,
    
    -- Totais
    potencia_kwp REAL,
    geracao_kwh_mes REAL,
    reducao_percentual REAL,
    area_arranjos REAL,
    quantidade_modulos INTEGER,
    
    -- Status e datas
    status TEXT DEFAULT 'Rascunho',
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_projetos_usuario ON projetos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_projetos_status ON projetos(status);
