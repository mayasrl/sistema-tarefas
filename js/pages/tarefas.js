/**
 * PÁGINA DE TAREFAS (tarefas.html)
 * 
 * Este arquivo contém toda a lógica da página de gerenciamento de tarefas.
 * Funcionalidades implementadas:
 * - Exibição de todas as tarefas
 * - Criação de novas tarefas
 * - Edição de tarefas existentes
 * - Exclusão de tarefas
 * - Filtros por status, prioridade e lista
 * - Busca de tarefas
 * - Alteração de status das tarefas
 * 
 * Deve ser carregado apenas na página tarefas.html
 */

// Namespace para a página de tarefas
SistemaTarefas.TarefasPage = {
    // Estado atual da página
    currentEditingId: null,
    currentFilters: {
        status: 'all',
        priority: 'all',
        list: 'all',
        search: ''
    },
    
    /**
     * Inicializa a página de tarefas
     */
    init: function() {
        console.log('Página de tarefas inicializada');
        
        // Verifica autenticação
        SistemaTarefas.auth.requireAuth();
        
        // Configura event listeners
        this.setupEventListeners();
        
        // Carrega listas para os selects
        this.loadListsInSelects();
        
        // Carrega tarefas
        this.loadTasks();
        
        // Atualiza informações do usuário
        this.updateUserInfo();
        
        // Verifica parâmetros da URL
        this.checkUrlParams();
    },
    
    /**
     * Configura os event listeners da página
     */
    setupEventListeners: function() {
        // Event listener para logout
        const logoutBtn = SistemaTarefas.dom.$('.logout-btn, #logoutBtn');
        if (logoutBtn) {
            SistemaTarefas.dom.on(logoutBtn, 'click', (e) => {
                e.preventDefault();
                this.handleLogout();
            });
        }
        
        // Event listeners para navegação
        const navLinks = {
            '.nav-home, .btn-home': SistemaTarefas.config.PAGES.HOME,
            '.nav-listas, .btn-listas': SistemaTarefas.config.PAGES.LISTAS,
            '.nav-tarefas, .btn-tarefas': SistemaTarefas.config.PAGES.TAREFAS
        };
        
        Object.keys(navLinks).forEach(selector => {
            const elements = SistemaTarefas.dom.$$(selector);
            elements.forEach(element => {
                SistemaTarefas.dom.on(element, 'click', (e) => {
                    e.preventDefault();
                    window.location.href = navLinks[selector];
                });
            });
        });
        
        // Event listener para botão de nova tarefa
        const newTaskBtn = SistemaTarefas.dom.$('.btn-new-task, #newTaskBtn');
        if (newTaskBtn) {
            SistemaTarefas.dom.on(newTaskBtn, 'click', () => {
                this.showTaskModal();
            });
        }
        
        // Event listener para formulário de tarefa
        const taskForm = SistemaTarefas.dom.$('#taskForm');
        if (taskForm) {
            SistemaTarefas.dom.on(taskForm, 'submit', (e) => {
                e.preventDefault();
                this.handleTaskSubmit(e);
            });
            
            // Validação em tempo real
            SistemaTarefas.validation.setupRealTimeValidation(taskForm, SistemaTarefas.validation.taskForm);
        }
        
        // Event listeners para ações das tarefas (usando delegação)
        SistemaTarefas.dom.delegate(document, '.task-item .btn-edit', 'click', (e) => {
            e.preventDefault();
            const taskId = e.target.getAttribute('data-task-id');
            this.editTask(taskId);
        });
        
        SistemaTarefas.dom.delegate(document, '.task-item .btn-delete', 'click', (e) => {
            e.preventDefault();
            const taskId = e.target.getAttribute('data-task-id');
            this.deleteTask(taskId);
        });
        
        SistemaTarefas.dom.delegate(document, '.task-item .btn-complete', 'click', (e) => {
            e.preventDefault();
            const taskId = e.target.getAttribute('data-task-id');
            this.toggleTaskComplete(taskId);
        });
        
        SistemaTarefas.dom.delegate(document, '.task-item .status-select', 'change', (e) => {
            const taskId = e.target.getAttribute('data-task-id');
            const newStatus = e.target.value;
            this.updateTaskStatus(taskId, newStatus);
        });
        
        // Event listener para fechar modal
        const closeModalBtns = SistemaTarefas.dom.$$('.modal .btn-close, .modal .close');
        closeModalBtns.forEach(btn => {
            SistemaTarefas.dom.on(btn, 'click', () => {
                this.hideTaskModal();
            });
        });
        
        // Event listeners para filtros
        const filterElements = SistemaTarefas.dom.$$('#statusFilter, #priorityFilter, #listFilter');
        filterElements.forEach(filter => {
            SistemaTarefas.dom.on(filter, 'change', () => {
                this.updateFilters();
            });
        });
        
        // Event listener para busca
        const searchInput = SistemaTarefas.dom.$('#searchTasks');
        if (searchInput) {
            SistemaTarefas.dom.on(searchInput, 'input', SistemaTarefas.utils.debounce(() => {
                this.updateFilters();
            }, 300));
        }
        
        // Event listener para limpar filtros
        const clearFiltersBtn = SistemaTarefas.dom.$('.btn-clear-filters, #clearFiltersBtn');
        if (clearFiltersBtn) {
            SistemaTarefas.dom.on(clearFiltersBtn, 'click', () => {
                this.clearFilters();
            });
        }
        
        // Event listener para atualizar
        const refreshBtn = SistemaTarefas.dom.$('.btn-refresh, #refreshBtn');
        if (refreshBtn) {
            SistemaTarefas.dom.on(refreshBtn, 'click', () => {
                this.loadTasks();
                SistemaTarefas.notification.info('Tarefas atualizadas');
            });
        }
    },
    
    /**
     * Carrega listas nos selects
     */
    loadListsInSelects: function() {
        const lists = SistemaTarefas.storage.getLists();
        const selects = SistemaTarefas.dom.$$('#taskList, #listFilter');
        
        selects.forEach(select => {
            if (!select) return;
            
            // Limpa opções existentes (exceto "Todos" no filtro)
            if (select.id === 'listFilter') {
                select.innerHTML = '<option value=\"all\">Todas as listas</option>';
            } else {
                select.innerHTML = '';
            }
            
            // Adiciona opções das listas
            lists.forEach(list => {
                const option = SistemaTarefas.dom.createElement('option', {
                    value: list.id
                }, SistemaTarefas.utils.sanitizeText(list.name));
                select.appendChild(option);
            });
        });
    },
    
    /**
     * Carrega e exibe todas as tarefas
     */
    loadTasks: function() {
        try {
            const tasks = SistemaTarefas.storage.getTasks();
            const filteredTasks = this.filterTasks(tasks);
            
            const container = SistemaTarefas.dom.$('.tasks-container, #tasksContainer');
            if (!container) return;
            
            if (filteredTasks.length === 0) {
                const hasFilters = this.hasActiveFilters();
                container.innerHTML = `
                    <div class="empty-state text-center py-5">
                        <div class="mb-3">
                            <i class="fas fa-tasks fa-3x text-muted"></i>
                        </div>
                        <h5 class="text-muted">
                            ${hasFilters ? 'Nenhuma tarefa encontrada com os filtros aplicados' : 'Nenhuma tarefa encontrada'}
                        </h5>
                        <p class="text-muted">
                            ${hasFilters ? 'Tente ajustar os filtros ou limpar a busca' : 'Crie sua primeira tarefa para começar a organizar suas atividades'}
                        </p>
                        ${hasFilters ? `
                            <button class="btn btn-secondary btn-clear-filters me-2">
                                <i class="fas fa-filter"></i> Limpar filtros
                            </button>
                        ` : ''}
                        <button class="btn btn-primary btn-new-task">
                            <i class="fas fa-plus"></i> ${hasFilters ? 'Nova tarefa' : 'Criar primeira tarefa'}
                        </button>
                    </div>
                `;
                return;
            }
            
            // Agrupa tarefas por status para melhor organização
            const tasksByStatus = this.groupTasksByStatus(filteredTasks);
            
            let html = '';
            
            // Renderiza tarefas por status
            Object.keys(tasksByStatus).forEach(status => {
                const statusTasks = tasksByStatus[status];
                if (statusTasks.length === 0) return;
                
                const statusLabel = this.getStatusLabel(status);
                const statusClass = this.getStatusClass(status);
                
                html += `
                    <div class="status-group mb-4">
                        <h6 class="status-group-title ${statusClass}">
                            <i class="fas fa-circle me-2"></i>
                            ${statusLabel} (${statusTasks.length})
                        </h6>
                        <div class="tasks-list">
                `;
                
                statusTasks.forEach(task => {
                    html += this.renderTaskItem(task);
                });
                
                html += `
                        </div>
                    </div>
                `;
            });
            
            container.innerHTML = html;
            
            // Atualiza contador
            this.updateTasksCounter(filteredTasks.length, tasks.length);
            
        } catch (error) {
            console.error('Erro ao carregar tarefas:', error);
            SistemaTarefas.notification.error('Erro ao carregar tarefas');
        }
    },
    
    /**
     * Renderiza um item de tarefa
     * @param {Object} task - Dados da tarefa
     * @returns {string} HTML do item
     */
    renderTaskItem: function(task) {
        const list = SistemaTarefas.storage.getListById(task.listId);
        const listName = list ? list.name : 'Lista não encontrada';
        
        const statusClass = this.getStatusClass(task.status);
        const priorityClass = this.getPriorityClass(task.priority);
        
        const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && 
                         task.status !== SistemaTarefas.config.TASK_STATUS.CONCLUIDA;
        
        return `
            <div class="task-item card mb-3 ${isOverdue ? 'border-danger' : ''}" data-task-id="${task.id}">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="task-content flex-grow-1">
                            <div class="d-flex align-items-center mb-2">
                                <h6 class="task-title mb-0 ${task.status === SistemaTarefas.config.TASK_STATUS.CONCLUIDA ? 'text-decoration-line-through text-muted' : ''}">
                                    ${SistemaTarefas.utils.sanitizeText(task.title)}
                                    ${isOverdue ? '<i class="fas fa-exclamation-triangle text-danger ms-2" title="Tarefa em atraso"></i>' : ''}
                                </h6>
                            </div>
                            
                            ${task.description ? `
                                <p class="task-description text-muted mb-2">
                                    ${SistemaTarefas.utils.sanitizeText(task.description)}
                                </p>
                            ` : ''}
                            
                            <div class="task-badges mb-2">
                                <span class="badge ${statusClass} me-1">${this.getStatusLabel(task.status)}</span>
                                <span class="badge ${priorityClass} me-1">${this.getPriorityLabel(task.priority)}</span>
                                <span class="badge badge-light">${SistemaTarefas.utils.sanitizeText(listName)}</span>
                            </div>
                            
                            <div class="task-meta">
                                <small class="text-muted">
                                    <i class="fas fa-calendar"></i> 
                                    Criada: ${SistemaTarefas.utils.formatDate(task.createdAt)}
                                    ${task.dueDate ? `
                                        <span class="ms-3 ${isOverdue ? 'text-danger' : ''}">
                                            <i class="fas fa-clock"></i> 
                                            Vence: ${SistemaTarefas.utils.formatDate(task.dueDate)}
                                        </span>
                                    ` : ''}
                                </small>
                            </div>
                        </div>
                        
                        <div class="task-actions">
                            <div class="d-flex flex-column align-items-end">
                                <div class="btn-group mb-2" role="group">
                                    <button class="btn btn-sm btn-outline-success btn-complete" 
                                            data-task-id="${task.id}" 
                                            title="${task.status === SistemaTarefas.config.TASK_STATUS.CONCLUIDA ? 'Marcar como pendente' : 'Marcar como concluída'}">
                                        <i class="fas fa-check"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-primary btn-edit" 
                                            data-task-id="${task.id}" 
                                            title="Editar tarefa">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-danger btn-delete" 
                                            data-task-id="${task.id}" 
                                            title="Excluir tarefa">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                                
                                <select class="form-select form-select-sm status-select" 
                                        data-task-id="${task.id}" 
                                        style="width: auto;">
                                    <option value="${SistemaTarefas.config.TASK_STATUS.PENDENTE}" 
                                            ${task.status === SistemaTarefas.config.TASK_STATUS.PENDENTE ? 'selected' : ''}>
                                        Pendente
                                    </option>
                                    <option value="${SistemaTarefas.config.TASK_STATUS.EM_ANDAMENTO}" 
                                            ${task.status === SistemaTarefas.config.TASK_STATUS.EM_ANDAMENTO ? 'selected' : ''}>
                                        Em Andamento
                                    </option>
                                    <option value="${SistemaTarefas.config.TASK_STATUS.CONCLUIDA}" 
                                            ${task.status === SistemaTarefas.config.TASK_STATUS.CONCLUIDA ? 'selected' : ''}>
                                        Concluída
                                    </option>
                                    <option value="${SistemaTarefas.config.TASK_STATUS.CANCELADA}" 
                                            ${task.status === SistemaTarefas.config.TASK_STATUS.CANCELADA ? 'selected' : ''}>
                                        Cancelada
                                    </option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    /**
     * Agrupa tarefas por status
     * @param {Array} tasks - Array de tarefas
     * @returns {Object} Tarefas agrupadas por status
     */
    groupTasksByStatus: function(tasks) {
        const groups = {
            [SistemaTarefas.config.TASK_STATUS.PENDENTE]: [],
            [SistemaTarefas.config.TASK_STATUS.EM_ANDAMENTO]: [],
            [SistemaTarefas.config.TASK_STATUS.CONCLUIDA]: [],
            [SistemaTarefas.config.TASK_STATUS.CANCELADA]: []
        };
        
        tasks.forEach(task => {
            const status = task.status || SistemaTarefas.config.TASK_STATUS.PENDENTE;
            if (groups[status]) {
                groups[status].push(task);
            }
        });
        
        // Ordena tarefas dentro de cada grupo
        Object.keys(groups).forEach(status => {
            groups[status].sort((a, b) => {
                // Prioridade primeiro
                const priorityOrder = {
                    [SistemaTarefas.config.TASK_PRIORITY.URGENTE]: 4,
                    [SistemaTarefas.config.TASK_PRIORITY.ALTA]: 3,
                    [SistemaTarefas.config.TASK_PRIORITY.MEDIA]: 2,
                    [SistemaTarefas.config.TASK_PRIORITY.BAIXA]: 1
                };
                
                const aPriority = priorityOrder[a.priority] || 1;
                const bPriority = priorityOrder[b.priority] || 1;
                
                if (aPriority !== bPriority) {
                    return bPriority - aPriority;
                }
                
                // Depois por data de vencimento
                if (a.dueDate && b.dueDate) {
                    return new Date(a.dueDate) - new Date(b.dueDate);
                } else if (a.dueDate) {
                    return -1;
                } else if (b.dueDate) {
                    return 1;
                }
                
                // Por último, por data de criação (mais recente primeiro)
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
        });
        
        return groups;
    },
    
    /**
     * Filtra tarefas baseado nos filtros ativos
     * @param {Array} tasks - Array de tarefas
     * @returns {Array} Tarefas filtradas
     */
    filterTasks: function(tasks) {
        return tasks.filter(task => {
            // Filtro por status
            if (this.currentFilters.status !== 'all' && task.status !== this.currentFilters.status) {
                return false;
            }
            
            // Filtro por prioridade
            if (this.currentFilters.priority !== 'all' && task.priority !== this.currentFilters.priority) {
                return false;
            }
            
            // Filtro por lista
            if (this.currentFilters.list !== 'all' && task.listId !== this.currentFilters.list) {
                return false;
            }
            
            // Filtro por busca
            if (this.currentFilters.search) {
                const searchTerm = this.currentFilters.search.toLowerCase();
                const title = task.title.toLowerCase();
                const description = (task.description || '').toLowerCase();
                
                if (!title.includes(searchTerm) && !description.includes(searchTerm)) {
                    return false;
                }
            }
            
            return true;
        });
    },
    
    /**
     * Atualiza filtros baseado nos controles da interface
     */
    updateFilters: function() {
        const statusFilter = SistemaTarefas.dom.$('#statusFilter');
        const priorityFilter = SistemaTarefas.dom.$('#priorityFilter');
        const listFilter = SistemaTarefas.dom.$('#listFilter');
        const searchInput = SistemaTarefas.dom.$('#searchTasks');
        
        this.currentFilters = {
            status: statusFilter ? statusFilter.value : 'all',
            priority: priorityFilter ? priorityFilter.value : 'all',
            list: listFilter ? listFilter.value : 'all',
            search: searchInput ? searchInput.value.trim() : ''
        };
        
        this.loadTasks();
    },
    
    /**
     * Limpa todos os filtros
     */
    clearFilters: function() {
        // Reseta controles de filtro
        const statusFilter = SistemaTarefas.dom.$('#statusFilter');
        const priorityFilter = SistemaTarefas.dom.$('#priorityFilter');
        const listFilter = SistemaTarefas.dom.$('#listFilter');
        const searchInput = SistemaTarefas.dom.$('#searchTasks');
        
        if (statusFilter) statusFilter.value = 'all';
        if (priorityFilter) priorityFilter.value = 'all';
        if (listFilter) listFilter.value = 'all';
        if (searchInput) searchInput.value = '';
        
        // Atualiza filtros
        this.currentFilters = {
            status: 'all',
            priority: 'all',
            list: 'all',
            search: ''
        };
        
        this.loadTasks();
        SistemaTarefas.notification.info('Filtros limpos');
    },
    
    /**
     * Verifica se há filtros ativos
     * @returns {boolean} True se há filtros ativos
     */
    hasActiveFilters: function() {
        return this.currentFilters.status !== 'all' ||
               this.currentFilters.priority !== 'all' ||
               this.currentFilters.list !== 'all' ||
               this.currentFilters.search !== '';
    },
    
    /**
     * Atualiza contador de tarefas
     * @param {number} filtered - Número de tarefas filtradas
     * @param {number} total - Número total de tarefas
     */
    updateTasksCounter: function(filtered, total) {
        const counterElement = SistemaTarefas.dom.$('.tasks-counter, #tasksCounter');
        if (counterElement) {
            const text = filtered === total 
                ? `${total} tarefa(s)`
                : `${filtered} de ${total} tarefa(s)`;
            SistemaTarefas.dom.text(counterElement, text);
        }
    },
    
    /**
     * Mostra modal de tarefa (criar/editar)
     * @param {Object} taskData - Dados da tarefa (opcional, para edição)
     */
    showTaskModal: function(taskData = null) {
        const modal = SistemaTarefas.dom.$('#taskModal, .task-modal');
        if (!modal) {
            // Cria modal dinamicamente se não existir
            this.createTaskModal();
            return this.showTaskModal(taskData);
        }
        
        // Limpa formulário
        const form = SistemaTarefas.dom.$('#taskForm');
        if (form) {
            SistemaTarefas.dom.clearForm(form);
            SistemaTarefas.validation.clearErrors('#taskForm');
        }
        
        // Define título do modal e dados
        const modalTitle = SistemaTarefas.dom.$('.modal-title', modal);
        const submitBtn = SistemaTarefas.dom.$('button[type=\"submit\"]', modal);
        
        if (taskData) {
            // Modo edição
            this.currentEditingId = taskData.id;
            if (modalTitle) SistemaTarefas.dom.text(modalTitle, 'Editar Tarefa');
            if (submitBtn) SistemaTarefas.dom.text(submitBtn, 'Salvar Alterações');
            
            // Preenche formulário
            if (form) {
                const formData = {
                    title: taskData.title,
                    description: taskData.description || '',
                    status: taskData.status || SistemaTarefas.config.TASK_STATUS.PENDENTE,
                    priority: taskData.priority || SistemaTarefas.config.TASK_PRIORITY.MEDIA,
                    listId: taskData.listId || 'default',
                    dueDate: taskData.dueDate ? taskData.dueDate.split('T')[0] : ''
                };
                SistemaTarefas.dom.setFormData(form, formData);
            }
        } else {
            // Modo criação
            this.currentEditingId = null;
            if (modalTitle) SistemaTarefas.dom.text(modalTitle, 'Nova Tarefa');
            if (submitBtn) SistemaTarefas.dom.text(submitBtn, 'Criar Tarefa');
            
            // Define valores padrão
            if (form) {
                const statusSelect = SistemaTarefas.dom.$('select[name=\"status\"]', form);
                const prioritySelect = SistemaTarefas.dom.$('select[name=\"priority\"]', form);
                const listSelect = SistemaTarefas.dom.$('select[name=\"listId\"]', form);
                
                if (statusSelect) statusSelect.value = SistemaTarefas.config.TASK_STATUS.PENDENTE;
                if (prioritySelect) prioritySelect.value = SistemaTarefas.config.TASK_PRIORITY.MEDIA;
                if (listSelect) listSelect.value = 'default';
            }
        }
        
        // Mostra modal
        SistemaTarefas.dom.show(modal);
        modal.style.display = 'flex';
        
        // Foca no campo título
        const titleField = SistemaTarefas.dom.$('#taskTitle, input[name=\"title\"]', modal);
        if (titleField) {
            setTimeout(() => titleField.focus(), 100);
        }
    },
    
    /**
     * Esconde modal de tarefa
     */
    hideTaskModal: function() {
        const modal = SistemaTarefas.dom.$('#taskModal, .task-modal');
        if (modal) {
            SistemaTarefas.dom.hide(modal);
            modal.style.display = 'none';
        }
        this.currentEditingId = null;
    },
    
    /**
     * Cria modal de tarefa dinamicamente
     */
    createTaskModal: function() {
        const modalHtml = `
            <div id="taskModal" class="modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); z-index: 1000; justify-content: center; align-items: center;">
                <div class="modal-dialog" style="background: white; padding: 20px; border-radius: 8px; max-width: 600px; width: 90%; max-height: 90%; overflow-y: auto;">
                    <div class="modal-header" style="border-bottom: 1px solid #dee2e6; padding-bottom: 15px; margin-bottom: 20px;">
                        <h5 class="modal-title">Nova Tarefa</h5>
                        <button type="button" class="btn-close close" style="background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
                    </div>
                    <form id="taskForm">
                        <div class="mb-3">
                            <label for="taskTitle" class="form-label">Título *</label>
                            <input type="text" class="form-control" id="taskTitle" name="title" required maxlength="100">
                        </div>
                        <div class="mb-3">
                            <label for="taskDescription" class="form-label">Descrição</label>
                            <textarea class="form-control" id="taskDescription" name="description" rows="3" maxlength="500"></textarea>
                        </div>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label for="taskStatus" class="form-label">Status</label>
                                <select class="form-select" id="taskStatus" name="status">
                                    <option value="pendente">Pendente</option>
                                    <option value="em_andamento">Em Andamento</option>
                                    <option value="concluida">Concluída</option>
                                    <option value="cancelada">Cancelada</option>
                                </select>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label for="taskPriority" class="form-label">Prioridade</label>
                                <select class="form-select" id="taskPriority" name="priority">
                                    <option value="baixa">Baixa</option>
                                    <option value="media">Média</option>
                                    <option value="alta">Alta</option>
                                    <option value="urgente">Urgente</option>
                                </select>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label for="taskList" class="form-label">Lista</label>
                                <select class="form-select" id="taskList" name="listId">
                                    <!-- Opções carregadas dinamicamente -->
                                </select>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label for="taskDueDate" class="form-label">Data de Vencimento</label>
                                <input type="date" class="form-control" id="taskDueDate" name="dueDate">
                            </div>
                        </div>
                        <div class="modal-footer" style="border-top: 1px solid #dee2e6; padding-top: 15px; margin-top: 20px; text-align: right;">
                            <button type="button" class="btn btn-secondary close" style="margin-right: 10px;">Cancelar</button>
                            <button type="submit" class="btn btn-primary">Criar Tarefa</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Carrega listas no select do modal
        this.loadListsInSelects();
        
        // Reconfigura event listeners para o novo modal
        this.setupEventListeners();
    },
    
    /**
     * Manipula envio do formulário de tarefa
     * @param {Event} event - Evento de submit
     */
    handleTaskSubmit: function(event) {
        const form = event.target;
        const submitBtn = SistemaTarefas.dom.$('button[type=\"submit\"]', form);
        
        // Obtém dados do formulário
        const formData = SistemaTarefas.dom.getFormData(form);
        
        // Valida os dados
        const validation = SistemaTarefas.validation.taskForm(formData);
        
        if (!validation.isValid) {
            SistemaTarefas.validation.displayErrors(validation.errors, '#taskForm');
            return;
        }
        
        // Limpa erros anteriores
        SistemaTarefas.validation.clearErrors('#taskForm');
        
        // Mostra loading no botão
        this.setButtonLoading(submitBtn, true);
        
        // Simula delay
        setTimeout(() => {
            if (this.currentEditingId) {
                this.updateTask(this.currentEditingId, formData, submitBtn);
            } else {
                this.createTask(formData, submitBtn);
            }
        }, 500);
    },
    
    /**
     * Cria uma nova tarefa
     * @param {Object} taskData - Dados da tarefa
     * @param {Element} submitBtn - Botão de submit
     */
    createTask: function(taskData, submitBtn) {
        try {
            const success = SistemaTarefas.storage.addTask(taskData);
            
            if (success) {
                SistemaTarefas.notification.success('Tarefa criada com sucesso!');
                this.hideTaskModal();
                this.loadTasks();
            } else {
                SistemaTarefas.notification.error('Erro ao criar tarefa');
            }
        } catch (error) {
            console.error('Erro ao criar tarefa:', error);
            SistemaTarefas.notification.error('Erro interno ao criar tarefa');
        } finally {
            this.setButtonLoading(submitBtn, false);
        }
    },
    
    /**
     * Atualiza uma tarefa existente
     * @param {string} taskId - ID da tarefa
     * @param {Object} taskData - Dados atualizados
     * @param {Element} submitBtn - Botão de submit
     */
    updateTask: function(taskId, taskData, submitBtn) {
        try {
            const success = SistemaTarefas.storage.updateTask(taskId, taskData);
            
            if (success) {
                SistemaTarefas.notification.success('Tarefa atualizada com sucesso!');
                this.hideTaskModal();
                this.loadTasks();
            } else {
                SistemaTarefas.notification.error('Erro ao atualizar tarefa');
            }
        } catch (error) {
            console.error('Erro ao atualizar tarefa:', error);
            SistemaTarefas.notification.error('Erro interno ao atualizar tarefa');
        } finally {
            this.setButtonLoading(submitBtn, false);
        }
    },
    
    /**
     * Edita uma tarefa
     * @param {string} taskId - ID da tarefa
     */
    editTask: function(taskId) {
        const task = SistemaTarefas.storage.getTaskById(taskId);
        if (!task) {
            SistemaTarefas.notification.error('Tarefa não encontrada');
            return;
        }
        
        this.showTaskModal(task);
    },
    
    /**
     * Exclui uma tarefa
     * @param {string} taskId - ID da tarefa
     */
    deleteTask: function(taskId) {
        const task = SistemaTarefas.storage.getTaskById(taskId);
        if (!task) {
            SistemaTarefas.notification.error('Tarefa não encontrada');
            return;
        }
        
        if (confirm(`Deseja realmente excluir a tarefa "${task.title}"?`)) {
            const success = SistemaTarefas.storage.removeTask(taskId);
            
            if (success) {
                SistemaTarefas.notification.success('Tarefa excluída com sucesso');
                this.loadTasks();
            } else {
                SistemaTarefas.notification.error('Erro ao excluir tarefa');
            }
        }
    },
    
    /**
     * Alterna status de conclusão de uma tarefa
     * @param {string} taskId - ID da tarefa
     */
    toggleTaskComplete: function(taskId) {
        const task = SistemaTarefas.storage.getTaskById(taskId);
        if (!task) return;
        
        const newStatus = task.status === SistemaTarefas.config.TASK_STATUS.CONCLUIDA 
            ? SistemaTarefas.config.TASK_STATUS.PENDENTE 
            : SistemaTarefas.config.TASK_STATUS.CONCLUIDA;
        
        const success = SistemaTarefas.storage.updateTask(taskId, { status: newStatus });
        
        if (success) {
            const statusText = newStatus === SistemaTarefas.config.TASK_STATUS.CONCLUIDA ? 'concluída' : 'pendente';
            SistemaTarefas.notification.success(`Tarefa marcada como ${statusText}`);
            this.loadTasks();
        } else {
            SistemaTarefas.notification.error('Erro ao atualizar tarefa');
        }
    },
    
    /**
     * Atualiza status de uma tarefa
     * @param {string} taskId - ID da tarefa
     * @param {string} newStatus - Novo status
     */
    updateTaskStatus: function(taskId, newStatus) {
        const success = SistemaTarefas.storage.updateTask(taskId, { status: newStatus });
        
        if (success) {
            SistemaTarefas.notification.success('Status da tarefa atualizado');
            this.loadTasks();
        } else {
            SistemaTarefas.notification.error('Erro ao atualizar status da tarefa');
        }
    },
    
    /**
     * Verifica parâmetros da URL
     */
    checkUrlParams: function() {
        const urlParams = new URLSearchParams(window.location.search);
        
        if (urlParams.get('action') === 'new') {
            this.showTaskModal();
        } else if (urlParams.get('edit')) {
            const taskId = urlParams.get('edit');
            this.editTask(taskId);
        } else if (urlParams.get('list')) {
            const listId = urlParams.get('list');
            this.currentFilters.list = listId;
            
            const listFilter = SistemaTarefas.dom.$('#listFilter');
            if (listFilter) {
                listFilter.value = listId;
            }
            
            this.loadTasks();
        }
    },
    
    /**
     * Atualiza informações do usuário
     */
    updateUserInfo: function() {
        const user = SistemaTarefas.auth.getCurrentUser();
        if (!user) return;
        
        // Atualiza nome do usuário
        const userNameElements = SistemaTarefas.dom.$$('.user-name, #userName');
        userNameElements.forEach(element => {
            SistemaTarefas.dom.text(element, user.name);
        });
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
            button.innerHTML = '<span class="loading"></span> Salvando...';
        } else {
            button.disabled = false;
            button.textContent = button.originalText || 'Salvar';
        }
    },
    
    /**
     * Manipula logout
     */
    handleLogout: function() {
        if (confirm('Deseja realmente sair do sistema?')) {
            SistemaTarefas.auth.logout();
        }
    },
    
    // MÉTODOS AUXILIARES PARA CLASSES CSS E LABELS
    
    getStatusClass: function(status) {
        const classes = {
            [SistemaTarefas.config.TASK_STATUS.PENDENTE]: 'text-secondary',
            [SistemaTarefas.config.TASK_STATUS.EM_ANDAMENTO]: 'text-warning',
            [SistemaTarefas.config.TASK_STATUS.CONCLUIDA]: 'text-success',
            [SistemaTarefas.config.TASK_STATUS.CANCELADA]: 'text-danger'
        };
        return classes[status] || 'text-secondary';
    },
    
    getPriorityClass: function(priority) {
        const classes = {
            [SistemaTarefas.config.TASK_PRIORITY.BAIXA]: 'badge-light',
            [SistemaTarefas.config.TASK_PRIORITY.MEDIA]: 'badge-info',
            [SistemaTarefas.config.TASK_PRIORITY.ALTA]: 'badge-warning',
            [SistemaTarefas.config.TASK_PRIORITY.URGENTE]: 'badge-danger'
        };
        return classes[priority] || 'badge-light';
    },
    
    getStatusLabel: function(status) {
        const labels = {
            [SistemaTarefas.config.TASK_STATUS.PENDENTE]: 'Pendente',
            [SistemaTarefas.config.TASK_STATUS.EM_ANDAMENTO]: 'Em Andamento',
            [SistemaTarefas.config.TASK_STATUS.CONCLUIDA]: 'Concluída',
            [SistemaTarefas.config.TASK_STATUS.CANCELADA]: 'Cancelada'
        };
        return labels[status] || status;
    },
    
    getPriorityLabel: function(priority) {
        const labels = {
            [SistemaTarefas.config.TASK_PRIORITY.BAIXA]: 'Baixa',
            [SistemaTarefas.config.TASK_PRIORITY.MEDIA]: 'Média',
            [SistemaTarefas.config.TASK_PRIORITY.ALTA]: 'Alta',
            [SistemaTarefas.config.TASK_PRIORITY.URGENTE]: 'Urgente'
        };
        return labels[priority] || priority;
    }
};

// Inicializa a página quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    // Verifica se estamos na página de tarefas
    if (document.body.classList.contains('tarefas-page') || 
        document.title.toLowerCase().includes('tarefas') ||
        window.location.pathname.includes('tarefas.html')) {
        
        SistemaTarefas.TarefasPage.init();
    }
});

