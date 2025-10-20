/**
 * SISTEMA DE TAREFAS - ARQUIVO PRINCIPAL REFATORADO
 * 
 * Melhorias implementadas:
 * - Tratamento robusto de erros
 * - Remoção de event listeners duplicados
 * - Constantes centralizadas
 * - Código mais limpo e organizado
 * - Melhor separação de responsabilidades
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
        USERS: 'sistema_tarefas_registered_users',
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
    },
    
    // Labels para exibição
    LABELS: {
        STATUS: {
            pendente: 'Pendente',
            em_andamento: 'Em Andamento',
            concluida: 'Concluída',
            cancelada: 'Cancelada'
        },
        PRIORITY: {
            baixa: 'Baixa',
            media: 'Média',
            alta: 'Alta',
            urgente: 'Urgente'
        }
    },
    
    // Limites e validações
    LIMITS: {
        MAX_TITLE_LENGTH: 100,
        MAX_DESCRIPTION_LENGTH: 500,
        MAX_LIST_NAME_LENGTH: 50,
        MAX_LIST_DESCRIPTION_LENGTH: 200,
        MIN_PASSWORD_LENGTH: 6,
        MIN_NAME_LENGTH: 2
    },
    
    // Mensagens padrão
    MESSAGES: {
        ERROR: {
            GENERIC: 'Ocorreu um erro. Tente novamente.',
            STORAGE_FULL: 'Armazenamento cheio. Exclua alguns dados.',
            CORRUPTED_DATA: 'Dados corrompidos. Faça backup e limpe o cache.',
            NETWORK: 'Erro de conexão. Verifique sua internet.'
        },
        SUCCESS: {
            SAVED: 'Salvo com sucesso!',
            DELETED: 'Excluído com sucesso!',
            UPDATED: 'Atualizado com sucesso!'
        }
    }
};

/**
 * Utilitários globais
 */
SistemaTarefas.utils = {
    /**
     * Gera um ID único usando timestamp e random
     * @returns {string} ID único
     */
    generateId: function() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    },
    
    /**
     * Formata uma data para exibição no padrão brasileiro
     * @param {Date|string} date - Data a ser formatada
     * @returns {string} Data formatada (dd/mm/yyyy)
     */
    formatDate: function(date) {
        if (!date) return '';
        try {
            const d = new Date(date);
            if (isNaN(d.getTime())) return '';
            return d.toLocaleDateString('pt-BR');
        } catch (error) {
            console.error('Erro ao formatar data:', error);
            return '';
        }
    },
    
    /**
     * Formata data e hora para exibição
     * @param {Date|string} date - Data a ser formatada
     * @returns {string} Data e hora formatadas (dd/mm/yyyy hh:mm:ss)
     */
    formatDateTime: function(date) {
        if (!date) return '';
        try {
            const d = new Date(date);
            if (isNaN(d.getTime())) return '';
            return d.toLocaleString('pt-BR');
        } catch (error) {
            console.error('Erro ao formatar data/hora:', error);
            return '';
        }
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
     * Sanitiza HTML removendo scripts e tags perigosas
     * @param {string} html - HTML a ser sanitizado
     * @returns {string} HTML sanitizado
     */
    sanitizeHTML: function(html) {
        if (!html) return '';
        const temp = document.createElement('div');
        temp.textContent = html;
        return temp.innerHTML;
    },
    
    /**
     * Debounce para otimizar eventos frequentes
     * @param {Function} func - Função a ser executada
     * @param {number} wait - Tempo de espera em ms
     * @returns {Function} Função com debounce aplicado
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
    },
    
    /**
     * Valida se uma data é futura ou hoje
     * @param {string|Date} date - Data a ser validada
     * @returns {boolean} True se for válida
     */
    isValidFutureDate: function(date) {
        if (!date) return true; // Data opcional
        try {
            const inputDate = new Date(date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            inputDate.setHours(0, 0, 0, 0);
            return inputDate >= today;
        } catch (error) {
            return false;
        }
    },
    
    /**
     * Trunca texto com reticências
     * @param {string} text - Texto a ser truncado
     * @param {number} maxLength - Comprimento máximo
     * @returns {string} Texto truncado
     */
    truncate: function(text, maxLength) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    },
    
    /**
     * Cria hash simples de string (para senhas - melhor que texto plano)
     * NOTA: Não é criptograficamente seguro, apenas ofuscação básica
     * @param {string} str - String a ser hasheada
     * @returns {string} Hash da string
     */
    simpleHash: function(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString(36);
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
        try {
            const user = localStorage.getItem(SistemaTarefas.config.STORAGE_KEYS.USER_SESSION);
            return user !== null && user !== 'undefined';
        } catch (error) {
            console.error('Erro ao verificar login:', error);
            return false;
        }
    },
    
    /**
     * Obtém os dados do usuário logado
     * @returns {Object|null} Dados do usuário ou null
     */
    getCurrentUser: function() {
        try {
            const userData = localStorage.getItem(SistemaTarefas.config.STORAGE_KEYS.USER_SESSION);
            if (!userData || userData === 'undefined') return null;
            return JSON.parse(userData);
        } catch (error) {
            console.error('Erro ao obter usuário:', error);
            return null;
        }
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
        try {
            localStorage.removeItem(SistemaTarefas.config.STORAGE_KEYS.USER_SESSION);
            window.location.href = SistemaTarefas.config.PAGES.LOGIN;
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
            // Força redirecionamento mesmo com erro
            window.location.href = SistemaTarefas.config.PAGES.LOGIN;
        }
    }
};

/**
 * Sistema de notificações global (melhorado)
 */
SistemaTarefas.notification = {
    // Armazena referência da notificação atual
    currentNotification: null,
    
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
        // Remove notificação existente
        if (this.currentNotification) {
            this.currentNotification.remove();
        }
        
        // Cria a notificação
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.setAttribute('role', 'alert');
        notification.setAttribute('aria-live', 'polite');
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${SistemaTarefas.utils.sanitizeText(message)}</span>
                <button class="notification-close" aria-label="Fechar notificação">×</button>
            </div>
        `;
        
        // Event listener para fechar
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.remove();
            this.currentNotification = null;
        });
        
        // Adiciona ao body
        document.body.appendChild(notification);
        this.currentNotification = notification;
        
        // Remove automaticamente após 5 segundos
        setTimeout(() => {
            if (notification && notification.parentElement) {
                notification.classList.add('notification-fade-out');
                setTimeout(() => {
                    if (notification.parentElement) {
                        notification.remove();
                    }
                    if (this.currentNotification === notification) {
                        this.currentNotification = null;
                    }
                }, 300);
            }
        }, 5000);
    }
};

/**
 * Inicialização global da aplicação
 */
SistemaTarefas.init = function() {
    console.log('Sistema de Tarefas inicializado (versão refatorada)');
    
    // Adiciona estilos CSS para notificações
    this.injectStyles();
    
    // Configura event listeners globais
    this.setupGlobalEventListeners();
    
    // Verifica integridade do localStorage
    this.checkStorageHealth();
};

/**
 * Injeta estilos CSS necessários
 */
SistemaTarefas.injectStyles = function() {
    if (document.getElementById('sistema-tarefas-styles')) return;
    
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
            gap: 10px;
        }
        
        .notification-success { 
            background-color: #d4edda; 
            color: #155724; 
            border-left: 4px solid #28a745; 
        }
        .notification-error { 
            background-color: #f8d7da; 
            color: #721c24; 
            border-left: 4px solid #dc3545; 
        }
        .notification-warning { 
            background-color: #fff3cd; 
            color: #856404; 
            border-left: 4px solid #ffc107; 
        }
        .notification-info { 
            background-color: #d1ecf1; 
            color: #0c5460; 
            border-left: 4px solid #17a2b8; 
        }
        
        .notification-message {
            flex: 1;
            word-break: break-word;
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
            transition: opacity 0.2s;
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
        
        .notification-fade-out {
            animation: fadeOut 0.3s ease-out forwards;
        }
        
        @keyframes fadeOut {
            from {
                opacity: 1;
                transform: translateX(0);
            }
            to {
                opacity: 0;
                transform: translateX(100%);
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
};

/**
 * Configura event listeners globais
 */
SistemaTarefas.setupGlobalEventListeners = function() {
    // Listener para logout (usando delegation para evitar duplicação)
    document.addEventListener('click', function(event) {
        if (event.target.closest('.logout-btn')) {
            event.preventDefault();
            if (confirm('Deseja realmente sair do sistema?')) {
                SistemaTarefas.auth.logout();
            }
        }
    });
    
    // Listener para prevenção de submit padrão
    document.addEventListener('submit', function(event) {
        if (event.target.classList.contains('prevent-default')) {
            event.preventDefault();
        }
    });
};

/**
 * Verifica integridade do localStorage
 */
SistemaTarefas.checkStorageHealth = function() {
    try {
        // Tenta escrever e ler um valor de teste
        const testKey = '__storage_test__';
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
    } catch (error) {
        console.error('Problema com localStorage:', error);
        if (error.name === 'QuotaExceededError') {
            SistemaTarefas.notification.error(SistemaTarefas.config.MESSAGES.ERROR.STORAGE_FULL);
        }
    }
};

// Inicializa a aplicação quando o DOM estiver carregado
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        SistemaTarefas.init();
    });
} else {
    // DOM já está pronto
    SistemaTarefas.init();
}

// Exporta para uso global
window.SistemaTarefas = SistemaTarefas;

