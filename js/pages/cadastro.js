/**
 * PÁGINA DE CADASTRO (cadastro.html)
 * 
 * Este arquivo contém toda a lógica da página de cadastro do sistema.
 * Funcionalidades implementadas:
 * - Validação do formulário de cadastro
 * - Registro de novos usuários
 * - Verificação de email duplicado
 * - Redirecionamento após cadastro
 * 
 * Deve ser carregado apenas na página cadastro.html
 */

// Namespace para a página de cadastro
SistemaTarefas.CadastroPage = {
    /**
     * Inicializa a página de cadastro
     */
    init: function() {
        console.log('Página de cadastro inicializada');
        
        // Redireciona se já estiver logado
        SistemaTarefas.auth.redirectIfAuthenticated();
        
        // Configura event listeners
        this.setupEventListeners();
        
        // Foca no campo de nome
        const nameField = SistemaTarefas.dom.$('#nome, #name, input[name="nome"], input[name="name"]');
        if (nameField) {
            nameField.focus();
        }
    },
    
    /**
     * Configura os event listeners da página
     */
    setupEventListeners: function() {
        // Event listener para o formulário de cadastro
        const cadastroForm = SistemaTarefas.dom.$('#cadastroForm, form');
        if (cadastroForm) {
            SistemaTarefas.dom.on(cadastroForm, 'submit', (e) => {
                e.preventDefault();
                this.handleCadastro(e);
            });
            
            // Validação em tempo real
            SistemaTarefas.validation.setupRealTimeValidation(cadastroForm, SistemaTarefas.validation.registerForm);
        }
        
        // Event listener para o link de login
        const loginLink = SistemaTarefas.dom.$('a[href="index.html"], .login-link');
        if (loginLink) {
            SistemaTarefas.dom.on(loginLink, 'click', (e) => {
                e.preventDefault();
                window.location.href = SistemaTarefas.config.PAGES.LOGIN;
            });
        }
        
        // Event listener para mostrar/ocultar senha
        const togglePasswordBtns = SistemaTarefas.dom.$$('.toggle-password');
        togglePasswordBtns.forEach(btn => {
            SistemaTarefas.dom.on(btn, 'click', this.togglePasswordVisibility);
        });
        
        // Event listener para verificação de email em tempo real
        const emailField = SistemaTarefas.dom.$('#email, input[type="email"]');
        if (emailField) {
            SistemaTarefas.dom.on(emailField, 'blur', () => {
                this.checkEmailAvailability(emailField.value);
            });
        }
        
        // Event listener para confirmação de senha em tempo real
        const confirmPasswordField = SistemaTarefas.dom.$('#confirmarSenha, #confirmPassword, input[name="confirmarSenha"]');
        if (confirmPasswordField) {
            SistemaTarefas.dom.on(confirmPasswordField, 'input', () => {
                this.validatePasswordConfirmation();
            });
        }
        
        // Navegação entre campos com Enter
        this.setupFieldNavigation();
    },
    
    /**
     * Configura navegação entre campos com Enter
     */
    setupFieldNavigation: function() {
        const fields = [
            '#nome, #name, input[name="nome"], input[name="name"]',
            '#email, input[type="email"]',
            '#senha, #password, input[name="senha"], input[name="password"]',
            '#confirmarSenha, #confirmPassword, input[name="confirmarSenha"]'
        ];
        
        fields.forEach((selector, index) => {
            const field = SistemaTarefas.dom.$(selector);
            if (field) {
                SistemaTarefas.dom.on(field, 'keypress', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        const nextIndex = index + 1;
                        if (nextIndex < fields.length) {
                            const nextField = SistemaTarefas.dom.$(fields[nextIndex]);
                            if (nextField) {
                                nextField.focus();
                            }
                        } else {
                            // Último campo, submete o formulário
                            const submitBtn = SistemaTarefas.dom.$('button[type="submit"]');
                            if (submitBtn) {
                                submitBtn.click();
                            }
                        }
                    }
                });
            }
        });
    },
    
    /**
     * Manipula o envio do formulário de cadastro
     * @param {Event} event - Evento de submit
     */
    handleCadastro: function(event) {
        const form = event.target;
        const submitBtn = SistemaTarefas.dom.$('button[type="submit"]', form);
        
        // Obtém dados do formulário
        const formData = SistemaTarefas.dom.getFormData(form);
        
        // Normaliza nomes dos campos (compatibilidade)
        const cadastroData = {
            name: formData.nome || formData.name,
            email: formData.email,
            password: formData.senha || formData.password,
            confirmPassword: formData.confirmarSenha || formData.confirmPassword
        };
        
        // Valida os dados
        const validation = SistemaTarefas.validation.registerForm(cadastroData);
        
        if (!validation.isValid) {
            SistemaTarefas.validation.displayErrors(validation.errors);
            return;
        }
        
        // Limpa erros anteriores
        SistemaTarefas.validation.clearErrors();
        
        // Mostra loading no botão
        this.setButtonLoading(submitBtn, true);
        
        // Simula delay de cadastro (em um sistema real seria uma requisição)
        setTimeout(() => {
            this.registerUser(cadastroData, submitBtn);
        }, 1000);
    },
    
    /**
     * Registra um novo usuário
     * @param {Object} cadastroData - Dados de cadastro
     * @param {Element} submitBtn - Botão de submit
     */
    registerUser: function(cadastroData, submitBtn) {
        try {
            // Verifica se email já existe
            if (this.isEmailTaken(cadastroData.email)) {
                this.setButtonLoading(submitBtn, false);
                SistemaTarefas.notification.error('Este email já está cadastrado. Use outro email ou faça login.');
                return;
            }
            
            // Cria novo usuário
            const newUser = {
                id: SistemaTarefas.utils.generateId(),
                name: cadastroData.name.trim(),
                email: cadastroData.email.toLowerCase().trim(),
                password: cadastroData.password, // Em um sistema real seria hash
                createdAt: new Date().toISOString()
            };
            
            // Salva usuário
            const users = this.getRegisteredUsers();
            users.push(newUser);
            SistemaTarefas.storage.save('registered_users', users);
            
            // Cadastro bem-sucedido
            SistemaTarefas.notification.success(`Cadastro realizado com sucesso! Bem-vindo(a), ${newUser.name}!`);
            
            // Faz login automático
            const userData = {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                loginTime: new Date().toISOString()
            };
            
            SistemaTarefas.storage.saveUser(userData);
            
            // Inicializa dados padrão para o novo usuário
            this.initUserDefaultData(newUser.id);
            
            // Redireciona para o dashboard
            setTimeout(() => {
                window.location.href = SistemaTarefas.config.PAGES.HOME;
            }, 2000);
            
        } catch (error) {
            console.error('Erro no cadastro:', error);
            this.setButtonLoading(submitBtn, false);
            SistemaTarefas.notification.error('Erro interno. Tente novamente.');
        }
    },
    
    /**
     * Verifica se um email já está cadastrado
     * @param {string} email - Email a ser verificado
     * @returns {boolean} True se já existe
     */
    isEmailTaken: function(email) {
        const users = this.getRegisteredUsers();
        return users.some(user => user.email.toLowerCase() === email.toLowerCase());
    },
    
    /**
     * Verifica disponibilidade do email
     * @param {string} email - Email a ser verificado
     */
    checkEmailAvailability: function(email) {
        if (!email || !SistemaTarefas.validation.email(email).isValid) {
            return;
        }
        
        const emailField = SistemaTarefas.dom.$('#email, input[type="email"]');
        if (!emailField) return;
        
        // Remove indicadores anteriores
        this.removeEmailIndicators(emailField);
        
        if (this.isEmailTaken(email)) {
            // Email já existe
            SistemaTarefas.dom.addClass(emailField, 'is-invalid');
            const errorElement = SistemaTarefas.dom.createElement('div', {
                className: 'invalid-feedback'
            }, 'Este email já está cadastrado');
            emailField.parentNode.appendChild(errorElement);
        } else {
            // Email disponível
            SistemaTarefas.dom.addClass(emailField, 'is-valid');
            const successElement = SistemaTarefas.dom.createElement('div', {
                className: 'valid-feedback'
            }, 'Email disponível');
            emailField.parentNode.appendChild(successElement);
        }
    },
    
    /**
     * Remove indicadores de email
     * @param {Element} emailField - Campo de email
     */
    removeEmailIndicators: function(emailField) {
        SistemaTarefas.dom.removeClass(emailField, 'is-valid');
        SistemaTarefas.dom.removeClass(emailField, 'is-invalid');
        
        const feedback = emailField.parentNode.querySelector('.valid-feedback, .invalid-feedback');
        if (feedback) {
            feedback.remove();
        }
    },
    
    /**
     * Valida confirmação de senha em tempo real
     */
    validatePasswordConfirmation: function() {
        const passwordField = SistemaTarefas.dom.$('#senha, #password, input[name="senha"], input[name="password"]');
        const confirmPasswordField = SistemaTarefas.dom.$('#confirmarSenha, #confirmPassword, input[name="confirmarSenha"]');
        
        if (!passwordField || !confirmPasswordField) return;
        
        const password = passwordField.value;
        const confirmPassword = confirmPasswordField.value;
        
        // Remove indicadores anteriores
        SistemaTarefas.dom.removeClass(confirmPasswordField, 'is-valid');
        SistemaTarefas.dom.removeClass(confirmPasswordField, 'is-invalid');
        
        const existingFeedback = confirmPasswordField.parentNode.querySelector('.valid-feedback, .invalid-feedback');
        if (existingFeedback) {
            existingFeedback.remove();
        }
        
        if (confirmPassword.length > 0) {
            if (password === confirmPassword) {
                // Senhas coincidem
                SistemaTarefas.dom.addClass(confirmPasswordField, 'is-valid');
                const successElement = SistemaTarefas.dom.createElement('div', {
                    className: 'valid-feedback'
                }, 'Senhas coincidem');
                confirmPasswordField.parentNode.appendChild(successElement);
            } else {
                // Senhas não coincidem
                SistemaTarefas.dom.addClass(confirmPasswordField, 'is-invalid');
                const errorElement = SistemaTarefas.dom.createElement('div', {
                    className: 'invalid-feedback'
                }, 'Senhas não coincidem');
                confirmPasswordField.parentNode.appendChild(errorElement);
            }
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
        const toggleBtn = event.target;
        const fieldName = toggleBtn.getAttribute('data-target');
        let passwordField;
        
        if (fieldName) {
            passwordField = SistemaTarefas.dom.$(`#${fieldName}`);
        } else {
            // Busca campo de senha próximo
            passwordField = toggleBtn.parentNode.querySelector('input[type="password"], input[type="text"]');
        }
        
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
            button.innerHTML = '<span class="loading"></span> Cadastrando...';
        } else {
            button.disabled = false;
            button.textContent = button.originalText || 'Cadastrar';
        }
    },
    
    /**
     * Inicializa dados padrão para um novo usuário
     * @param {string} userId - ID do usuário
     */
    initUserDefaultData: function(userId) {
        // Cria lista padrão se não existir
        const lists = SistemaTarefas.storage.getLists();
        if (lists.length === 0) {
            const defaultList = {
                id: 'default',
                name: 'Tarefas Gerais',
                description: 'Lista padrão para suas tarefas',
                createdAt: new Date().toISOString(),
                isDefault: true,
                userId: userId
            };
            SistemaTarefas.storage.saveLists([defaultList]);
        }
        
        // Cria tarefa de boas-vindas
        const welcomeTask = {
            id: SistemaTarefas.utils.generateId(),
            title: '🎉 Bem-vindo ao Sistema de Tarefas!',
            description: 'Esta é sua primeira tarefa. Explore o sistema e organize suas atividades!',
            status: SistemaTarefas.config.TASK_STATUS.PENDENTE,
            priority: SistemaTarefas.config.TASK_PRIORITY.MEDIA,
            listId: 'default',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            userId: userId
        };
        
        SistemaTarefas.storage.addTask(welcomeTask);
    }
};

// Inicializa a página quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    // Verifica se estamos na página de cadastro
    if (document.body.classList.contains('cadastro-page') || 
        document.title.toLowerCase().includes('cadastro') ||
        window.location.pathname.includes('cadastro.html')) {
        
        SistemaTarefas.CadastroPage.init();
    }
});

