/**
 * PÁGINA DE LOGIN (index.html)
 * 
 * Este arquivo contém toda a lógica da página de login do sistema.
 * Funcionalidades implementadas:
 * - Validação do formulário de login
 * - Autenticação do usuário
 * - Redirecionamento após login
 * - Gerenciamento de sessão
 * 
 * Deve ser carregado apenas na página index.html
 */

// Namespace para a página de login
SistemaTarefas.LoginPage = {
    /**
     * Inicializa a página de login
     */
    init: function() {
        console.log('Página de login inicializada');
        
        // Redireciona se já estiver logado
        SistemaTarefas.auth.redirectIfAuthenticated();
        
        // Configura event listeners
        this.setupEventListeners();
        
        // Inicializa dados de demonstração se necessário
        this.initDemoData();
        
        // Foca no campo de email
        const emailField = SistemaTarefas.dom.$('#email');
        if (emailField) {
            emailField.focus();
        }
    },
    
    /**
     * Configura os event listeners da página
     */
    setupEventListeners: function() {
        // Event listener para o formulário de login
        const loginForm = SistemaTarefas.dom.$('#loginForm, form');
        if (loginForm) {
            SistemaTarefas.dom.on(loginForm, 'submit', (e) => {
                e.preventDefault();
                this.handleLogin(e);
            });
            
            // Validação em tempo real
            SistemaTarefas.validation.setupRealTimeValidation(loginForm, SistemaTarefas.validation.loginForm);
        }
        
        // Event listener para o link de cadastro
        const cadastroLink = SistemaTarefas.dom.$('a[href="cadastro.html"], .cadastro-link');
        if (cadastroLink) {
            SistemaTarefas.dom.on(cadastroLink, 'click', (e) => {
                e.preventDefault();
                window.location.href = SistemaTarefas.config.PAGES.CADASTRO;
            });
        }
        
        // Event listener para mostrar/ocultar senha
        const togglePasswordBtn = SistemaTarefas.dom.$('.toggle-password');
        if (togglePasswordBtn) {
            SistemaTarefas.dom.on(togglePasswordBtn, 'click', this.togglePasswordVisibility);
        }
        
        // Event listeners para campos de entrada
        const emailField = SistemaTarefas.dom.$('#email, input[type="email"]');
        const passwordField = SistemaTarefas.dom.$('#senha, #password, input[type="password"]');
        
        if (emailField) {
            SistemaTarefas.dom.on(emailField, 'keypress', (e) => {
                if (e.key === 'Enter' && passwordField) {
                    passwordField.focus();
                }
            });
        }
        
        if (passwordField) {
            SistemaTarefas.dom.on(passwordField, 'keypress', (e) => {
                if (e.key === 'Enter') {
                    const submitBtn = SistemaTarefas.dom.$('button[type="submit"], .btn-login');
                    if (submitBtn) {
                        submitBtn.click();
                    }
                }
            });
        }
    },
    
    /**
     * Manipula o envio do formulário de login
     * @param {Event} event - Evento de submit
     */
    handleLogin: function(event) {
        const form = event.target;
        const submitBtn = SistemaTarefas.dom.$('button[type="submit"]', form);
        
        // Obtém dados do formulário
        const formData = SistemaTarefas.dom.getFormData(form);
        
        // Normaliza nomes dos campos (compatibilidade)
        const loginData = {
            email: formData.email || formData.usuario,
            password: formData.senha || formData.password
        };
        
        // Valida os dados
        const validation = SistemaTarefas.validation.loginForm(loginData);
        
        if (!validation.isValid) {
            SistemaTarefas.validation.displayErrors(validation.errors);
            return;
        }
        
        // Limpa erros anteriores
        SistemaTarefas.validation.clearErrors();
        
        // Mostra loading no botão
        this.setButtonLoading(submitBtn, true);
        
        // Simula delay de autenticação (em um sistema real seria uma requisição)
        setTimeout(() => {
            this.authenticateUser(loginData, submitBtn);
        }, 1000);
    },
    
    /**
     * Autentica o usuário
     * @param {Object} loginData - Dados de login
     * @param {Element} submitBtn - Botão de submit
     */
    authenticateUser: function(loginData, submitBtn) {
        try {
            // Obtém usuários cadastrados
            const users = this.getRegisteredUsers();
            
            // Busca usuário por email
            const user = users.find(u => u.email.toLowerCase() === loginData.email.toLowerCase());
            
            if (!user) {
                this.setButtonLoading(submitBtn, false);
                SistemaTarefas.notification.error('Email não encontrado. Verifique seus dados ou cadastre-se.');
                return;
            }
            
            // Verifica senha (em um sistema real seria hash)
            if (user.password !== loginData.password) {
                this.setButtonLoading(submitBtn, false);
                SistemaTarefas.notification.error('Senha incorreta. Tente novamente.');
                return;
            }
            
            // Login bem-sucedido
            const userData = {
                id: user.id,
                name: user.name,
                email: user.email,
                loginTime: new Date().toISOString()
            };
            
            // Salva sessão do usuário
            SistemaTarefas.storage.saveUser(userData);
            
            // Mostra mensagem de sucesso
            SistemaTarefas.notification.success(`Bem-vindo(a), ${user.name}!`);
            
            // Redireciona para o dashboard
            setTimeout(() => {
                window.location.href = SistemaTarefas.config.PAGES.HOME;
            }, 1500);
            
        } catch (error) {
            console.error('Erro na autenticação:', error);
            this.setButtonLoading(submitBtn, false);
            SistemaTarefas.notification.error('Erro interno. Tente novamente.');
        }
    },
    
    /**
     * Obtém lista de usuários cadastrados
     * @returns {Array} Lista de usuários
     */
    getRegisteredUsers: function() {
        return SistemaTarefas.storage.get('registered_users', []);
    },
    
    /**
     * Alterna visibilidade da senha
     * @param {Event} event - Evento de clique
     */
    togglePasswordVisibility: function(event) {
        const passwordField = SistemaTarefas.dom.$('#senha, #password, input[type="password"]');
        const toggleBtn = event.target;
        
        if (passwordField) {
            if (passwordField.type === 'password') {
                passwordField.type = 'text';
                toggleBtn.textContent = '🙈';
                toggleBtn.title = 'Ocultar senha';
            } else {
                passwordField.type = 'password';
                toggleBtn.textContent = '👁️';
                toggleBtn.title = 'Mostrar senha';
            }
        }
    },
    
    /**
     * Define estado de loading no botão
     * @param {Element} button - Botão
     * @param {boolean} loading - Se está carregando
     */
    setButtonLoading: function(button, loading) {
        if (!button) return;
        
        if (loading) {
            button.disabled = true;
            button.originalText = button.textContent;
            button.innerHTML = '<span class="loading"></span> Entrando...';
        } else {
            button.disabled = false;
            button.textContent = button.originalText || 'Entrar';
        }
    },
    
    /**
     * Inicializa dados de demonstração
     */
    initDemoData: function() {
        const users = this.getRegisteredUsers();
        
        // Se não há usuários, cria um usuário de demonstração
        if (users.length === 0) {
            const demoUser = {
                id: SistemaTarefas.utils.generateId(),
                name: 'Usuário Demo',
                email: 'demo@sistema.com',
                password: '123456',
                createdAt: new Date().toISOString()
            };
            
            SistemaTarefas.storage.save('registered_users', [demoUser]);
            
            // Mostra informações de login demo
            this.showDemoInfo();
        }
    },
    
    /**
     * Mostra informações de login de demonstração
     */
    showDemoInfo: function() {
        // Cria elemento de informação demo
        const demoInfo = SistemaTarefas.dom.createElement('div', {
            className: 'alert alert-info demo-info',
            style: 'margin-top: 20px; padding: 15px; background-color: #d1ecf1; border: 1px solid #bee5eb; border-radius: 5px; color: #0c5460;'
        }, `
            <h6><strong>🎯 Sistema de Demonstração</strong></h6>
            <p style="margin: 10px 0 5px 0;"><strong>Use estas credenciais para testar:</strong></p>
            <p style="margin: 0;"><strong>Email:</strong> demo@sistema.com</p>
            <p style="margin: 0;"><strong>Senha:</strong> 123456</p>
            <small style="opacity: 0.8;">Ou cadastre-se para criar sua própria conta.</small>
        `);
        
        // Adiciona após o formulário
        const form = SistemaTarefas.dom.$('form');
        if (form && form.parentNode) {
            form.parentNode.insertBefore(demoInfo, form.nextSibling);
        }
    },
    
    /**
     * Preenche campos com dados de demonstração
     */
    fillDemoData: function() {
        const emailField = SistemaTarefas.dom.$('#email, input[type="email"]');
        const passwordField = SistemaTarefas.dom.$('#senha, #password, input[type="password"]');
        
        if (emailField) SistemaTarefas.dom.val(emailField, 'demo@sistema.com');
        if (passwordField) SistemaTarefas.dom.val(passwordField, '123456');
    }
};

// Inicializa a página quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    // Verifica se estamos na página de login
    if (document.body.classList.contains('login-page') || 
        document.title.toLowerCase().includes('login') ||
        window.location.pathname.includes('index.html') ||
        window.location.pathname === '/') {
        
        SistemaTarefas.LoginPage.init();
    }
});

// Adiciona função global para preencher dados demo (pode ser chamada por um botão)
window.preencherDemo = function() {
    SistemaTarefas.LoginPage.fillDemoData();
};

