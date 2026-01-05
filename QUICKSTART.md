# Quick Start - Solar Memorials

## Execução Rápida

### 1. Instale as dependências
```bash
pip install -r requirements.txt
```

### 2. Execute a aplicação
```bash
python app.py
```

### 3. Acesse no navegador
```
http://localhost:5000
```

## Credenciais de Teste

Após a primeira execução, crie uma conta:
- Email: teste@solar.com
- Senha: senha123

## Funcionalidades Principais

1. **Login/Registro**: Crie sua conta na primeira tela
2. **Dashboard**: Visualize métricas e projetos
3. **Novo Projeto**: Clique em "Novo Projeto" para começar
4. **Preencher Demo**: Use o botão "Preencher Demo" para testar com dados de exemplo
5. **Salvar**: Clique em "Salvar Projeto" para guardar
6. **Gerar DOCX**: Clique em "Gerar DOCX" para exportar o memorial

## Tipos de Projeto Suportados

- **Instalação Nova**: Sistema novo do zero
- **Ampliação**: Adição a sistema existente
- **Grid Zero**: Sistema isolado (sem conexão à rede)
- **Art. 73-A**: Projeto com cálculo especial de potência

## Estrutura de Arquivos

```
app.py                 # Aplicação principal
config.py              # Configurações
docx_generator.py      # Gerador de documentos
requirements.txt       # Dependências
database/              # Banco de dados
templates/             # HTML
static/                # CSS e JavaScript
```

## Troubleshooting

**Erro: ModuleNotFoundError**
```bash
pip install -r requirements.txt
```

**Erro: Database locked**
- Feche outras instâncias da aplicação

**Porta 5000 em uso**
- Mude em app.py: `app.run(port=5001)`

## Próximos Passos

1. Customize o template DOCX em `templates/modelo_memorial_v2.docx`
2. Adicione mais campos conforme necessário
3. Implemente autenticação OAuth para produção
4. Configure backup automático do banco de dados

---

Desenvolvido para a indústria solar brasileira
