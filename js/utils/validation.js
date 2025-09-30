/**
 * UTILITÁRIO DE VALIDAÇÃO
 * 
 * Este arquivo contém funções para validar dados de formulários
 * e entradas do usuário, seguindo boas práticas de validação.
 * 
 * Funcionalidades:
 * - Validação de campos obrigatórios
 * - Validação de email
 * - Validação de senhas
 * - Validação de tarefas e listas
 * - Exibição de mensagens de erro
 */

SistemaTarefas.validation = {
    /**
     * Valida se um campo não está vazio
     * @param {string} value - Valor a ser validado
     * @param {string} fieldName - Nome do campo para mensagem de erro
     * @returns {Object} Resultado da validação
     */
    required: function(value, fieldName = 'Campo') {
        const isValid = value && value.trim().length > 0;
        return {
            isValid,
            message: isValid ? '' : `${fieldName} é obrigatório`
        };
    },
    
    /**
     * Valida formato de email
     * @param {string} email - Email a ser validado
     * @returns {Object} Resultado da validação
     */
    email: function(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValid = emailRegex.test(email);
        return {
            isValid,
            message: isValid ? '' : 'Email deve ter um formato válido'
        };
    },
    
    /**
     * Valida tamanho mínimo de campo
     * @param {string} value - Valor a ser validado
     * @param {number} minLength - Tamanho mínimo
     * @param {string} fieldName - Nome do campo
     * @returns {Object} Resultado da validação
     */
    minLength: function(value, minLength, fieldName = 'Campo') {
        const isValid = value && value.length >= minLength;
        return {
            isValid,
            message: isValid ? '' : `${fieldName} deve ter pelo menos ${minLength} caracteres`
        };
    },
    
    /**
     * Valida tamanho máximo de campo
     * @param {string} value - Valor a ser validado
     * @param {number} maxLength - Tamanho máximo
     * @param {string} fieldName - Nome do campo
     * @returns {Object} Resultado da validação
     */
    maxLength: function(value, maxLength, fieldName = 'Campo') {
        const isValid = !value || value.length <= maxLength;
        return {
            isValid,
            message: isValid ? '' : `${fieldName} deve ter no máximo ${maxLength} caracteres`
        };
    },
    
    /**
     * Valida senha com critérios específicos
     * @param {string} password - Senha a ser validada
     * @returns {Object} Resultado da validação
     */
    password: function(password) {
        if (!password) {
            return {
                isValid: false,
                message: 'Senha é obrigatória'
            };
        }
        
        if (password.length < 6) {
            return {
                isValid: false,
                message: 'Senha deve ter pelo menos 6 caracteres'
            };
        }
        
        return {
            isValid: true,
            message: ''
        };
    },
    
    /**
     * Valida confirmação de senha
     * @param {string} password - Senha original
     * @param {string} confirmPassword - Confirmação da senha
     * @returns {Object} Resultado da validação
     */
    passwordConfirmation: function(password, confirmPassword) {
        const isValid = password === confirmPassword;
        return {
            isValid,
            message: isValid ? '' : 'Senhas não coincidem'
        };
    },
    
    /**
     * Valida dados de login
     * @param {Object} data - Dados do formulário de login
     * @returns {Object} Resultado da validação
     */
    loginForm: function(data) {
        const errors = {};
        let isValid = true;
        
        // Validação do email
        const emailValidation = this.required(data.email, 'Email');
        if (!emailValidation.isValid) {
            errors.email = emailValidation.message;
            isValid = false;
        } else {
            const emailFormatValidation = this.email(data.email);
            if (!emailFormatValidation.isValid) {
                errors.email = emailFormatValidation.message;
                isValid = false;
            }
        }
        
        // Validação da senha
        const passwordValidation = this.required(data.password, 'Senha');
        if (!passwordValidation.isValid) {
            errors.password = passwordValidation.message;
            isValid = false;
        }
        
        return {
            isValid,
            errors
        };
    },
    
    /**
     * Valida dados de cadastro
     * @param {Object} data - Dados do formulário de cadastro
     * @returns {Object} Resultado da validação
     */
    registerForm: function(data) {
        const errors = {};
        let isValid = true;
        
        // Validação do nome
        const nameValidation = this.required(data.name, 'Nome');
        if (!nameValidation.isValid) {
            errors.name = nameValidation.message;
            isValid = false;
        } else {
            const nameMinLength = this.minLength(data.name, 2, 'Nome');
            if (!nameMinLength.isValid) {
                errors.name = nameMinLength.message;
                isValid = false;
            }
        }
        
        // Validação do email
        const emailValidation = this.required(data.email, 'Email');
        if (!emailValidation.isValid) {
            errors.email = emailValidation.message;
            isValid = false;
        } else {
            const emailFormatValidation = this.email(data.email);
            if (!emailFormatValidation.isValid) {
                errors.email = emailFormatValidation.message;
                isValid = false;
            }
        }
        
        // Validação da senha
        const passwordValidation = this.password(data.password);
        if (!passwordValidation.isValid) {
            errors.password = passwordValidation.message;
            isValid = false;
        }
        
        // Validação da confirmação de senha
        if (data.confirmPassword !== undefined) {
            const confirmPasswordValidation = this.passwordConfirmation(data.password, data.confirmPassword);
            if (!confirmPasswordValidation.isValid) {
                errors.confirmPassword = confirmPasswordValidation.message;
                isValid = false;
            }
        }
        
        return {
            isValid,
            errors
        };
    },
    
    /**
     * Valida dados de tarefa
     * @param {Object} data - Dados da tarefa
     * @returns {Object} Resultado da validação
     */
    taskForm: function(data) {
        const errors = {};
        let isValid = true;
        
        // Validação do título
        const titleValidation = this.required(data.title, 'Título');
        if (!titleValidation.isValid) {
            errors.title = titleValidation.message;
            isValid = false;
        } else {
            const titleMaxLength = this.maxLength(data.title, 100, 'Título');
            if (!titleMaxLength.isValid) {
                errors.title = titleMaxLength.message;
                isValid = false;
            }
        }
        
        // Validação da descrição (opcional, mas com limite)
        if (data.description) {
            const descriptionMaxLength = this.maxLength(data.description, 500, 'Descrição');
            if (!descriptionMaxLength.isValid) {
                errors.description = descriptionMaxLength.message;
                isValid = false;
            }
        }
        
        // Validação do status
        if (data.status && !Object.values(SistemaTarefas.config.TASK_STATUS).includes(data.status)) {
            errors.status = 'Status inválido';
            isValid = false;
        }
        
        // Validação da prioridade
        if (data.priority && !Object.values(SistemaTarefas.config.TASK_PRIORITY).includes(data.priority)) {
            errors.priority = 'Prioridade inválida';
            isValid = false;
        }
        
        // Validação da data de vencimento (se fornecida)
        if (data.dueDate) {
            const dueDate = new Date(data.dueDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (isNaN(dueDate.getTime())) {
                errors.dueDate = 'Data de vencimento inválida';
                isValid = false;
            } else if (dueDate < today) {
                errors.dueDate = 'Data de vencimento não pode ser anterior a hoje';
                isValid = false;
            }
        }
        
        return {
            isValid,
            errors
        };
    },
    
    /**
     * Valida dados de lista
     * @param {Object} data - Dados da lista
     * @returns {Object} Resultado da validação
     */
    listForm: function(data) {
        const errors = {};
        let isValid = true;
        
        // Validação do nome
        const nameValidation = this.required(data.name, 'Nome da lista');
        if (!nameValidation.isValid) {
            errors.name = nameValidation.message;
            isValid = false;
        } else {
            const nameMaxLength = this.maxLength(data.name, 50, 'Nome da lista');
            if (!nameMaxLength.isValid) {
                errors.name = nameMaxLength.message;
                isValid = false;
            }
        }
        
        // Validação da descrição (opcional, mas com limite)
        if (data.description) {
            const descriptionMaxLength = this.maxLength(data.description, 200, 'Descrição');
            if (!descriptionMaxLength.isValid) {
                errors.description = descriptionMaxLength.message;
                isValid = false;
            }
        }
        
        return {
            isValid,
            errors
        };
    },
    
    /**
     * Exibe erros de validação nos campos do formulário
     * @param {Object} errors - Objeto com erros de validação
     * @param {string} formSelector - Seletor do formulário
     */
    displayErrors: function(errors, formSelector = 'form') {
        // Remove mensagens de erro existentes
        this.clearErrors(formSelector);
        
        // Adiciona novas mensagens de erro
        Object.keys(errors).forEach(fieldName => {
            const field = document.querySelector(`${formSelector} [name="${fieldName}"]`);
            if (field) {
                // Adiciona classe de erro ao campo
                field.classList.add('is-invalid');
                
                // Cria elemento de mensagem de erro
                const errorElement = document.createElement('div');
                errorElement.className = 'invalid-feedback';
                errorElement.textContent = errors[fieldName];
                
                // Insere a mensagem após o campo
                field.parentNode.appendChild(errorElement);
            }
        });
    },
    
    /**
     * Remove mensagens de erro do formulário
     * @param {string} formSelector - Seletor do formulário
     */
    clearErrors: function(formSelector = 'form') {
        const form = document.querySelector(formSelector);
        if (!form) return;
        
        // Remove classes de erro
        const invalidFields = form.querySelectorAll('.is-invalid');
        invalidFields.forEach(field => field.classList.remove('is-invalid'));
        
        // Remove mensagens de erro
        const errorMessages = form.querySelectorAll('.invalid-feedback');
        errorMessages.forEach(message => message.remove());
    },
    
    /**
     * Valida um formulário em tempo real
     * @param {HTMLFormElement} form - Elemento do formulário
     * @param {Function} validationFunction - Função de validação a ser usada
     */
    setupRealTimeValidation: function(form, validationFunction) {
        const inputs = form.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                const formData = new FormData(form);
                const data = Object.fromEntries(formData.entries());
                const validation = validationFunction(data);
                
                if (!validation.isValid && validation.errors[input.name]) {
                    // Mostra erro apenas para este campo
                    const fieldError = {};
                    fieldError[input.name] = validation.errors[input.name];
                    this.displayErrors(fieldError, `#${form.id}`);
                } else {
                    // Remove erro deste campo se estiver válido
                    input.classList.remove('is-invalid');
                    const errorMessage = input.parentNode.querySelector('.invalid-feedback');
                    if (errorMessage) {
                        errorMessage.remove();
                    }
                }
            });
        });
    }
};

