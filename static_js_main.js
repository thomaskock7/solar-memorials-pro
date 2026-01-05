// ============================================================================
// UTILIDADES GLOBAIS
// ============================================================================

const API = {
    salvarProjeto: '/api/projeto/salvar',
    gerarDocx: (id) => `/api/projeto/${id}/gerar-docx`,
};

function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.innerHTML = `
        <span>${message}</span>
        <span class="alert-close" onclick="this.parentElement.remove()">×</span>
    `;
    
    const container = document.querySelector('.content') || document.body;
    container.insertBefore(alertDiv, container.firstChild);
    
    setTimeout(() => alertDiv.remove(), 5000);
}

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

function formatNumber(value, decimals = 2) {
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(value);
}

// ============================================================================
// MÁSCARAS DE ENTRADA
// ============================================================================

function applyMasks() {
    // CPF/CNPJ
    document.querySelectorAll('[data-mask="cpf-cnpj"]').forEach(input => {
        input.addEventListener('input', function() {
            let value = this.value.replace(/\D/g, '');
            if (value.length <= 11) {
                value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
            } else {
                value = value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
            }
            this.value = value;
        });
    });
    
    // CEP
    document.querySelectorAll('[data-mask="cep"]').forEach(input => {
        input.addEventListener('input', function() {
            let value = this.value.replace(/\D/g, '');
            value = value.replace(/(\d{5})(\d{3})/, '$1-$2');
            this.value = value;
        });
    });
    
    // Telefone
    document.querySelectorAll('[data-mask="phone"]').forEach(input => {
        input.addEventListener('input', function() {
            let value = this.value.replace(/\D/g, '');
            value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
            this.value = value;
        });
    });
    
    // Números decimais
    document.querySelectorAll('[data-mask="decimal"]').forEach(input => {
        input.addEventListener('input', function() {
            let value = this.value.replace(/[^\d.]/g, '');
            const parts = value.split('.');
            if (parts.length > 2) {
                value = parts[0] + '.' + parts.slice(1).join('');
            }
            this.value = value;
        });
    });
}

// ============================================================================
// EDITOR DE MEMORIAL
// ============================================================================

class MemorialEditor {
    constructor() {
        this.projeto = null;
        this.modulos = [];
        this.inversores = [];
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadProjectData();
        applyMasks();
    }
    
    setupEventListeners() {
        // Tipo de projeto
        document.querySelectorAll('input[name="tipo_projeto"]').forEach(radio => {
            radio.addEventListener('change', () => this.toggleSections());
        });
        
        // Botões de adicionar
        document.getElementById('btn-add-modulo')?.addEventListener('click', () => this.addModulo());
        document.getElementById('btn-add-inversor')?.addEventListener('click', () => this.addInversor());
        
        // Botões de ação
        document.getElementById('btn-salvar')?.addEventListener('click', () => this.salvarProjeto());
        document.getElementById('btn-gerar-docx')?.addEventListener('click', () => this.gerarDocx());
        document.getElementById('btn-demo')?.addEventListener('click', () => this.preencherDemo());
        
        // Cálculos automáticos
        document.querySelectorAll('[data-calculate]').forEach(input => {
            input.addEventListener('change', () => this.calcularTotais());
        });
    }
    
    loadProjectData() {
        // Verificar se há dados de projeto na página
        const projectDataEl = document.getElementById('project-data');
        if (projectDataEl) {
            try {
                this.projeto = JSON.parse(projectDataEl.textContent);
                this.populateForm();
            } catch (e) {
                console.error('Erro ao carregar dados do projeto:', e);
            }
        }
    }
    
    populateForm() {
        if (!this.projeto) return;
        
        // Preencher campos básicos
        document.getElementById('nome_cliente').value = this.projeto.nome_cliente || '';
        document.getElementById('cpf_cnpj').value = this.projeto.cpf_cnpj || '';
        document.getElementById('uc').value = this.projeto.uc || '';
        document.getElementById('endereco').value = this.projeto.endereco || '';
        document.getElementById('cidade').value = this.projeto.cidade || '';
        document.getElementById('uf').value = this.projeto.uf || '';
        document.getElementById('cep').value = this.projeto.cep || '';
        document.getElementById('concessionaria').value = this.projeto.concessionaria || '';
        document.getElementById('data_projeto').value = this.projeto.data_projeto || '';
        
        // Tipo de projeto
        const tipoRadio = document.querySelector(`input[name="tipo_projeto"][value="${this.projeto.tipo_projeto}"]`);
        if (tipoRadio) {
            tipoRadio.checked = true;
            this.toggleSections();
        }
        
        // Campos específicos por tipo
        if (this.projeto.tipo_projeto === 'Ampliação') {
            document.getElementById('modulos_existentes').value = this.projeto.modulos_existentes || 0;
            document.getElementById('inversores_existentes').value = this.projeto.inversores_existentes || '';
        }
        
        if (this.projeto.tipo_projeto === 'Grid Zero') {
            document.getElementById('controlador').value = this.projeto.controlador || '';
            document.getElementById('transdutor_tc').value = this.projeto.transdutor_tc || '';
            document.getElementById('chave_seccionadora').value = this.projeto.chave_seccionadora || '';
        }
        
        if (this.projeto.tipo_projeto === 'Art. 73-A') {
            document.getElementById('media_consumo').value = this.projeto.media_consumo || 0;
            document.getElementById('fator_carga').value = this.projeto.fator_carga || 0;
            document.getElementById('fator_ajuste').value = this.projeto.fator_ajuste || 0;
        }
        
        // Carregar módulos e inversores
        if (this.projeto.modulos_novos && Array.isArray(this.projeto.modulos_novos)) {
            this.modulos = this.projeto.modulos_novos;
            this.renderModulos();
        }
        
        if (this.projeto.inversores_novos && Array.isArray(this.projeto.inversores_novos)) {
            this.inversores = this.projeto.inversores_novos;
            this.renderInversores();
        }
        
        // Totais
        document.getElementById('potencia_kwp').value = this.projeto.potencia_kwp || 0;
        document.getElementById('geracao_kwh_mes').value = this.projeto.geracao_kwh_mes || 0;
        document.getElementById('reducao_percentual').value = this.projeto.reducao_percentual || 0;
        document.getElementById('area_arranjos').value = this.projeto.area_arranjos || 0;
        document.getElementById('quantidade_modulos').value = this.projeto.quantidade_modulos || 0;
    }
    
    toggleSections() {
        const tipo = document.querySelector('input[name="tipo_projeto"]:checked').value;
        
        // Ocultar todas as seções
        document.querySelectorAll('[data-section]').forEach(el => {
            el.style.display = 'none';
        });
        
        // Mostrar seções relevantes
        document.querySelector('[data-section="ampliacao"]').style.display = 
            tipo === 'Ampliação' ? 'block' : 'none';
        document.querySelector('[data-section="grid-zero"]').style.display = 
            tipo === 'Grid Zero' ? 'block' : 'none';
        document.querySelector('[data-section="art73a"]').style.display = 
            tipo === 'Art. 73-A' ? 'block' : 'none';
    }
    
    addModulo() {
        const modulo = {
            id: Date.now(),
            modelo: '',
            potencia: 0,
            quantidade: 0
        };
        this.modulos.push(modulo);
        this.renderModulos();
    }
    
    removeModulo(id) {
        this.modulos = this.modulos.filter(m => m.id !== id);
        this.renderModulos();
    }
    
    renderModulos() {
        const container = document.getElementById('modulos-list');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.modulos.forEach(modulo => {
            const div = document.createElement('div');
            div.className = 'dynamic-item';
            div.innerHTML = `
                <div class="dynamic-item-header">
                    <span class="dynamic-item-title">Módulo ${this.modulos.indexOf(modulo) + 1}</span>
                    <button type="button" class="btn-remove" onclick="editor.removeModulo(${modulo.id})">Remover</button>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Modelo</label>
                        <input type="text" value="${modulo.modelo}" 
                            onchange="editor.updateModulo(${modulo.id}, 'modelo', this.value)">
                    </div>
                    <div class="form-group">
                        <label>Potência (W)</label>
                        <input type="number" value="${modulo.potencia}" 
                            onchange="editor.updateModulo(${modulo.id}, 'potencia', this.value)">
                    </div>
                    <div class="form-group">
                        <label>Quantidade</label>
                        <input type="number" value="${modulo.quantidade}" 
                            onchange="editor.updateModulo(${modulo.id}, 'quantidade', this.value)">
                    </div>
                </div>
            `;
            container.appendChild(div);
        });
    }
    
    updateModulo(id, field, value) {
        const modulo = this.modulos.find(m => m.id === id);
        if (modulo) {
            modulo[field] = isNaN(value) ? value : parseFloat(value);
            this.calcularTotais();
        }
    }
    
    addInversor() {
        const inversor = {
            id: Date.now(),
            modelo: '',
            potencia: 0,
            quantidade: 0
        };
        this.inversores.push(inversor);
        this.renderInversores();
    }
    
    removeInversor(id) {
        this.inversores = this.inversores.filter(i => i.id !== id);
        this.renderInversores();
    }
    
    renderInversores() {
        const container = document.getElementById('inversores-list');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.inversores.forEach(inversor => {
            const div = document.createElement('div');
            div.className = 'dynamic-item';
            div.innerHTML = `
                <div class="dynamic-item-header">
                    <span class="dynamic-item-title">Inversor ${this.inversores.indexOf(inversor) + 1}</span>
                    <button type="button" class="btn-remove" onclick="editor.removeInversor(${inversor.id})">Remover</button>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Modelo</label>
                        <input type="text" value="${inversor.modelo}" 
                            onchange="editor.updateInversor(${inversor.id}, 'modelo', this.value)">
                    </div>
                    <div class="form-group">
                        <label>Potência (W)</label>
                        <input type="number" value="${inversor.potencia}" 
                            onchange="editor.updateInversor(${inversor.id}, 'potencia', this.value)">
                    </div>
                    <div class="form-group">
                        <label>Quantidade</label>
                        <input type="number" value="${inversor.quantidade}" 
                            onchange="editor.updateInversor(${inversor.id}, 'quantidade', this.value)">
                    </div>
                </div>
            `;
            container.appendChild(div);
        });
    }
    
    updateInversor(id, field, value) {
        const inversor = this.inversores.find(i => i.id === id);
        if (inversor) {
            inversor[field] = isNaN(value) ? value : parseFloat(value);
            this.calcularTotais();
        }
    }
    
    calcularTotais() {
        // Calcular potência total
        let potenciaTotal = 0;
        this.modulos.forEach(m => {
            potenciaTotal += (m.potencia * m.quantidade) / 1000; // Converter para kW
        });
        
        // Calcular quantidade total de módulos
        let totalModulos = 0;
        this.modulos.forEach(m => {
            totalModulos += m.quantidade;
        });
        
        // Atualizar campos
        document.getElementById('potencia_kwp').value = potenciaTotal.toFixed(2);
        document.getElementById('quantidade_modulos').value = totalModulos;
    }
    
    preencherDemo() {
        document.getElementById('nome_cliente').value = 'João Silva';
        document.getElementById('cpf_cnpj').value = '123.456.789-00';
        document.getElementById('uc').value = '1234567890';
        document.getElementById('endereco').value = 'Rua das Flores, 123';
        document.getElementById('cidade').value = 'São Paulo';
        document.getElementById('uf').value = 'SP';
        document.getElementById('cep').value = '01310-100';
        document.getElementById('concessionaria').value = 'EDP';
        document.getElementById('data_projeto').value = new Date().toISOString().split('T')[0];
        
        // Selecionar tipo
        document.querySelector('input[name="tipo_projeto"][value="Instalação Nova"]').checked = true;
        this.toggleSections();
        
        // Adicionar módulos de exemplo
        this.modulos = [
            { id: 1, modelo: 'Sunova 550W', potencia: 550, quantidade: 20 },
            { id: 2, modelo: 'Sunova 550W', potencia: 550, quantidade: 20 }
        ];
        this.renderModulos();
        
        // Adicionar inversores de exemplo
        this.inversores = [
            { id: 1, modelo: 'Fronius Symo 10.0', potencia: 10000, quantidade: 1 }
        ];
        this.renderInversores();
        
        // Preencher totais
        document.getElementById('potencia_kwp').value = '22.00';
        document.getElementById('geracao_kwh_mes').value = '2640';
        document.getElementById('reducao_percentual').value = '95';
        document.getElementById('area_arranjos').value = '58.5';
        document.getElementById('quantidade_modulos').value = '40';
        
        showAlert('Formulário preenchido com dados de exemplo!', 'success');
    }
    
    async salvarProjeto() {
        // Validar campos obrigatórios
        const nome_cliente = document.getElementById('nome_cliente').value.trim();
        if (!nome_cliente) {
            showAlert('Nome do cliente é obrigatório', 'error');
            return;
        }
        
        const dados = {
            projeto_id: this.projeto?.id || null,
            nome_cliente: document.getElementById('nome_cliente').value,
            cpf_cnpj: document.getElementById('cpf_cnpj').value,
            uc: document.getElementById('uc').value,
            endereco: document.getElementById('endereco').value,
            cidade: document.getElementById('cidade').value,
            uf: document.getElementById('uf').value,
            cep: document.getElementById('cep').value,
            concessionaria: document.getElementById('concessionaria').value,
            data_projeto: document.getElementById('data_projeto').value,
            tipo_projeto: document.querySelector('input[name="tipo_projeto"]:checked').value,
            
            modulos_existentes: document.getElementById('modulos_existentes')?.value || 0,
            inversores_existentes: document.getElementById('inversores_existentes')?.value || '',
            
            controlador: document.getElementById('controlador')?.value || '',
            transdutor_tc: document.getElementById('transdutor_tc')?.value || '',
            chave_seccionadora: document.getElementById('chave_seccionadora')?.value || '',
            
            media_consumo: document.getElementById('media_consumo')?.value || 0,
            fator_carga: document.getElementById('fator_carga')?.value || 0,
            fator_ajuste: document.getElementById('fator_ajuste')?.value || 0,
            
            modulos_novos: this.modulos,
            inversores_novos: this.inversores,
            
            potencia_kwp: document.getElementById('potencia_kwp').value,
            geracao_kwh_mes: document.getElementById('geracao_kwh_mes').value,
            reducao_percentual: document.getElementById('reducao_percentual').value,
            area_arranjos: document.getElementById('area_arranjos').value,
            quantidade_modulos: document.getElementById('quantidade_modulos').value,
            
            status: 'Rascunho'
        };
        
        try {
            const response = await fetch(API.salvarProjeto, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dados)
            });
            
            const result = await response.json();
            
            if (result.success) {
                showAlert(result.message, 'success');
                if (!this.projeto) {
                    setTimeout(() => {
                        window.location.href = '/dashboard';
                    }, 1500);
                }
            } else {
                showAlert(result.message, 'error');
            }
        } catch (error) {
            showAlert('Erro ao salvar projeto: ' + error.message, 'error');
        }
    }
    
    async gerarDocx() {
        if (!this.projeto?.id) {
            showAlert('Salve o projeto antes de gerar o DOCX', 'warning');
            return;
        }
        
        try {
            const response = await fetch(API.gerarDocx(this.projeto.id), {
                method: 'POST'
            });
            
            const result = await response.json();
            
            if (result.success) {
                showAlert(result.message, 'success');
                // Iniciar download
                window.location.href = `/downloads/${result.arquivo}`;
            } else {
                showAlert(result.message, 'error');
            }
        } catch (error) {
            showAlert('Erro ao gerar DOCX: ' + error.message, 'error');
        }
    }
}

// ============================================================================
// INICIALIZAÇÃO
// ============================================================================

let editor;

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar editor se estiver na página de edição
    if (document.getElementById('editor-form')) {
        editor = new MemorialEditor();
    }
    
    // Aplicar máscaras
    applyMasks();
    
    // Sidebar mobile
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }
    
    // Fechar sidebar ao clicar em um link
    document.querySelectorAll('.sidebar-nav-link, .projects-list-item').forEach(link => {
        link.addEventListener('click', () => {
            sidebar.classList.remove('open');
        });
    });
});
