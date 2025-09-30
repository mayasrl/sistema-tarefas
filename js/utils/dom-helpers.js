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
        return context.querySelector(selector);
    },
    
    /**
     * Seletor otimizado para múltiplos elementos
     * @param {string} selector - Seletor CSS
     * @param {Element} context - Contexto de busca (opcional)
     * @returns {NodeList} Lista de elementos encontrados
     */
    $$: function(selector, context = document) {
        return context.querySelectorAll(selector);
    },
    
    /**
     * Cria um elemento HTML com atributos e conteúdo
     * @param {string} tag - Tag do elemento
     * @param {Object} attributes - Atributos do elemento
     * @param {string|Element} content - Conteúdo do elemento
     * @returns {Element} Elemento criado
     */
    createElement: function(tag, attributes = {}, content = '') {
        const element = document.createElement(tag);
        
        // Define atributos
        Object.keys(attributes).forEach(key => {
            if (key === 'className') {
                element.className = attributes[key];
            } else if (key === 'innerHTML') {
                element.innerHTML = attributes[key];
            } else if (key === 'textContent') {
                element.textContent = attributes[key];
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
            }
        }
        
        return element;
    },
    
    /**
     * Remove um elemento do DOM
     * @param {Element|string} element - Elemento ou seletor
     */
    remove: function(element) {
        const el = typeof element === 'string' ? this.$(element) : element;
        if (el && el.parentNode) {
            el.parentNode.removeChild(el);
        }
    },
    
    /**
     * Adiciona uma classe a um elemento
     * @param {Element|string} element - Elemento ou seletor
     * @param {string} className - Nome da classe
     */
    addClass: function(element, className) {
        const el = typeof element === 'string' ? this.$(element) : element;
        if (el) {
            el.classList.add(className);
        }
    },
    
    /**
     * Remove uma classe de um elemento
     * @param {Element|string} element - Elemento ou seletor
     * @param {string} className - Nome da classe
     */
    removeClass: function(element, className) {
        const el = typeof element === 'string' ? this.$(element) : element;
        if (el) {
            el.classList.remove(className);
        }
    },
    
    /**
     * Alterna uma classe em um elemento
     * @param {Element|string} element - Elemento ou seletor
     * @param {string} className - Nome da classe
     * @returns {boolean} True se a classe foi adicionada
     */
    toggleClass: function(element, className) {
        const el = typeof element === 'string' ? this.$(element) : element;
        if (el) {
            return el.classList.toggle(className);
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
        const el = typeof element === 'string' ? this.$(element) : element;
        return el ? el.classList.contains(className) : false;
    },
    
    /**
     * Define ou obtém um atributo de um elemento
     * @param {Element|string} element - Elemento ou seletor
     * @param {string} attribute - Nome do atributo
     * @param {string} value - Valor do atributo (opcional)
     * @returns {string|void} Valor do atributo se não fornecido valor
     */
    attr: function(element, attribute, value) {
        const el = typeof element === 'string' ? this.$(element) : element;
        if (!el) return;
        
        if (value !== undefined) {
            el.setAttribute(attribute, value);
        } else {
            return el.getAttribute(attribute);
        }
    },
    
    /**
     * Remove um atributo de um elemento
     * @param {Element|string} element - Elemento ou seletor
     * @param {string} attribute - Nome do atributo
     */
    removeAttr: function(element, attribute) {
        const el = typeof element === 'string' ? this.$(element) : element;
        if (el) {
            el.removeAttribute(attribute);
        }
    },
    
    /**
     * Define ou obtém o conteúdo HTML de um elemento
     * @param {Element|string} element - Elemento ou seletor
     * @param {string} html - HTML a ser definido (opcional)
     * @returns {string|void} HTML atual se não fornecido novo HTML
     */
    html: function(element, html) {
        const el = typeof element === 'string' ? this.$(element) : element;
        if (!el) return;
        
        if (html !== undefined) {
            el.innerHTML = html;
        } else {
            return el.innerHTML;
        }
    },
    
    /**
     * Define ou obtém o conteúdo de texto de um elemento
     * @param {Element|string} element - Elemento ou seletor
     * @param {string} text - Texto a ser definido (opcional)
     * @returns {string|void} Texto atual se não fornecido novo texto
     */
    text: function(element, text) {
        const el = typeof element === 'string' ? this.$(element) : element;
        if (!el) return;
        
        if (text !== undefined) {
            el.textContent = text;
        } else {
            return el.textContent;
        }
    },
    
    /**
     * Define ou obtém o valor de um campo de formulário
     * @param {Element|string} element - Elemento ou seletor
     * @param {string} value - Valor a ser definido (opcional)
     * @returns {string|void} Valor atual se não fornecido novo valor
     */
    val: function(element, value) {
        const el = typeof element === 'string' ? this.$(element) : element;
        if (!el) return;
        
        if (value !== undefined) {
            el.value = value;
        } else {
            return el.value;
        }
    },
    
    /**
     * Adiciona um event listener a um elemento
     * @param {Element|string} element - Elemento ou seletor
     * @param {string} event - Nome do evento
     * @param {Function} handler - Função manipuladora
     * @param {boolean} useCapture - Usar captura (opcional)
     */
    on: function(element, event, handler, useCapture = false) {
        const el = typeof element === 'string' ? this.$(element) : element;
        if (el) {
            el.addEventListener(event, handler, useCapture);
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
        const el = typeof element === 'string' ? this.$(element) : element;
        if (el) {
            el.removeEventListener(event, handler, useCapture);
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
        const parentEl = typeof parent === 'string' ? this.$(parent) : parent;
        if (!parentEl) return;
        
        parentEl.addEventListener(event, function(e) {
            const target = e.target.closest(selector);
            if (target && parentEl.contains(target)) {
                handler.call(target, e);
            }
        });
    },
    
    /**
     * Mostra um elemento (remove display: none)
     * @param {Element|string} element - Elemento ou seletor
     */
    show: function(element) {
        const el = typeof element === 'string' ? this.$(element) : element;
        if (el) {
            el.style.display = '';
        }
    },
    
    /**
     * Esconde um elemento (adiciona display: none)
     * @param {Element|string} element - Elemento ou seletor
     */
    hide: function(element) {
        const el = typeof element === 'string' ? this.$(element) : element;
        if (el) {
            el.style.display = 'none';
        }
    },
    
    /**
     * Alterna a visibilidade de um elemento
     * @param {Element|string} element - Elemento ou seletor
     */
    toggle: function(element) {
        const el = typeof element === 'string' ? this.$(element) : element;
        if (el) {
            if (el.style.display === 'none') {
                this.show(el);
            } else {
                this.hide(el);
            }
        }
    },
    
    /**
     * Fade in de um elemento
     * @param {Element|string} element - Elemento ou seletor
     * @param {number} duration - Duração em ms
     */
    fadeIn: function(element, duration = 300) {
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
    },
    
    /**
     * Fade out de um elemento
     * @param {Element|string} element - Elemento ou seletor
     * @param {number} duration - Duração em ms
     */
    fadeOut: function(element, duration = 300) {
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
    },
    
    /**
     * Obtém dados de um formulário como objeto
     * @param {Element|string} form - Formulário ou seletor
     * @returns {Object} Dados do formulário
     */
    getFormData: function(form) {
        const formEl = typeof form === 'string' ? this.$(form) : form;
        if (!formEl) return {};
        
        const formData = new FormData(formEl);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        return data;
    },
    
    /**
     * Preenche um formulário com dados
     * @param {Element|string} form - Formulário ou seletor
     * @param {Object} data - Dados para preencher
     */
    setFormData: function(form, data) {
        const formEl = typeof form === 'string' ? this.$(form) : form;
        if (!formEl || !data) return;
        
        Object.keys(data).forEach(key => {
            const field = formEl.querySelector(`[name="${key}"]`);
            if (field) {
                if (field.type === 'checkbox' || field.type === 'radio') {
                    field.checked = data[key];
                } else {
                    field.value = data[key];
                }
            }
        });
    },
    
    /**
     * Limpa um formulário
     * @param {Element|string} form - Formulário ou seletor
     */
    clearForm: function(form) {
        const formEl = typeof form === 'string' ? this.$(form) : form;
        if (formEl) {
            formEl.reset();
        }
    },
    
    /**
     * Rola a página até um elemento
     * @param {Element|string} element - Elemento ou seletor
     * @param {boolean} smooth - Rolagem suave
     */
    scrollTo: function(element, smooth = true) {
        const el = typeof element === 'string' ? this.$(element) : element;
        if (el) {
            el.scrollIntoView({
                behavior: smooth ? 'smooth' : 'auto',
                block: 'start'
            });
        }
    }
};

