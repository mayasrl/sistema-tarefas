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
     * @returns {Object} Resultado da validação {isValid, message}
     */
    required: function(value, fieldName = 'Campo') {
        const isValid = value !== null && value !== undefined && String(value).trim().length > 0;
        return {
            isValid,
            message: isValid ? '' : `${fieldName} é obrigatório`
        };
    },
    
    /**
     * Valida formato de email (RFC 5322 simplificado)
     * @param {string} email - Email a ser validado
     * @returns {Object} Resultado da validação
     */
    email: function(email) {
        if (!email) {
            return { isValid: false, message: 'Email é obrigatório' };
        }
        
        // Regex mais robusto para email
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        const isValid = emailRegex.test(email);
        
        return {
            isValid,
            message: isValid ? '' : 'Email deve ter um formato válido (exemplo@dominio.com)'
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
        if (!value) {
            return {
                isValid: false,
                message: `${fieldName} é obrigatório`
            };
        }
        
        const isValid = value.length >= minLength;
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
        if (!value) return { isValid: true, message: '' };
        
        const isValid = value.length <= maxLength;
        return {
            isValid,
            message: isValid ? '' : `${fieldName} deve ter no máximo ${maxLength} caracteres`
        };
    },
    
    /**
     * Valida senha com critérios de segurança
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
        
        const minLength = SistemaTarefas.config.LIMITS.MIN_PASSWORD_LENGTH;
        
        if (password.length < minLength) {
            return {
                isValid: false,
                message: `Senha deve ter pelo menos ${minLength} caracteres`
            };
        }
        
        // Validação adicional: não permitir senhas muito simples
        const weakPasswords = ['123456', 'password', 'senha123', 'abc123'];
        if (weakPasswords.includes(password.toLowerCase())) {
            return {
                isValid: false,
                message: 'Senha muito fraca. Escolha uma senha mais segura'
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
        if (!confirmPassword) {
            return {
                isValid: false,
                message: 'Confirmação de senha é obrigatória'
            };
        }
        
        const isValid = password === confirmPassword;
        return {
            isValid,
            message: isValid ? '' : 'As senhas não coincidem'
        };
    },
    
    /**
     * Valida data de vencimento (corrigido)
     * @param {string|Date} date - Data a ser validada
     * @returns {Object} Resultado da validação
     */
    dueDate: function(date) {
        if (!date) {
            return { isValid: true, message: '' }; // Data é opcional
        }
        
        try {
            const inputDate = new Date(date);
            
            // Verifica se é uma data válida
            if (isNaN(inputDate.getTime())) {
                return {
                    isValid: false,
                    message: 'Data de vencimento inválida'
                };
            }
            
            // Verifica se não é uma data passada
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            inputDate.setHours(0, 0, 0, 0);
            
            if (inputDate < today) {
                return {
                    isValid: false,
                    message: 'Data de vencimento não pode ser anterior a hoje'
                };
            }
            
            return { isValid: true, message: '' };
        } catch (error) {
            return {
                isValid: false,
                message: 'Data de vencimento inválida'
            };
        }
    },
    
    /**
     * Valida dados de login
     * @param {Object} data - Dados do formulário de login
     * @returns {Object} Resultado da validação {isValid, errors}
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
        
        return { isValid, errors };
    },
    
    /**
     * Valida dados de cadastro
     * @param {Object} data - Dados do formulário de cadastro
     * @returns {Object} Resultado da validação {isValid, errors}
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
            const minLength = SistemaTarefas.config.LIMITS.MIN_NAME_LENGTH;
            const nameMinLength = this.minLength(data.name, minLength, 'Nome');
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
        
        return { isValid, errors };
    },
    
    /**
     * Valida dados de tarefa
     * @param {Object} data - Dados da tarefa
     * @returns {Object} Resultado da validação {isValid, errors}
     */
    taskForm: function(data) {
        const errors = {};
        let isValid = true;
        const config = SistemaTarefas.config;
        
        // Validação do título
        const titleValidation = this.required(data.title, 'Título');
        if (!titleValidation.isValid) {
            errors.title = titleValidation.message;
            isValid = false;
        } else {
            const titleMaxLength = this.maxLength(data.title, config.LIMITS.MAX_TITLE_LENGTH, 'Título');
            if (!titleMaxLength.isValid) {
                errors.title = titleMaxLength.message;
                isValid = false;
            }
        }
        
        // Validação da descrição (opcional, mas com limite)
        if (data.description) {
            const descriptionMaxLength = this.maxLength(
                data.description, 
                config.LIMITS.MAX_DESCRIPTION_LENGTH, 
                'Descrição'
            );
            if (!descriptionMaxLength.isValid) {
                errors.description = descriptionMaxLength.message;
                isValid = false;
            }
        }
        
        // Validação do status
        if (data.status && !Object.values(config.TASK_STATUS).includes(data.status)) {
            errors.status = 'Status inválido';
            isValid = false;
        }
        
        // Validação da prioridade
        if (data.priority && !Object.values(config.TASK_PRIORITY).includes(data.priority)) {
            errors.priority = 'Prioridade inválida';
            isValid = false;
        }
        
        // Validação da data de vencimento (CORRIGIDO)
        if (data.dueDate) {
            const dueDateValidation = this.dueDate(data.dueDate);
            if (!dueDateValidation.isValid) {
                errors.dueDate = dueDateValidation.message;
                isValid = false;
            }
        }
        
        return { isValid, errors };
    },
    
    /**
     * Valida dados de lista
     * @param {Object} data - Dados da lista
     * @returns {Object} Resultado da validação {isValid, errors}
     */
    listForm: function(data) {
        const errors = {};
        let isValid = true;
        const config = SistemaTarefas.config;
        
        // Validação do nome
        const nameValidation = this.required(data.name, 'Nome da lista');
        if (!nameValidation.isValid) {
            errors.name = nameValidation.message;
            isValid = false;
        } else {
            const nameMaxLength = this.maxLength(
                data.name, 
                config.LIMITS.MAX_LIST_NAME_LENGTH, 
                'Nome da lista'
            );
            if (!nameMaxLength.isValid) {
                errors.name = nameMaxLength.message;
                isValid = false;
            }
        }
        
        // Validação da descrição (opcional, mas com limite)
        if (data.description) {
            const descriptionMaxLength = this.maxLength(
                data.description, 
                config.LIMITS.MAX_LIST_DESCRIPTION_LENGTH, 
                'Descrição'
            );
            if (!descriptionMaxLength.isValid) {
                errors.description = descriptionMaxLength.message;
                isValid = false;
            }
        }
        
        return { isValid, errors };
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
            const form = document.querySelector(formSelector);
            if (!form) return;
            
            const field = form.querySelector(`[name="${fieldName}"]`);
            if (field) {
                // Adiciona classe de erro ao campo
                field.classList.add('is-invalid');
                field.setAttribute('aria-invalid', 'true');
                
                // Cria elemento de mensagem de erro
                const errorElement = document.createElement('div');
                errorElement.className = 'invalid-feedback';
                errorElement.textContent = errors[fieldName];
                errorElement.setAttribute('role', 'alert');
                
                // Insere a mensagem após o campo
                field.parentNode.appendChild(errorElement);
            }
        });
        
        // Foca no primeiro campo com erro
        const firstInvalidField = document.querySelector(`${formSelector} .is-invalid`);
        if (firstInvalidField) {
            firstInvalidField.focus();
        }
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
        invalidFields.forEach(field => {
            field.classList.remove('is-invalid');
            field.removeAttribute('aria-invalid');
        });
        
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
        if (!form || typeof validationFunction !== 'function') {
            console.error('Formulário ou função de validação inválidos');
            return;
        }
        
        const inputs = form.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
            // Validação ao sair do campo (blur)
            input.addEventListener('blur', () => {
                const formData = new FormData(form);
                const data = Object.fromEntries(formData.entries());
                const validation = validationFunction(data);
                
                if (!validation.isValid && validation.errors[input.name]) {
                    // Mostra erro apenas para este campo
                    const fieldError = {};
                    fieldError[input.name] = validation.errors[input.name];
                    
                    // Remove erro anterior deste campo
                    input.classList.remove('is-invalid');
                    const existingError = input.parentNode.querySelector('.invalid-feedback');
                    if (existingError) {
                        existingError.remove();
                    }
                    
                    // Adiciona novo erro
                    this.displayErrors(fieldError, `#${form.id}`);
                } else {
                    // Remove erro deste campo se estiver válido
                    input.classList.remove('is-invalid');
                    input.removeAttribute('aria-invalid');
                    const errorMessage = input.parentNode.querySelector('.invalid-feedback');
                    if (errorMessage) {
                        errorMessage.remove();
                    }
                }
            });
            
            // Limpa erro ao começar a digitar
            input.addEventListener('input', () => {
                if (input.classList.contains('is-invalid')) {
                    input.classList.remove('is-invalid');
                    input.removeAttribute('aria-invalid');
                    const errorMessage = input.parentNode.querySelector('.invalid-feedback');
                    if (errorMessage) {
                        errorMessage.remove();
                    }
                }
            });
        });
    }
};

