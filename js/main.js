/**
 * SISTEMA DE TAREFAS - ARQUIVO PRINCIPAL
 * 
 * Este arquivo contém as funcionalidades globais que são utilizadas
 * em todas as páginas do sistema. Deve ser carregado primeiro.
 * 
 * Funcionalidades:
 * - Inicialização global
 * - Verificação de autenticação
 * - Utilitários globais
 * - Configurações gerais
 */

// Namespace global da aplicação
window.SistemaTarefas = window.SistemaTarefas || {};

/**
 * Configurações globais da aplicação
 */
SistemaTarefas.config = {
    // Chaves para localStorage
    STORAGE_KEYS: {
        USER_SESSION: 'sistema_tarefas_user',
        TASKS: 'sistema_tarefas_tasks',
        LISTS: 'sistema_tarefas_lists',
        SETTINGS: 'sistema_tarefas_settings'
    },
    
    // Páginas da aplicação
    PAGES: {
        LOGIN: 'index.html',
        CADASTRO: 'cadastro.html',
        HOME: 'home.html',
        LISTAS: 'listas.html',
        TAREFAS: 'tarefas.html'
    },
    
    // Status das tarefas
    TASK_STATUS: {
        PENDENTE: 'pendente',
        EM_ANDAMENTO: 'em_andamento',
        CONCLUIDA: 'concluida',
        CANCELADA: 'cancelada'
    },
    
    // Prioridades das tarefas
    TASK_PRIORITY: {
        BAIXA: 'baixa',
        MEDIA: 'media',
        ALTA: 'alta',
        URGENTE: 'urgente'
    }
};

/**
 * Utilitários globais
 */
SistemaTarefas.utils = {
    /**
     * Gera um ID único
     * @returns {string} ID único
     */
    generateId: function() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    
    /**
     * Formata uma data para exibição
     * @param {Date|string} date - Data a ser formatada
     * @returns {string} Data formatada
     */
    formatDate: function(date) {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('pt-BR');
    },
    
    /**
     * Formata data e hora para exibição
     * @param {Date|string} date - Data a ser formatada
     * @returns {string} Data e hora formatadas
     */
    formatDateTime: function(date) {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleString('pt-BR');
    },
    
    /**
     * Sanitiza texto para evitar XSS
     * @param {string} text - Texto a ser sanitizado
     * @returns {string} Texto sanitizado
     */
    sanitizeText: function(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    /**
     * Debounce para otimizar eventos
     * @param {Function} func - Função a ser executada
     * @param {number} wait - Tempo de espera em ms
     * @returns {Function} Função com debounce
     */
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

/**
 * Gerenciador de autenticação global
 */
SistemaTarefas.auth = {
    /**
     * Verifica se o usuário está logado
     * @returns {boolean} True se estiver logado
     */
    isLoggedIn: function() {
        const user = localStorage.getItem(SistemaTarefas.config.STORAGE_KEYS.USER_SESSION);
        return user !== null;
    },
    
    /**
     * Obtém os dados do usuário logado
     * @returns {Object|null} Dados do usuário ou null
     */
    getCurrentUser: function() {
        const userData = localStorage.getItem(SistemaTarefas.config.STORAGE_KEYS.USER_SESSION);
        return userData ? JSON.parse(userData) : null;
    },
    
    /**
     * Redireciona para login se não estiver autenticado
     */
    requireAuth: function() {
        if (!this.isLoggedIn()) {
            window.location.href = SistemaTarefas.config.PAGES.LOGIN;
        }
    },
    
    /**
     * Redireciona para home se já estiver autenticado
     */
    redirectIfAuthenticated: function() {
        if (this.isLoggedIn()) {
            window.location.href = SistemaTarefas.config.PAGES.HOME;
        }
    },
    
    /**
     * Faz logout do usuário
     */
    logout: function() {
        localStorage.removeItem(SistemaTarefas.config.STORAGE_KEYS.USER_SESSION);
        window.location.href = SistemaTarefas.config.PAGES.LOGIN;
    }
};

/**
 * Sistema de notificações global
 */
SistemaTarefas.notification = {
    /**
     * Mostra uma notificação de sucesso
     * @param {string} message - Mensagem a ser exibida
     */
    success: function(message) {
        this.show(message, 'success');
    },
    
    /**
     * Mostra uma notificação de erro
     * @param {string} message - Mensagem a ser exibida
     */
    error: function(message) {
        this.show(message, 'error');
    },
    
    /**
     * Mostra uma notificação de aviso
     * @param {string} message - Mensagem a ser exibida
     */
    warning: function(message) {
        this.show(message, 'warning');
    },
    
    /**
     * Mostra uma notificação de informação
     * @param {string} message - Mensagem a ser exibida
     */
    info: function(message) {
        this.show(message, 'info');
    },
    
    /**
     * Exibe uma notificação
     * @param {string} message - Mensagem
     * @param {string} type - Tipo da notificação
     */
    show: function(message, type = 'info') {
        // Remove notificações existentes
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());
        
        // Cria a notificação
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${SistemaTarefas.utils.sanitizeText(message)}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // Adiciona ao body
        document.body.appendChild(notification);
        
        // Remove automaticamente após 5 segundos
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
};

/**
 * Inicialização global da aplicação
 */
SistemaTarefas.init = function() {
    console.log('Sistema de Tarefas inicializado');
    
    // Adiciona estilos CSS para notificações se não existirem
    if (!document.getElementById('sistema-tarefas-styles')) {
        const styles = document.createElement('style');
        styles.id = 'sistema-tarefas-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                max-width: 400px;
                padding: 0;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                animation: slideInRight 0.3s ease-out;
            }
            
            .notification-content {
                padding: 16px;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
            
            .notification-success { background-color: #d4edda; color: #155724; border-left: 4px solid #28a745; }
            .notification-error { background-color: #f8d7da; color: #721c24; border-left: 4px solid #dc3545; }
            .notification-warning { background-color: #fff3cd; color: #856404; border-left: 4px solid #ffc107; }
            .notification-info { background-color: #d1ecf1; color: #0c5460; border-left: 4px solid #17a2b8; }
            
            .notification-message {
                flex: 1;
                margin-right: 10px;
            }
            
            .notification-close {
                background: none;
                border: none;
                font-size: 20px;
                cursor: pointer;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0.7;
            }
            
            .notification-close:hover {
                opacity: 1;
            }
            
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            .loading {
                display: inline-block;
                width: 20px;
                height: 20px;
                border: 3px solid #f3f3f3;
                border-top: 3px solid #3498db;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(styles);
    }
    
    // Configura event listeners globais
    this.setupGlobalEventListeners();
};

/**
 * Configura event listeners globais
 */
SistemaTarefas.setupGlobalEventListeners = function() {
    // Listener para logout em botões com classe 'logout-btn'
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('logout-btn')) {
            event.preventDefault();
            if (confirm('Deseja realmente sair do sistema?')) {
                SistemaTarefas.auth.logout();
            }
        }
    });
    
    // Listener para prevenção de submit em formulários com classe 'prevent-default'
    document.addEventListener('submit', function(event) {
        if (event.target.classList.contains('prevent-default')) {
            event.preventDefault();
        }
    });
};

// Inicializa a aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    SistemaTarefas.init();
});

// Exporta para uso global
window.SistemaTarefas = SistemaTarefas;

