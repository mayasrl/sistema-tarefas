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
    // Flag para evitar inicialização duplicada
    initialized: false,
    
    /**
     * Inicializa a página de cadastro
     */
    init: function() {
        // Evita inicialização duplicada
        if (this.initialized) {
            console.log('Página de cadastro já inicializada');
            return;
        }
        
        console.log('Inicializando página de cadastro');
        
        // Redireciona se já estiver logado
        SistemaTarefas.auth.redirectIfAuthenticated();
        
        // Configura event listeners
        this.setupEventListeners();
        
        // Foca no campo de nome
        const nameField = SistemaTarefas.dom.$('#nome, #name');
        if (nameField) {
            nameField.focus();
        }
        
        this.initialized = true;
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
            SistemaTarefas.validation.setupRealTimeValidation(
                cadastroForm, 
                SistemaTarefas.validation.registerForm
            );
        }
        
        // Event listener para verificação de email
        const emailField = SistemaTarefas.dom.$('#email');
        if (emailField) {
            // Usa debounce para evitar muitas verificações
            const debouncedCheck = SistemaTarefas.utils.debounce((email) => {
                this.checkEmailAvailability(email);
            }, 500);
            
            SistemaTarefas.dom.on(emailField, 'input', (e) => {
                debouncedCheck(e.target.value);
            });
        }
        
        // Event listener para confirmação de senha
        const confirmPasswordField = SistemaTarefas.dom.$('#confirmarSenha, #confirmPassword');
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
            '#nome, #name',
            '#email',
            '#senha, #password',
            '#confirmarSenha, #confirmPassword'
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
        
        // Normaliza nomes dos campos
        const cadastroData = {
            name: formData.nome || formData.name,
            email: formData.email,
            password: formData.senha || formData.password,
            confirmPassword: formData.confirmarSenha || formData.confirmPassword
        };
        
        // Valida os dados
        const validation = SistemaTarefas.validation.registerForm(cadastroData);
        
        if (!validation.isValid) {
            SistemaTarefas.validation.displayErrors(validation.errors, '#cadastroForm, form');
            return;
        }
        
        // Limpa erros anteriores
        SistemaTarefas.validation.clearErrors('#cadastroForm, form');
        
        // Mostra loading no botão
        this.setButtonLoading(submitBtn, true);
        
        // Simula delay de cadastro
        setTimeout(() => {
            this.registerUser(cadastroData, submitBtn);
        }, 800);
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
            
            // Cria novo usuário com senha hasheada
            const newUser = {
                id: SistemaTarefas.utils.generateId(),
                name: cadastroData.name.trim(),
                email: cadastroData.email.toLowerCase().trim(),
                password: cadastroData.password, // Mantém para compatibilidade
                passwordHash: SistemaTarefas.utils.simpleHash(cadastroData.password),
                createdAt: new Date().toISOString()
            };
            
            // Salva usuário
            const users = SistemaTarefas.storage.getRegisteredUsers();
            users.push(newUser);
            
            if (!SistemaTarefas.storage.saveRegisteredUsers(users)) {
                this.setButtonLoading(submitBtn, false);
                SistemaTarefas.notification.error('Erro ao salvar usuário. Tente novamente.');
                return;
            }
            
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
            }, 1500);
            
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
        if (!email) return false;
        const users = SistemaTarefas.storage.getRegisteredUsers();
        return users.some(user => user.email.toLowerCase() === email.toLowerCase().trim());
    },
    
    /**
     * Verifica disponibilidade do email com feedback visual
     * @param {string} email - Email a ser verificado
     */
    checkEmailAvailability: function(email) {
        if (!email) return;
        
        // Valida formato primeiro
        const emailValidation = SistemaTarefas.validation.email(email);
        if (!emailValidation.isValid) return;
        
        const emailField = SistemaTarefas.dom.$('#email');
        if (!emailField) return;
        
        // Remove indicadores anteriores
        this.removeEmailIndicators(emailField);
        
        if (this.isEmailTaken(email)) {
            // Email já existe
            SistemaTarefas.dom.addClass(emailField, 'is-invalid');
            emailField.setAttribute('aria-invalid', 'true');
            
            const errorElement = SistemaTarefas.dom.createElement('div', {
                className: 'invalid-feedback',
                role: 'alert'
            }, 'Este email já está cadastrado');
            emailField.parentNode.appendChild(errorElement);
        } else {
            // Email disponível
            SistemaTarefas.dom.addClass(emailField, 'is-valid');
            emailField.setAttribute('aria-invalid', 'false');
            
            const successElement = SistemaTarefas.dom.createElement('div', {
                className: 'valid-feedback'
            }, '✓ Email disponível');
            emailField.parentNode.appendChild(successElement);
        }
    },
    
    /**
     * Remove indicadores de email
     * @param {Element} emailField - Campo de email
     */
    removeEmailIndicators: function(emailField) {
        if (!emailField) return;
        
        SistemaTarefas.dom.removeClass(emailField, 'is-valid');
        SistemaTarefas.dom.removeClass(emailField, 'is-invalid');
        emailField.removeAttribute('aria-invalid');
        
        const feedback = emailField.parentNode.querySelector('.valid-feedback, .invalid-feedback');
        if (feedback) {
            feedback.remove();
        }
    },
    
    /**
     * Valida confirmação de senha em tempo real
     */
    validatePasswordConfirmation: function() {
        const passwordField = SistemaTarefas.dom.$('#senha, #password');
        const confirmPasswordField = SistemaTarefas.dom.$('#confirmarSenha, #confirmPassword');
        
        if (!passwordField || !confirmPasswordField) return;
        
        const password = passwordField.value;
        const confirmPassword = confirmPasswordField.value;
        
        // Remove indicadores anteriores
        SistemaTarefas.dom.removeClass(confirmPasswordField, 'is-valid');
        SistemaTarefas.dom.removeClass(confirmPasswordField, 'is-invalid');
        confirmPasswordField.removeAttribute('aria-invalid');
        
        const existingFeedback = confirmPasswordField.parentNode.querySelector('.valid-feedback, .invalid-feedback');
        if (existingFeedback) {
            existingFeedback.remove();
        }
        
        // Só valida se o campo não estiver vazio
        if (confirmPassword.length > 0) {
            if (password === confirmPassword) {
                // Senhas coincidem
                SistemaTarefas.dom.addClass(confirmPasswordField, 'is-valid');
                confirmPasswordField.setAttribute('aria-invalid', 'false');
                
                const successElement = SistemaTarefas.dom.createElement('div', {
                    className: 'valid-feedback'
                }, '✓ Senhas coincidem');
                confirmPasswordField.parentNode.appendChild(successElement);
            } else {
                // Senhas não coincidem
                SistemaTarefas.dom.addClass(confirmPasswordField, 'is-invalid');
                confirmPasswordField.setAttribute('aria-invalid', 'true');
                
                const errorElement = SistemaTarefas.dom.createElement('div', {
                    className: 'invalid-feedback',
                    role: 'alert'
                }, 'As senhas não coincidem');
                confirmPasswordField.parentNode.appendChild(errorElement);
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
            button.setAttribute('data-original-text', button.innerHTML);
            button.innerHTML = '<span class="loading"></span> Cadastrando...';
        } else {
            button.disabled = false;
            const originalText = button.getAttribute('data-original-text');
            button.innerHTML = originalText || 'Cadastrar';
            button.removeAttribute('data-original-text');
        }
    },
    
    /**
     * Inicializa dados padrão para novo usuário
     * @param {string} userId - ID do usuário
     */
    initUserDefaultData: function(userId) {
        // Garante que a lista padrão existe
        const lists = SistemaTarefas.storage.getLists();
        if (lists.length === 0) {
            SistemaTarefas.storage.addList({
                name: 'Tarefas Gerais',
                description: 'Lista padrão para tarefas gerais'
            });
        }
        
        console.log('Dados padrão inicializados para usuário:', userId);
    }
};

// Inicializa a página quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    // Verifica se estamos na página de cadastro
    const isCadastroPage = document.body.classList.contains('cadastro-page') || 
                           document.title.toLowerCase().includes('cadastro') ||
                           window.location.pathname.includes('cadastro.html');
    
    if (isCadastroPage) {
        SistemaTarefas.CadastroPage.init();
    }
});