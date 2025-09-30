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
    /**
     * Salva dados no localStorage de forma segura
     * @param {string} key - Chave para armazenamento
     * @param {*} data - Dados a serem salvos
     * @returns {boolean} True se salvou com sucesso
     */
    save: function(key, data) {
        try {
            const jsonData = JSON.stringify(data);
            localStorage.setItem(key, jsonData);
            return true;
        } catch (error) {
            console.error('Erro ao salvar no localStorage:', error);
            SistemaTarefas.notification.error('Erro ao salvar dados localmente');
            return false;
        }
    },
    
    /**
     * Recupera dados do localStorage
     * @param {string} key - Chave dos dados
     * @param {*} defaultValue - Valor padrão se não encontrar
     * @returns {*} Dados recuperados ou valor padrão
     */
    get: function(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error('Erro ao recuperar do localStorage:', error);
            return defaultValue;
        }
    },
    
    /**
     * Remove dados do localStorage
     * @param {string} key - Chave a ser removida
     * @returns {boolean} True se removeu com sucesso
     */
    remove: function(key) {
        try {
            localStorage.removeItem(key);
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
        return localStorage.getItem(key) !== null;
    },
    
    // MÉTODOS ESPECÍFICOS PARA USUÁRIOS
    
    /**
     * Salva dados do usuário logado
     * @param {Object} userData - Dados do usuário
     * @returns {boolean} True se salvou com sucesso
     */
    saveUser: function(userData) {
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
    
    // MÉTODOS ESPECÍFICOS PARA TAREFAS
    
    /**
     * Salva lista de tarefas
     * @param {Array} tasks - Array de tarefas
     * @returns {boolean} True se salvou com sucesso
     */
    saveTasks: function(tasks) {
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
     * @returns {boolean} True se adicionou com sucesso
     */
    addTask: function(task) {
        const tasks = this.getTasks();
        const newTask = {
            id: SistemaTarefas.utils.generateId(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...task
        };
        tasks.push(newTask);
        return this.saveTasks(tasks);
    },
    
    /**
     * Atualiza uma tarefa existente
     * @param {string} taskId - ID da tarefa
     * @param {Object} updates - Dados a serem atualizados
     * @returns {boolean} True se atualizou com sucesso
     */
    updateTask: function(taskId, updates) {
        const tasks = this.getTasks();
        const taskIndex = tasks.findIndex(task => task.id === taskId);
        
        if (taskIndex === -1) {
            console.error('Tarefa não encontrada:', taskId);
            return false;
        }
        
        tasks[taskIndex] = {
            ...tasks[taskIndex],
            ...updates,
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
        const tasks = this.getTasks();
        const filteredTasks = tasks.filter(task => task.id !== taskId);
        return this.saveTasks(filteredTasks);
    },
    
    /**
     * Busca uma tarefa por ID
     * @param {string} taskId - ID da tarefa
     * @returns {Object|null} Tarefa encontrada ou null
     */
    getTaskById: function(taskId) {
        const tasks = this.getTasks();
        return tasks.find(task => task.id === taskId) || null;
    },
    
    // MÉTODOS ESPECÍFICOS PARA LISTAS
    
    /**
     * Salva listas de tarefas
     * @param {Array} lists - Array de listas
     * @returns {boolean} True se salvou com sucesso
     */
    saveLists: function(lists) {
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
     * @returns {boolean} True se adicionou com sucesso
     */
    addList: function(list) {
        const lists = this.getLists();
        const newList = {
            id: SistemaTarefas.utils.generateId(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isDefault: false,
            ...list
        };
        lists.push(newList);
        return this.saveLists(lists);
    },
    
    /**
     * Atualiza uma lista existente
     * @param {string} listId - ID da lista
     * @param {Object} updates - Dados a serem atualizados
     * @returns {boolean} True se atualizou com sucesso
     */
    updateList: function(listId, updates) {
        const lists = this.getLists();
        const listIndex = lists.findIndex(list => list.id === listId);
        
        if (listIndex === -1) {
            console.error('Lista não encontrada:', listId);
            return false;
        }
        
        lists[listIndex] = {
            ...lists[listIndex],
            ...updates,
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
                return { ...task, listId: 'default' };
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
        const lists = this.getLists();
        return lists.find(list => list.id === listId) || null;
    },
    
    // MÉTODOS DE ESTATÍSTICAS
    
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
            switch (task.status) {
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
            if (task.priority && stats.porPrioridade.hasOwnProperty(task.priority)) {
                stats.porPrioridade[task.priority]++;
            }
            
            // Contagem por lista
            const listId = task.listId || 'default';
            stats.porLista[listId] = (stats.porLista[listId] || 0) + 1;
        });
        
        return stats;
    }
};

