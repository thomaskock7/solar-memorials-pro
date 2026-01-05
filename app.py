from flask import Flask, render_template, request, redirect, url_for, jsonify, session, flash
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import json
import os
from config import Config
from database.connection import get_db, execute_query, execute_single, execute_insert, execute_update
from database.init_db import init_database
from docx_generator import generate_memorial_docx

# Inicializar Flask
app = Flask(__name__)
app.config.from_object(Config)

# Inicializar Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'
login_manager.login_message = 'Por favor, faça login para acessar esta página.'

# Criar pasta de uploads se não existir
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Classe de usuário para Flask-Login
class User(UserMixin):
    def __init__(self, id, email, nome):
        self.id = id
        self.email = email
        self.nome = nome

@login_manager.user_loader
def load_user(user_id):
    """Carrega o usuário da sessão"""
    with get_db() as conn:
        user = conn.execute('SELECT id, email, nome FROM usuarios WHERE id = ?', (user_id,)).fetchone()
        if user:
            return User(user['id'], user['email'], user['nome'])
    return None

# ============================================================================
# ROTAS DE AUTENTICAÇÃO
# ============================================================================

@app.route('/login', methods=['GET', 'POST'])
def login():
    """Página de login"""
    if request.method == 'POST':
        email = request.form.get('email', '').strip()
        senha = request.form.get('senha', '')
        
        if not email or not senha:
            flash('Email e senha são obrigatórios', 'error')
            return redirect(url_for('login'))
        
        with get_db() as conn:
            user = conn.execute('SELECT id, email, nome, senha_hash FROM usuarios WHERE email = ?', (email,)).fetchone()
        
        if user and check_password_hash(user['senha_hash'], senha):
            user_obj = User(user['id'], user['email'], user['nome'])
            login_user(user_obj, remember=True)
            return redirect(url_for('dashboard'))
        else:
            flash('Email ou senha incorretos', 'error')
    
    return render_template('login.html')

@app.route('/registro', methods=['GET', 'POST'])
def registro():
    """Página de registro"""
    if request.method == 'POST':
        email = request.form.get('email', '').strip()
        nome = request.form.get('nome', '').strip()
        senha = request.form.get('senha', '')
        confirmar_senha = request.form.get('confirmar_senha', '')
        
        # Validações
        if not email or not nome or not senha:
            flash('Todos os campos são obrigatórios', 'error')
            return redirect(url_for('registro'))
        
        if senha != confirmar_senha:
            flash('As senhas não correspondem', 'error')
            return redirect(url_for('registro'))
        
        if len(senha) < 6:
            flash('A senha deve ter pelo menos 6 caracteres', 'error')
            return redirect(url_for('registro'))
        
        # Verificar se email já existe
        with get_db() as conn:
            existing = conn.execute('SELECT id FROM usuarios WHERE email = ?', (email,)).fetchone()
        
        if existing:
            flash('Este email já está registrado', 'error')
            return redirect(url_for('registro'))
        
        # Criar novo usuário
        senha_hash = generate_password_hash(senha)
        with get_db() as conn:
            conn.execute(
                'INSERT INTO usuarios (email, nome, senha_hash) VALUES (?, ?, ?)',
                (email, nome, senha_hash)
            )
        
        flash('Registro realizado com sucesso! Faça login para continuar.', 'success')
        return redirect(url_for('login'))
    
    return render_template('registro.html')

@app.route('/logout')
@login_required
def logout():
    """Fazer logout"""
    logout_user()
    flash('Você foi desconectado', 'success')
    return redirect(url_for('login'))

# ============================================================================
# ROTAS DO DASHBOARD
# ============================================================================

@app.route('/')
@app.route('/dashboard')
@login_required
def dashboard():
    """Dashboard principal"""
    with get_db() as conn:
        # Total de projetos
        total_projetos = conn.execute(
            'SELECT COUNT(*) as count FROM projetos WHERE usuario_id = ?',
            (current_user.id,)
        ).fetchone()['count']
        
        # Potência total instalada
        potencia_total = conn.execute(
            'SELECT COALESCE(SUM(potencia_kwp), 0) as total FROM projetos WHERE usuario_id = ?',
            (current_user.id,)
        ).fetchone()['total']
        
        # Projetos concluídos
        projetos_concluidos = conn.execute(
            'SELECT COUNT(*) as count FROM projetos WHERE usuario_id = ? AND status = ?',
            (current_user.id, 'Concluído')
        ).fetchone()['count']
        
        # Total de módulos
        total_modulos = conn.execute(
            'SELECT COALESCE(SUM(quantidade_modulos), 0) as total FROM projetos WHERE usuario_id = ?',
            (current_user.id,)
        ).fetchone()['total']
        
        # Projetos recentes
        projetos_recentes = conn.execute(
            '''SELECT id, nome_cliente, cidade, uf, potencia_kwp, status, data_atualizacao
               FROM projetos WHERE usuario_id = ?
               ORDER BY data_atualizacao DESC LIMIT 10''',
            (current_user.id,)
        ).fetchall()
    
    metricas = {
        'total_projetos': total_projetos,
        'potencia_total': round(potencia_total, 2),
        'projetos_concluidos': projetos_concluidos,
        'total_modulos': int(total_modulos)
    }
    
    return render_template('dashboard.html', metricas=metricas, projetos=projetos_recentes)

# ============================================================================
# ROTAS DE PROJETOS
# ============================================================================

@app.route('/projeto/novo')
@login_required
def novo_projeto():
    """Criar novo projeto"""
    return render_template('editor.html', projeto=None)

@app.route('/projeto/<int:projeto_id>')
@login_required
def editar_projeto(projeto_id):
    """Editar projeto existente"""
    with get_db() as conn:
        projeto = conn.execute(
            'SELECT * FROM projetos WHERE id = ? AND usuario_id = ?',
            (projeto_id, current_user.id)
        ).fetchone()
    
    if not projeto:
        flash('Projeto não encontrado', 'error')
        return redirect(url_for('dashboard'))
    
    # Converter para dicionário
    projeto_dict = dict(projeto)
    
    # Parsear JSON dos campos de equipamentos
    if projeto_dict.get('modulos_novos'):
        projeto_dict['modulos_novos'] = json.loads(projeto_dict['modulos_novos'])
    else:
        projeto_dict['modulos_novos'] = []
    
    if projeto_dict.get('inversores_novos'):
        projeto_dict['inversores_novos'] = json.loads(projeto_dict['inversores_novos'])
    else:
        projeto_dict['inversores_novos'] = []
    
    return render_template('editor.html', projeto=projeto_dict)

@app.route('/api/projeto/salvar', methods=['POST'])
@login_required
def salvar_projeto():
    """API para salvar projeto"""
    try:
        dados = request.json
        projeto_id = dados.get('projeto_id')
        
        # Preparar dados
        nome_cliente = dados.get('nome_cliente', '')
        cpf_cnpj = dados.get('cpf_cnpj', '')
        uc = dados.get('uc', '')
        endereco = dados.get('endereco', '')
        cidade = dados.get('cidade', '')
        uf = dados.get('uf', '')
        cep = dados.get('cep', '')
        concessionaria = dados.get('concessionaria', '')
        data_projeto = dados.get('data_projeto', '')
        tipo_projeto = dados.get('tipo_projeto', '')
        
        modulos_existentes = dados.get('modulos_existentes', 0)
        inversores_existentes = dados.get('inversores_existentes', '')
        
        controlador = dados.get('controlador', '')
        transdutor_tc = dados.get('transdutor_tc', '')
        chave_seccionadora = dados.get('chave_seccionadora', '')
        
        media_consumo = dados.get('media_consumo', 0)
        fator_carga = dados.get('fator_carga', 0)
        fator_ajuste = dados.get('fator_ajuste', 0)
        
        modulos_novos = json.dumps(dados.get('modulos_novos', []))
        inversores_novos = json.dumps(dados.get('inversores_novos', []))
        
        potencia_kwp = dados.get('potencia_kwp', 0)
        geracao_kwh_mes = dados.get('geracao_kwh_mes', 0)
        reducao_percentual = dados.get('reducao_percentual', 0)
        area_arranjos = dados.get('area_arranjos', 0)
        quantidade_modulos = dados.get('quantidade_modulos', 0)
        
        status = dados.get('status', 'Rascunho')
        
        with get_db() as conn:
            if projeto_id:
                # Atualizar projeto existente
                conn.execute('''
                    UPDATE projetos SET
                    nome_cliente = ?, cpf_cnpj = ?, uc = ?, endereco = ?,
                    cidade = ?, uf = ?, cep = ?, concessionaria = ?, data_projeto = ?,
                    tipo_projeto = ?, modulos_existentes = ?, inversores_existentes = ?,
                    controlador = ?, transdutor_tc = ?, chave_seccionadora = ?,
                    media_consumo = ?, fator_carga = ?, fator_ajuste = ?,
                    modulos_novos = ?, inversores_novos = ?,
                    potencia_kwp = ?, geracao_kwh_mes = ?, reducao_percentual = ?,
                    area_arranjos = ?, quantidade_modulos = ?, status = ?,
                    data_atualizacao = CURRENT_TIMESTAMP
                    WHERE id = ? AND usuario_id = ?
                ''', (
                    nome_cliente, cpf_cnpj, uc, endereco, cidade, uf, cep, concessionaria, data_projeto,
                    tipo_projeto, modulos_existentes, inversores_existentes,
                    controlador, transdutor_tc, chave_seccionadora,
                    media_consumo, fator_carga, fator_ajuste,
                    modulos_novos, inversores_novos,
                    potencia_kwp, geracao_kwh_mes, reducao_percentual,
                    area_arranjos, quantidade_modulos, status,
                    projeto_id, current_user.id
                ))
            else:
                # Criar novo projeto
                conn.execute('''
                    INSERT INTO projetos (
                    usuario_id, nome_cliente, cpf_cnpj, uc, endereco,
                    cidade, uf, cep, concessionaria, data_projeto,
                    tipo_projeto, modulos_existentes, inversores_existentes,
                    controlador, transdutor_tc, chave_seccionadora,
                    media_consumo, fator_carga, fator_ajuste,
                    modulos_novos, inversores_novos,
                    potencia_kwp, geracao_kwh_mes, reducao_percentual,
                    area_arranjos, quantidade_modulos, status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    current_user.id, nome_cliente, cpf_cnpj, uc, endereco,
                    cidade, uf, cep, concessionaria, data_projeto,
                    tipo_projeto, modulos_existentes, inversores_existentes,
                    controlador, transdutor_tc, chave_seccionadora,
                    media_consumo, fator_carga, fator_ajuste,
                    modulos_novos, inversores_novos,
                    potencia_kwp, geracao_kwh_mes, reducao_percentual,
                    area_arranjos, quantidade_modulos, status
                ))
        
        return jsonify({'success': True, 'message': 'Projeto salvo com sucesso!'})
    
    except Exception as e:
        return jsonify({'success': False, 'message': f'Erro ao salvar: {str(e)}'}), 400

@app.route('/api/projeto/<int:projeto_id>/gerar-docx', methods=['POST'])
@login_required
def gerar_docx(projeto_id):
    """API para gerar DOCX do memorial"""
    try:
        with get_db() as conn:
            projeto = conn.execute(
                'SELECT * FROM projetos WHERE id = ? AND usuario_id = ?',
                (projeto_id, current_user.id)
            ).fetchone()
        
        if not projeto:
            return jsonify({'success': False, 'message': 'Projeto não encontrado'}), 404
        
        # Converter para dicionário
        projeto_dict = dict(projeto)
        
        # Parsear JSON
        if projeto_dict.get('modulos_novos'):
            projeto_dict['modulos_novos'] = json.loads(projeto_dict['modulos_novos'])
        if projeto_dict.get('inversores_novos'):
            projeto_dict['inversores_novos'] = json.loads(projeto_dict['inversores_novos'])
        
        # Gerar DOCX
        arquivo_path = generate_memorial_docx(projeto_dict)
        
        return jsonify({
            'success': True,
            'message': 'DOCX gerado com sucesso!',
            'arquivo': os.path.basename(arquivo_path)
        })
    
    except Exception as e:
        return jsonify({'success': False, 'message': f'Erro ao gerar DOCX: {str(e)}'}), 400

@app.route('/downloads/<filename>')
@login_required
def download_arquivo(filename):
    """Download de arquivo gerado"""
    from flask import send_file
    arquivo_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    
    if os.path.exists(arquivo_path):
        return send_file(arquivo_path, as_attachment=True)
    
    flash('Arquivo não encontrado', 'error')
    return redirect(url_for('dashboard'))

@app.route('/projeto/<int:projeto_id>/deletar', methods=['POST'])
@login_required
def deletar_projeto(projeto_id):
    """Deletar projeto"""
    try:
        with get_db() as conn:
            conn.execute(
                'DELETE FROM projetos WHERE id = ? AND usuario_id = ?',
                (projeto_id, current_user.id)
            )
        
        flash('Projeto deletado com sucesso', 'success')
        return redirect(url_for('dashboard'))
    except Exception as e:
        flash(f'Erro ao deletar: {str(e)}', 'error')
        return redirect(url_for('dashboard'))

# ============================================================================
# INICIALIZAÇÃO
# ============================================================================

if __name__ == '__main__':
    # Inicializar banco de dados se não existir
    if not os.path.exists(os.path.join(os.path.dirname(__file__), 'solar_memorials.db')):
        init_database()
    
    app.run(debug=True, host='0.0.0.0', port=5000)
