/**
 * UTILITÁRIO DE MANIPULAÇÃO DO DOM
 * 
 * Este arquivo contém funções auxiliares para manipular o DOM de forma
 * eficiente e reutilizável, seguindo os conceitos de manipulação de DOM.
 * 
 * Funcionalidades:
 * - Seletores otimizados
 * - Criação de elementos
 * - Manipulação de classes e atributos
 * - Event listeners
 * - Animações simples
 */

SistemaTarefas.dom = {
    /**
     * Seletor otimizado para um elemento
     * @param {string} selector - Seletor CSS
     * @param {Element} context - Contexto de busca (opcional)
     * @returns {Element|null} Elemento encontrado
     */
    $: function(selector, context = document) {
        try {
            return context.querySelector(selector);
        } catch (error) {
            console.error('Erro no seletor:', selector, error);
            return null;
        }
    },
    
    /**
     * Seletor otimizado para múltiplos elementos
     * @param {string} selector - Seletor CSS
     * @param {Element} context - Contexto de busca (opcional)
     * @returns {NodeList} Lista de elementos encontrados
     */
    $$: function(selector, context = document) {
        try {
            return context.querySelectorAll(selector);
        } catch (error) {
            console.error('Erro no seletor:', selector, error);
            return [];
        }
    },
    
    /**
     * Cria um elemento HTML com atributos e conteúdo
     * @param {string} tag - Tag do elemento
     * @param {Object} attributes - Atributos do elemento
     * @param {string|Element} content - Conteúdo do elemento
     * @returns {Element} Elemento criado
     */
    createElement: function(tag, attributes = {}, content = '') {
        try {
            const element = document.createElement(tag);
            
            // Define atributos
            Object.keys(attributes).forEach(key => {
                if (key === 'className') {
                    element.className = attributes[key];
                } else if (key === 'innerHTML') {
                    element.innerHTML = attributes[key];
                } else if (key === 'textContent') {
                    element.textContent = attributes[key];
                } else if (key === 'style' && typeof attributes[key] === 'object') {
                    Object.assign(element.style, attributes[key]);
                } else {
                    element.setAttribute(key, attributes[key]);
                }
            });
            
            // Define conteúdo
            if (content) {
                if (typeof content === 'string') {
                    element.innerHTML = content;
                } else if (content instanceof Element) {
                    element.appendChild(content);
                } else if (Array.isArray(content)) {
                    content.forEach(child => {
                        if (child instanceof Element) {
                            element.appendChild(child);
                        }
                    });
                }
            }
            
            return element;
        } catch (error) {
            console.error('Erro ao criar elemento:', error);
            return document.createElement('div');
        }
    },
    
    /**
     * Remove um elemento do DOM
     * @param {Element|string} element - Elemento ou seletor
     */
    remove: function(element) {
        try {
            const el = typeof element === 'string' ? this.$(element) : element;
            if (el && el.parentNode) {
                el.parentNode.removeChild(el);
            }
        } catch (error) {
            console.error('Erro ao remover elemento:', error);
        }
    },
    
    /**
     * Adiciona uma classe a um elemento
     * @param {Element|string} element - Elemento ou seletor
     * @param {string} className - Nome da classe
     */
    addClass: function(element, className) {
        try {
            const el = typeof element === 'string' ? this.$(element) : element;
            if (el && className) {
                el.classList.add(className);
            }
        } catch (error) {
            console.error('Erro ao adicionar classe:', error);
        }
    },
    
    /**
     * Remove uma classe de um elemento
     * @param {Element|string} element - Elemento ou seletor
     * @param {string} className - Nome da classe
     */
    removeClass: function(element, className) {
        try {
            const el = typeof element === 'string' ? this.$(element) : element;
            if (el && className) {
                el.classList.remove(className);
            }
        } catch (error) {
            console.error('Erro ao remover classe:', error);
        }
    },
    
    /**
     * Alterna uma classe em um elemento
     * @param {Element|string} element - Elemento ou seletor
     * @param {string} className - Nome da classe
     * @returns {boolean} True se a classe foi adicionada
     */
    toggleClass: function(element, className) {
        try {
            const el = typeof element === 'string' ? this.$(element) : element;
            if (el && className) {
                return el.classList.toggle(className);
            }
        } catch (error) {
            console.error('Erro ao alternar classe:', error);
        }
        return false;
    },
    
    /**
     * Verifica se um elemento tem uma classe
     * @param {Element|string} element - Elemento ou seletor
     * @param {string} className - Nome da classe
     * @returns {boolean} True se tem a classe
     */
    hasClass: function(element, className) {
        try {
            const el = typeof element === 'string' ? this.$(element) : element;
            return el ? el.classList.contains(className) : false;
        } catch (error) {
            console.error('Erro ao verificar classe:', error);
            return false;
        }
    },
    
    /**
     * Define ou obtém um atributo de um elemento
     * @param {Element|string} element - Elemento ou seletor
     * @param {string} attribute - Nome do atributo
     * @param {string} value - Valor do atributo (opcional)
     * @returns {string|void} Valor do atributo se não fornecido valor
     */
    attr: function(element, attribute, value) {
        try {
            const el = typeof element === 'string' ? this.$(element) : element;
            if (!el) return;
            
            if (value !== undefined) {
                el.setAttribute(attribute, value);
            } else {
                return el.getAttribute(attribute);
            }
        } catch (error) {
            console.error('Erro ao manipular atributo:', error);
        }
    },
    
    /**
     * Remove um atributo de um elemento
     * @param {Element|string} element - Elemento ou seletor
     * @param {string} attribute - Nome do atributo
     */
    removeAttr: function(element, attribute) {
        try {
            const el = typeof element === 'string' ? this.$(element) : element;
            if (el && attribute) {
                el.removeAttribute(attribute);
            }
        } catch (error) {
            console.error('Erro ao remover atributo:', error);
        }
    },
    
    /**
     * Define ou obtém o conteúdo HTML de um elemento
     * @param {Element|string} element - Elemento ou seletor
     * @param {string} html - HTML a ser definido (opcional)
     * @returns {string|void} HTML atual se não fornecido novo HTML
     */
    html: function(element, html) {
        try {
            const el = typeof element === 'string' ? this.$(element) : element;
            if (!el) return;
            
            if (html !== undefined) {
                el.innerHTML = html;
            } else {
                return el.innerHTML;
            }
        } catch (error) {
            console.error('Erro ao manipular HTML:', error);
        }
    },
    
    /**
     * Define ou obtém o conteúdo de texto de um elemento
     * @param {Element|string} element - Elemento ou seletor
     * @param {string} text - Texto a ser definido (opcional)
     * @returns {string|void} Texto atual se não fornecido novo texto
     */
    text: function(element, text) {
        try {
            const el = typeof element === 'string' ? this.$(element) : element;
            if (!el) return;
            
            if (text !== undefined) {
                el.textContent = text;
            } else {
                return el.textContent;
            }
        } catch (error) {
            console.error('Erro ao manipular texto:', error);
        }
    },
    
    /**
     * Define ou obtém o valor de um campo de formulário
     * @param {Element|string} element - Elemento ou seletor
     * @param {string} value - Valor a ser definido (opcional)
     * @returns {string|void} Valor atual se não fornecido novo valor
     */
    val: function(element, value) {
        try {
            const el = typeof element === 'string' ? this.$(element) : element;
            if (!el) return;
            
            if (value !== undefined) {
                el.value = value;
            } else {
                return el.value;
            }
        } catch (error) {
            console.error('Erro ao manipular valor:', error);
        }
    },
    
    /**
     * Adiciona um event listener a um elemento (evita duplicação)
     * @param {Element|string} element - Elemento ou seletor
     * @param {string} event - Nome do evento
     * @param {Function} handler - Função manipuladora
     * @param {boolean} useCapture - Usar captura (opcional)
     */
    on: function(element, event, handler, useCapture = false) {
        try {
            const el = typeof element === 'string' ? this.$(element) : element;
            if (el && typeof handler === 'function') {
                // Remove listener anterior se existir (evita duplicação)
                el.removeEventListener(event, handler, useCapture);
                el.addEventListener(event, handler, useCapture);
            }
        } catch (error) {
            console.error('Erro ao adicionar event listener:', error);
        }
    },
    
    /**
     * Remove um event listener de um elemento
     * @param {Element|string} element - Elemento ou seletor
     * @param {string} event - Nome do evento
     * @param {Function} handler - Função manipuladora
     * @param {boolean} useCapture - Usar captura (opcional)
     */
    off: function(element, event, handler, useCapture = false) {
        try {
            const el = typeof element === 'string' ? this.$(element) : element;
            if (el && typeof handler === 'function') {
                el.removeEventListener(event, handler, useCapture);
            }
        } catch (error) {
            console.error('Erro ao remover event listener:', error);
        }
    },
    
    /**
     * Adiciona event delegation para elementos dinâmicos
     * @param {Element|string} parent - Elemento pai ou seletor
     * @param {string} selector - Seletor dos elementos filhos
     * @param {string} event - Nome do evento
     * @param {Function} handler - Função manipuladora
     */
    delegate: function(parent, selector, event, handler) {
        try {
            const parentEl = typeof parent === 'string' ? this.$(parent) : parent;
            if (!parentEl || typeof handler !== 'function') return;
            
            parentEl.addEventListener(event, function(e) {
                const target = e.target.closest(selector);
                if (target && parentEl.contains(target)) {
                    handler.call(target, e);
                }
            });
        } catch (error) {
            console.error('Erro ao adicionar event delegation:', error);
        }
    },
    
    /**
     * Mostra um elemento (remove display: none)
     * @param {Element|string} element - Elemento ou seletor
     */
    show: function(element) {
        try {
            const el = typeof element === 'string' ? this.$(element) : element;
            if (el) {
                el.style.display = '';
            }
        } catch (error) {
            console.error('Erro ao mostrar elemento:', error);
        }
    },
    
    /**
     * Esconde um elemento (adiciona display: none)
     * @param {Element|string} element - Elemento ou seletor
     */
    hide: function(element) {
        try {
            const el = typeof element === 'string' ? this.$(element) : element;
            if (el) {
                el.style.display = 'none';
            }
        } catch (error) {
            console.error('Erro ao esconder elemento:', error);
        }
    },
    
    /**
     * Alterna a visibilidade de um elemento
     * @param {Element|string} element - Elemento ou seletor
     */
    toggle: function(element) {
        try {
            const el = typeof element === 'string' ? this.$(element) : element;
            if (el) {
                if (el.style.display === 'none') {
                    this.show(el);
                } else {
                    this.hide(el);
                }
            }
        } catch (error) {
            console.error('Erro ao alternar visibilidade:', error);
        }
    },
    
    /**
     * Fade in de um elemento
     * @param {Element|string} element - Elemento ou seletor
     * @param {number} duration - Duração em ms
     */
    fadeIn: function(element, duration = 300) {
        try {
            const el = typeof element === 'string' ? this.$(element) : element;
            if (!el) return;
            
            el.style.opacity = '0';
            el.style.display = '';
            
            const start = performance.now();
            
            const animate = (currentTime) => {
                const elapsed = currentTime - start;
                const progress = Math.min(elapsed / duration, 1);
                
                el.style.opacity = progress.toString();
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };
            
            requestAnimationFrame(animate);
        } catch (error) {
            console.error('Erro no fade in:', error);
        }
    },
    
    /**
     * Fade out de um elemento
     * @param {Element|string} element - Elemento ou seletor
     * @param {number} duration - Duração em ms
     */
    fadeOut: function(element, duration = 300) {
        try {
            const el = typeof element === 'string' ? this.$(element) : element;
            if (!el) return;
            
            const start = performance.now();
            const startOpacity = parseFloat(el.style.opacity) || 1;
            
            const animate = (currentTime) => {
                const elapsed = currentTime - start;
                const progress = Math.min(elapsed / duration, 1);
                
                el.style.opacity = (startOpacity * (1 - progress)).toString();
                
                if (progress >= 1) {
                    el.style.display = 'none';
                } else {
                    requestAnimationFrame(animate);
                }
            };
            
            requestAnimationFrame(animate);
        } catch (error) {
            console.error('Erro no fade out:', error);
        }
    },
    
    /**
     * Obtém dados de um formulário como objeto
     * @param {Element|string} form - Formulário ou seletor
     * @returns {Object} Dados do formulário
     */
    getFormData: function(form) {
        try {
            const formEl = typeof form === 'string' ? this.$(form) : form;
            if (!formEl) return {};
            
            const formData = new FormData(formEl);
            const data = {};
            
            for (let [key, value] of formData.entries()) {
                data[key] = value;
            }
            
            return data;
        } catch (error) {
            console.error('Erro ao obter dados do formulário:', error);
            return {};
        }
    },
    
    /**
     * Preenche um formulário com dados
     * @param {Element|string} form - Formulário ou seletor
     * @param {Object} data - Dados para preencher
     */
    setFormData: function(form, data) {
        try {
            const formEl = typeof form === 'string' ? this.$(form) : form;
            if (!formEl || !data) return;
            
            Object.keys(data).forEach(key => {
                const field = formEl.querySelector(`[name="${key}"]`);
                if (field) {
                    if (field.type === 'checkbox' || field.type === 'radio') {
                        field.checked = Boolean(data[key]);
                    } else {
                        field.value = data[key] || '';
                    }
                }
            });
        } catch (error) {
            console.error('Erro ao preencher formulário:', error);
        }
    },
    
    /**
     * Limpa um formulário
     * @param {Element|string} form - Formulário ou seletor
     */
    clearForm: function(form) {
        try {
            const formEl = typeof form === 'string' ? this.$(form) : form;
            if (formEl) {
                formEl.reset();
                // Remove classes de validação
                const invalidFields = formEl.querySelectorAll('.is-invalid, .is-valid');
                invalidFields.forEach(field => {
                    field.classList.remove('is-invalid', 'is-valid');
                });
                // Remove mensagens de erro
                const feedbacks = formEl.querySelectorAll('.invalid-feedback, .valid-feedback');
                feedbacks.forEach(feedback => feedback.remove());
            }
        } catch (error) {
            console.error('Erro ao limpar formulário:', error);
        }
    },
    
    /**
     * Rola a página até um elemento
     * @param {Element|string} element - Elemento ou seletor
     * @param {boolean} smooth - Rolagem suave
     */
    scrollTo: function(element, smooth = true) {
        try {
            const el = typeof element === 'string' ? this.$(element) : element;
            if (el) {
                el.scrollIntoView({
                    behavior: smooth ? 'smooth' : 'auto',
                    block: 'start'
                });
            }
        } catch (error) {
            console.error('Erro ao rolar para elemento:', error);
        }
    },
    
    /**
     * Verifica se um elemento está visível na viewport
     * @param {Element|string} element - Elemento ou seletor
     * @returns {boolean} True se visível
     */
    isVisible: function(element) {
        try {
            const el = typeof element === 'string' ? this.$(element) : element;
            if (!el) return false;
            
            const rect = el.getBoundingClientRect();
            return (
                rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                rect.right <= (window.innerWidth || document.documentElement.clientWidth)
            );
        } catch (error) {
            console.error('Erro ao verificar visibilidade:', error);
            return false;
        }
    }
};

