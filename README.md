# Solar Memorials - Plataforma de Memoriais Fotovoltaicos

Uma plataforma web profissional para geração de memoriais descritivos fotovoltaicos para homologação em concessionárias (EDP, CEMIG, etc).

## 🚀 Características

- **Autenticação Segura**: Sistema de login e registro com hash de senha
- **Dashboard Intuitivo**: Visualização de métricas e projetos recentes
- **Editor de Memorial Completo**: Formulário dinâmico com múltiplos tipos de projeto
- **Geração de DOCX**: Exportação automática de memoriais em formato Word
- **Design Dark Theme**: Interface moderna e profissional
- **Responsivo**: Funciona perfeitamente em desktop e mobile

## 📋 Funcionalidades

### 1. Autenticação
- Tela de login com email/senha
- Registro de novos usuários
- Proteção de rotas (login_required)
- Gerenciamento de sessão

### 2. Dashboard
- Métricas grandes:
  - Total de projetos criados
  - Potência total instalada (kWp)
  - Número de projetos concluídos
  - Total de módulos instalados
- Lista de projetos recentes com status

### 3. Editor de Memorial
- Dados do cliente (nome, CPF/CNPJ, UC, endereço, etc)
- Tipo de projeto (Instalação Nova, Ampliação, Grid Zero, Art. 73-A)
- Seções dinâmicas que aparecem/ocultam conforme o tipo
- Adição dinâmica de módulos e inversores
- Cálculo automático de totais
- Preenchimento de demo para testes

### 4. Geração de DOCX
- Template profissional com placeholders Jinja
- Suporte para todos os tipos de projeto
- Loops para múltiplos equipamentos
- Download automático do documento

## 🛠️ Instalação

### Pré-requisitos
- Python 3.8+
- pip

### Passos

1. **Clone ou extraia o projeto**
```bash
cd solar-memorials
```

2. **Instale as dependências**
```bash
pip install -r requirements.txt
```

3. **O banco de dados será criado automaticamente** na primeira execução

4. **Execute a aplicação**
```bash
python app.py
```

5. **Acesse no navegador**
```
http://localhost:5000
```

## 📝 Uso

### Primeiro Acesso
1. Clique em "Registre-se aqui" na página de login
2. Preencha seus dados (nome, email, senha)
3. Faça login com suas credenciais

### Criar um Projeto
1. No dashboard, clique em "Novo Projeto"
2. Preencha os dados do cliente
3. Selecione o tipo de projeto
4. Adicione módulos e inversores
5. Clique em "Salvar Projeto"

### Gerar Memorial em DOCX
1. Abra um projeto existente
2. Clique em "Gerar DOCX"
3. O arquivo será baixado automaticamente

### Usar Demo
1. No editor, clique em "Preencher Demo"
2. O formulário será preenchido com dados de exemplo
3. Útil para testar a funcionalidade

## 📁 Estrutura do Projeto

```
solar-memorials/
├── app.py                      # Aplicação Flask principal
├── config.py                   # Configurações
├── docx_generator.py          # Gerador de DOCX
├── requirements.txt           # Dependências
├── database/
│   ├── __init__.py
│   ├── connection.py          # Conexão com banco de dados
│   ├── init_db.py            # Inicialização do banco
│   └── schema.sql            # Schema do banco de dados
├── templates/
│   ├── login.html            # Página de login
│   ├── registro.html         # Página de registro
│   ├── dashboard.html        # Dashboard
│   ├── editor.html           # Editor de memorial
│   └── modelo_memorial_v2.docx # Template DOCX
├── static/
│   ├── css/
│   │   └── style.css         # Estilos CSS
│   └── js/
│       └── main.js           # JavaScript interativo
└── solar_memorials.db        # Banco de dados SQLite
```

## 🗄️ Banco de Dados

### Tabelas

**usuarios**
- id (INTEGER PRIMARY KEY)
- email (TEXT UNIQUE)
- nome (TEXT)
- senha_hash (TEXT)
- data_criacao (TIMESTAMP)

**projetos**
- id (INTEGER PRIMARY KEY)
- usuario_id (INTEGER FOREIGN KEY)
- nome_cliente, cpf_cnpj, uc, endereco, cidade, uf, cep, concessionaria
- data_projeto, tipo_projeto
- modulos_existentes, inversores_existentes (para Ampliação)
- controlador, transdutor_tc, chave_seccionadora (para Grid Zero)
- media_consumo, fator_carga, fator_ajuste (para Art. 73-A)
- modulos_novos, inversores_novos (JSON)
- potencia_kwp, geracao_kwh_mes, reducao_percentual, area_arranjos, quantidade_modulos
- status, data_criacao, data_atualizacao

## 🎨 Design

- **Tema**: Dark Mode profissional
- **Cores principais**: 
  - Primária: #00d4ff (Cyan)
  - Secundária: #1a1a2e (Dark Navy)
  - Fundo: #0f0f1e (Very Dark)
- **Fontes**: Inter (corpo), Poppins (títulos)
- **Layout**: Sidebar fixa + conteúdo responsivo

## 🔐 Segurança

- Senhas com hash usando Werkzeug
- Proteção de rotas com Flask-Login
- CSRF protection (implementar em produção)
- Session management seguro

## 📦 Dependências

- Flask 3.0+ - Framework web
- Flask-Login 0.6+ - Gerenciamento de autenticação
- Werkzeug 3.0+ - Utilitários de segurança
- docxtpl 0.16+ - Template para DOCX
- python-docx 0.8+ - Manipulação de DOCX

## 🚀 Deployment

Para colocar em produção:

1. Mude `debug=False` em `app.py`
2. Use um servidor WSGI como Gunicorn:
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

3. Configure um reverse proxy (Nginx/Apache)
4. Use HTTPS com certificado SSL
5. Mude `SESSION_COOKIE_SECURE = True` em `config.py`

## 📞 Suporte

Para dúvidas ou problemas, verifique:
- Os logs da aplicação
- O console do navegador (F12)
- O banco de dados SQLite

## 📄 Licença

Este projeto é fornecido como está para fins de demonstração e uso profissional.

---

**Desenvolvido com ❤️ para a indústria solar brasileira**
