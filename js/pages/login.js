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
    // Flag para evitar inicialização duplicada
    initialized: false,
    
    /**
     * Inicializa a página de login
     */
    init: function() {
        // Evita inicialização duplicada
        if (this.initialized) {
            console.log('Página de login já inicializada');
            return;
        }
        
        console.log('Inicializando página de login');
        
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
        
        this.initialized = true;
    },
    
    /**
     * Configura os event listeners da página
     */
    setupEventListeners: function() {
        // Event listener para o formulário de login
        const loginForm = SistemaTarefas.dom.$('#loginForm');
        if (loginForm) {
            SistemaTarefas.dom.on(loginForm, 'submit', (e) => {
                e.preventDefault();
                this.handleLogin(e);
            });
            
            // Validação em tempo real
            SistemaTarefas.validation.setupRealTimeValidation(
                loginForm, 
                SistemaTarefas.validation.loginForm
            );
        }
        
        // Event listener para Enter nos campos
        const emailField = SistemaTarefas.dom.$('#email');
        const passwordField = SistemaTarefas.dom.$('#senha, #password');
        
        if (emailField && passwordField) {
            SistemaTarefas.dom.on(emailField, 'keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    passwordField.focus();
                }
            });
            
            SistemaTarefas.dom.on(passwordField, 'keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const submitBtn = SistemaTarefas.dom.$('button[type="submit"]', loginForm);
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
            SistemaTarefas.validation.displayErrors(validation.errors, '#loginForm');
            return;
        }
        
        // Limpa erros anteriores
        SistemaTarefas.validation.clearErrors('#loginForm');
        
        // Mostra loading no botão
        this.setButtonLoading(submitBtn, true);
        
        // Simula delay de autenticação
        setTimeout(() => {
            this.authenticateUser(loginData, submitBtn);
        }, 800);
    },
    
    /**
     * Autentica o usuário
     * @param {Object} loginData - Dados de login
     * @param {Element} submitBtn - Botão de submit
     */
    authenticateUser: function(loginData, submitBtn) {
        try {
            // Obtém usuários cadastrados
            const users = SistemaTarefas.storage.getRegisteredUsers();
            
            // Busca usuário por email
            const user = users.find(u => u.email.toLowerCase() === loginData.email.toLowerCase());
            
            if (!user) {
                this.setButtonLoading(submitBtn, false);
                SistemaTarefas.notification.error('Email não encontrado. Verifique seus dados ou cadastre-se.');
                return;
            }
            
            // Verifica senha
            // Suporta tanto senhas em texto plano (legado) quanto hasheadas
            const passwordMatch = user.password === loginData.password || 
                                  user.passwordHash === SistemaTarefas.utils.simpleHash(loginData.password);
            
            if (!passwordMatch) {
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
            if (!SistemaTarefas.storage.saveUser(userData)) {
                this.setButtonLoading(submitBtn, false);
                SistemaTarefas.notification.error('Erro ao salvar sessão. Tente novamente.');
                return;
            }
            
            // Mostra mensagem de sucesso
            SistemaTarefas.notification.success(`Bem-vindo(a), ${user.name}!`);
            
            // Redireciona para o dashboard
            setTimeout(() => {
                window.location.href = SistemaTarefas.config.PAGES.HOME;
            }, 1000);
            
        } catch (error) {
            console.error('Erro na autenticação:', error);
            this.setButtonLoading(submitBtn, false);
            SistemaTarefas.notification.error('Erro interno. Tente novamente.');
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
            button.setAttribute('data-original-text', button.innerHTML);
            button.innerHTML = '<span class="loading"></span> Entrando...';
        } else {
            button.disabled = false;
            const originalText = button.getAttribute('data-original-text');
            button.innerHTML = originalText || 'Entrar';
            button.removeAttribute('data-original-text');
        }
    },
    
    /**
     * Inicializa dados de demonstração
     */
    initDemoData: function() {
        const users = SistemaTarefas.storage.getRegisteredUsers();
        
        // Se não há usuários, cria um usuário de demonstração
        if (users.length === 0) {
            const demoUser = {
                id: SistemaTarefas.utils.generateId(),
                name: 'Usuário Demo',
                email: 'demo@sistema.com',
                password: '123456', // Mantém para compatibilidade
                passwordHash: SistemaTarefas.utils.simpleHash('123456'),
                createdAt: new Date().toISOString()
            };
            
            SistemaTarefas.storage.saveRegisteredUsers([demoUser]);
            console.log('Usuário demo criado');
        }
    }
};

// Inicializa a página quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    // Verifica se estamos na página de login
    const isLoginPage = document.body.classList.contains('login-page') || 
                        document.title.toLowerCase().includes('login') ||
                        window.location.pathname.includes('index.html') ||
                        window.location.pathname === '/' ||
                        window.location.pathname.endsWith('/');
    
    if (isLoginPage) {
        SistemaTarefas.LoginPage.init();
    }
});

