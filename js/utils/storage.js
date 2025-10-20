/**
 * UTILITÁRIO DE ARMAZENAMENTO (STORAGE)
 * 
 * Este arquivo contém funções para gerenciar o armazenamento local (localStorage)
 * de forma segura e organizada, seguindo os conceitos da Web Storage API.
 * 
 * Funcionalidades:
 * - Salvar e recuperar dados do localStorage
 * - Validação e tratamento de erros
 * - Métodos específicos para cada tipo de dado
 */

SistemaTarefas.storage = {
    // Cache em memória para reduzir acessos ao localStorage
    cache: {
        tasks: null,
        lists: null,
        users: null,
        lastUpdate: {}
    },
    
    // Tempo de validade do cache em ms (5 segundos)
    CACHE_TTL: 5000,
    
    /**
     * Verifica se o cache está válido
     * @param {string} key - Chave do cache
     * @returns {boolean} True se válido
     */
    isCacheValid: function(key) {
        const lastUpdate = this.cache.lastUpdate[key];
        if (!lastUpdate) return false;
        return (Date.now() - lastUpdate) < this.CACHE_TTL;
    },
    
    /**
     * Atualiza timestamp do cache
     * @param {string} key - Chave do cache
     */
    updateCacheTimestamp: function(key) {
        this.cache.lastUpdate[key] = Date.now();
    },
    
    /**
     * Limpa o cache
     */
    clearCache: function() {
        this.cache.tasks = null;
        this.cache.lists = null;
        this.cache.users = null;
        this.cache.lastUpdate = {};
    },
    
    /**
     * Verifica se há espaço no localStorage
     * @returns {boolean} True se há espaço
     */
    hasStorageSpace: function() {
        try {
            const testKey = '__storage_test__';
            const testValue = 'x'.repeat(1024); // 1KB
            localStorage.setItem(testKey, testValue);
            localStorage.removeItem(testKey);
            return true;
        } catch (error) {
            return false;
        }
    },
    
    /**
     * Salva dados no localStorage de forma segura
     * @param {string} key - Chave para armazenamento
     * @param {*} data - Dados a serem salvos
     * @returns {boolean} True se salvou com sucesso
     */
    save: function(key, data) {
        try {
            // Valida entrada
            if (!key || data === undefined) {
                console.error('Chave ou dados inválidos');
                return false;
            }
            
            // Verifica espaço disponível
            if (!this.hasStorageSpace()) {
                SistemaTarefas.notification.error(SistemaTarefas.config.MESSAGES.ERROR.STORAGE_FULL);
                return false;
            }
            
            const jsonData = JSON.stringify(data);
            localStorage.setItem(key, jsonData);
            
            // Atualiza cache se for uma chave conhecida
            this.updateCacheForKey(key, data);
            
            return true;
        } catch (error) {
            console.error('Erro ao salvar no localStorage:', error);
            
            if (error.name === 'QuotaExceededError') {
                SistemaTarefas.notification.error(SistemaTarefas.config.MESSAGES.ERROR.STORAGE_FULL);
            } else {
                SistemaTarefas.notification.error('Erro ao salvar dados');
            }
            
            return false;
        }
    },
    
    /**
     * Atualiza cache para chave específica
     * @param {string} key - Chave
     * @param {*} data - Dados
     */
    updateCacheForKey: function(key, data) {
        const config = SistemaTarefas.config.STORAGE_KEYS;
        
        if (key === config.TASKS) {
            this.cache.tasks = data;
            this.updateCacheTimestamp('tasks');
        } else if (key === config.LISTS) {
            this.cache.lists = data;
            this.updateCacheTimestamp('lists');
        } else if (key === config.USERS) {
            this.cache.users = data;
            this.updateCacheTimestamp('users');
        }
    },
    
    /**
     * Recupera dados do localStorage com cache
     * @param {string} key - Chave dos dados
     * @param {*} defaultValue - Valor padrão se não encontrar
     * @returns {*} Dados recuperados ou valor padrão
     */
    get: function(key, defaultValue = null) {
        try {
            // Verifica cache primeiro
            const cachedData = this.getCachedData(key);
            if (cachedData !== null) {
                return cachedData;
            }
            
            const data = localStorage.getItem(key);
            
            if (data === null || data === 'undefined') {
                return defaultValue;
            }
            
            const parsedData = JSON.parse(data);
            
            // Atualiza cache
            this.updateCacheForKey(key, parsedData);
            
            return parsedData;
        } catch (error) {
            console.error('Erro ao recuperar do localStorage:', error);
            
            if (error instanceof SyntaxError) {
                console.error('Dados corrompidos para chave:', key);
                SistemaTarefas.notification.warning('Alguns dados estão corrompidos');
            }
            
            return defaultValue;
        }
    },
    
    /**
     * Obtém dados do cache se válido
     * @param {string} key - Chave
     * @returns {*} Dados do cache ou null
     */
    getCachedData: function(key) {
        const config = SistemaTarefas.config.STORAGE_KEYS;
        
        if (key === config.TASKS && this.isCacheValid('tasks')) {
            return this.cache.tasks;
        } else if (key === config.LISTS && this.isCacheValid('lists')) {
            return this.cache.lists;
        } else if (key === config.USERS && this.isCacheValid('users')) {
            return this.cache.users;
        }
        
        return null;
    },
    
    /**
     * Remove dados do localStorage
     * @param {string} key - Chave a ser removida
     * @returns {boolean} True se removeu com sucesso
     */
    remove: function(key) {
        try {
            localStorage.removeItem(key);
            
            // Limpa cache relacionado
            this.updateCacheForKey(key, null);
            
            return true;
        } catch (error) {
            console.error('Erro ao remover do localStorage:', error);
            return false;
        }
    },
    
    /**
     * Limpa todos os dados do sistema
     * @returns {boolean} True se limpou com sucesso
     */
    clear: function() {
        try {
            const keys = Object.values(SistemaTarefas.config.STORAGE_KEYS);
            keys.forEach(key => localStorage.removeItem(key));
            this.clearCache();
            return true;
        } catch (error) {
            console.error('Erro ao limpar localStorage:', error);
            return false;
        }
    },
    
    /**
     * Verifica se uma chave existe no localStorage
     * @param {string} key - Chave a ser verificada
     * @returns {boolean} True se existe
     */
    exists: function(key) {
        try {
            return localStorage.getItem(key) !== null;
        } catch (error) {
            console.error('Erro ao verificar existência:', error);
            return false;
        }
    },
    
    // ========== MÉTODOS ESPECÍFICOS PARA USUÁRIOS ==========
    
    /**
     * Salva dados do usuário logado
     * @param {Object} userData - Dados do usuário
     * @returns {boolean} True se salvou com sucesso
     */
    saveUser: function(userData) {
        if (!userData || !userData.email) {
            console.error('Dados de usuário inválidos');
            return false;
        }
        
        const userWithTimestamp = {
            ...userData,
            loginTime: new Date().toISOString()
        };
        
        return this.save(SistemaTarefas.config.STORAGE_KEYS.USER_SESSION, userWithTimestamp);
    },
    
    /**
     * Recupera dados do usuário logado
     * @returns {Object|null} Dados do usuário ou null
     */
    getUser: function() {
        return this.get(SistemaTarefas.config.STORAGE_KEYS.USER_SESSION);
    },
    
    /**
     * Remove dados do usuário (logout)
     * @returns {boolean} True se removeu com sucesso
     */
    removeUser: function() {
        return this.remove(SistemaTarefas.config.STORAGE_KEYS.USER_SESSION);
    },
    
    /**
     * Obtém lista de usuários registrados
     * @returns {Array} Lista de usuários
     */
    getRegisteredUsers: function() {
        return this.get(SistemaTarefas.config.STORAGE_KEYS.USERS, []);
    },
    
    /**
     * Salva lista de usuários registrados
     * @param {Array} users - Lista de usuários
     * @returns {boolean} True se salvou com sucesso
     */
    saveRegisteredUsers: function(users) {
        if (!Array.isArray(users)) {
            console.error('Lista de usuários deve ser um array');
            return false;
        }
        return this.save(SistemaTarefas.config.STORAGE_KEYS.USERS, users);
    },
    
    // ========== MÉTODOS ESPECÍFICOS PARA TAREFAS ==========
    
    /**
     * Salva lista de tarefas
     * @param {Array} tasks - Array de tarefas
     * @returns {boolean} True se salvou com sucesso
     */
    saveTasks: function(tasks) {
        if (!Array.isArray(tasks)) {
            console.error('Lista de tarefas deve ser um array');
            return false;
        }
        return this.save(SistemaTarefas.config.STORAGE_KEYS.TASKS, tasks);
    },
    
    /**
     * Recupera lista de tarefas
     * @returns {Array} Array de tarefas
     */
    getTasks: function() {
        return this.get(SistemaTarefas.config.STORAGE_KEYS.TASKS, []);
    },
    
    /**
     * Adiciona uma nova tarefa
     * @param {Object} task - Dados da tarefa
     * @returns {Object|null} Tarefa criada ou null em caso de erro
     */
    addTask: function(task) {
        if (!task || !task.title) {
            console.error('Dados de tarefa inválidos');
            return null;
        }
        
        const tasks = this.getTasks();
        const newTask = {
            id: SistemaTarefas.utils.generateId(),
            title: task.title,
            description: task.description || '',
            status: task.status || SistemaTarefas.config.TASK_STATUS.PENDENTE,
            priority: task.priority || SistemaTarefas.config.TASK_PRIORITY.MEDIA,
            listId: task.listId || 'default',
            dueDate: task.dueDate || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        tasks.push(newTask);
        
        if (this.saveTasks(tasks)) {
            return newTask;
        }
        
        return null;
    },
    
    /**
     * Atualiza uma tarefa existente
     * @param {string} taskId - ID da tarefa
     * @param {Object} updates - Dados a serem atualizados
     * @returns {boolean} True se atualizou com sucesso
     */
    updateTask: function(taskId, updates) {
        if (!taskId || !updates) {
            console.error('ID ou dados de atualização inválidos');
            return false;
        }
        
        const tasks = this.getTasks();
        const taskIndex = tasks.findIndex(task => task.id === taskId);
        
        if (taskIndex === -1) {
            console.error('Tarefa não encontrada:', taskId);
            return false;
        }
        
        tasks[taskIndex] = {
            ...tasks[taskIndex],
            ...updates,
            id: taskId, // Garante que o ID não seja alterado
            updatedAt: new Date().toISOString()
        };
        
        return this.saveTasks(tasks);
    },
    
    /**
     * Remove uma tarefa
     * @param {string} taskId - ID da tarefa
     * @returns {boolean} True se removeu com sucesso
     */
    removeTask: function(taskId) {
        if (!taskId) {
            console.error('ID de tarefa inválido');
            return false;
        }
        
        const tasks = this.getTasks();
        const filteredTasks = tasks.filter(task => task.id !== taskId);
        
        if (filteredTasks.length === tasks.length) {
            console.error('Tarefa não encontrada:', taskId);
            return false;
        }
        
        return this.saveTasks(filteredTasks);
    },
    
    /**
     * Busca uma tarefa por ID
     * @param {string} taskId - ID da tarefa
     * @returns {Object|null} Tarefa encontrada ou null
     */
    getTaskById: function(taskId) {
        if (!taskId) return null;
        const tasks = this.getTasks();
        return tasks.find(task => task.id === taskId) || null;
    },
    
    // ========== MÉTODOS ESPECÍFICOS PARA LISTAS ==========
    
    /**
     * Salva listas de tarefas
     * @param {Array} lists - Array de listas
     * @returns {boolean} True se salvou com sucesso
     */
    saveLists: function(lists) {
        if (!Array.isArray(lists)) {
            console.error('Lista de listas deve ser um array');
            return false;
        }
        return this.save(SistemaTarefas.config.STORAGE_KEYS.LISTS, lists);
    },
    
    /**
     * Recupera listas de tarefas
     * @returns {Array} Array de listas
     */
    getLists: function() {
        const defaultLists = [
            {
                id: 'default',
                name: 'Tarefas Gerais',
                description: 'Lista padrão para tarefas gerais',
                createdAt: new Date().toISOString(),
                isDefault: true
            }
        ];
        return this.get(SistemaTarefas.config.STORAGE_KEYS.LISTS, defaultLists);
    },
    
    /**
     * Adiciona uma nova lista
     * @param {Object} list - Dados da lista
     * @returns {Object|null} Lista criada ou null em caso de erro
     */
    addList: function(list) {
        if (!list || !list.name) {
            console.error('Dados de lista inválidos');
            return null;
        }
        
        const lists = this.getLists();
        const newList = {
            id: SistemaTarefas.utils.generateId(),
            name: list.name,
            description: list.description || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isDefault: false
        };
        
        lists.push(newList);
        
        if (this.saveLists(lists)) {
            return newList;
        }
        
        return null;
    },
    
    /**
     * Atualiza uma lista existente
     * @param {string} listId - ID da lista
     * @param {Object} updates - Dados a serem atualizados
     * @returns {boolean} True se atualizou com sucesso
     */
    updateList: function(listId, updates) {
        if (!listId || !updates) {
            console.error('ID ou dados de atualização inválidos');
            return false;
        }
        
        const lists = this.getLists();
        const listIndex = lists.findIndex(list => list.id === listId);
        
        if (listIndex === -1) {
            console.error('Lista não encontrada:', listId);
            return false;
        }
        
        lists[listIndex] = {
            ...lists[listIndex],
            ...updates,
            id: listId, // Garante que o ID não seja alterado
            updatedAt: new Date().toISOString()
        };
        
        return this.saveLists(lists);
    },
    
    /**
     * Remove uma lista (não permite remover a lista padrão)
     * @param {string} listId - ID da lista
     * @returns {boolean} True se removeu com sucesso
     */
    removeList: function(listId) {
        if (!listId) {
            console.error('ID de lista inválido');
            return false;
        }
        
        const lists = this.getLists();
        const listToRemove = lists.find(list => list.id === listId);
        
        if (!listToRemove) {
            console.error('Lista não encontrada:', listId);
            return false;
        }
        
        if (listToRemove.isDefault) {
            SistemaTarefas.notification.warning('Não é possível remover a lista padrão');
            return false;
        }
        
        // Move tarefas da lista removida para a lista padrão
        const tasks = this.getTasks();
        const updatedTasks = tasks.map(task => {
            if (task.listId === listId) {
                return { ...task, listId: 'default', updatedAt: new Date().toISOString() };
            }
            return task;
        });
        this.saveTasks(updatedTasks);
        
        // Remove a lista
        const filteredLists = lists.filter(list => list.id !== listId);
        return this.saveLists(filteredLists);
    },
    
    /**
     * Busca uma lista por ID
     * @param {string} listId - ID da lista
     * @returns {Object|null} Lista encontrada ou null
     */
    getListById: function(listId) {
        if (!listId) return null;
        const lists = this.getLists();
        return lists.find(list => list.id === listId) || null;
    },
    
    // ========== MÉTODOS DE ESTATÍSTICAS ==========
    
    /**
     * Obtém estatísticas das tarefas
     * @returns {Object} Objeto com estatísticas
     */
    getTaskStats: function() {
        const tasks = this.getTasks();
        
        const stats = {
            total: tasks.length,
            pendentes: 0,
            emAndamento: 0,
            concluidas: 0,
            canceladas: 0,
            porPrioridade: {
                baixa: 0,
                media: 0,
                alta: 0,
                urgente: 0
            },
            porLista: {}
        };
        
        tasks.forEach(task => {
            // Contagem por status
            const status = task.status || SistemaTarefas.config.TASK_STATUS.PENDENTE;
            switch (status) {
                case SistemaTarefas.config.TASK_STATUS.PENDENTE:
                    stats.pendentes++;
                    break;
                case SistemaTarefas.config.TASK_STATUS.EM_ANDAMENTO:
                    stats.emAndamento++;
                    break;
                case SistemaTarefas.config.TASK_STATUS.CONCLUIDA:
                    stats.concluidas++;
                    break;
                case SistemaTarefas.config.TASK_STATUS.CANCELADA:
                    stats.canceladas++;
                    break;
            }
            
            // Contagem por prioridade
            const priority = task.priority || SistemaTarefas.config.TASK_PRIORITY.MEDIA;
            if (stats.porPrioridade.hasOwnProperty(priority)) {
                stats.porPrioridade[priority]++;
            }
            
            // Contagem por lista
            const listId = task.listId || 'default';
            stats.porLista[listId] = (stats.porLista[listId] || 0) + 1;
        });
        
        return stats;
    }
};

