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

SistemaTarefas.TarefasPage = {
    initialized: false,
    currentTaskId: null,
    currentFilter: 'todas',
    currentSearch: '',
    
    init: function() {
        if (this.initialized) return;
        
        SistemaTarefas.auth.requireAuth();
        this.updateUserInfo();
        this.loadLists();
        this.loadTasks();
        this.setupEventListeners();
        
        this.initialized = true;
    },
    
    updateUserInfo: function() {
        const user = SistemaTarefas.auth.getCurrentUser();
        if (user) {
            const userNameEl = SistemaTarefas.dom.$('.user-name');
            if (userNameEl) userNameEl.textContent = user.name;
        }
    },
    
    loadLists: function() {
        const lists = SistemaTarefas.storage.getLists();
        const select = SistemaTarefas.dom.$('#listaTarefa');
        if (select) {
            select.innerHTML = lists.map(list => 
                `<option value="${list.id}">${SistemaTarefas.utils.sanitizeText(list.name)}</option>`
            ).join('');
        }
    },
    
    loadTasks: function() {
        let tasks = SistemaTarefas.storage.getTasks();
        
        // Aplica filtros
        if (this.currentFilter !== 'todas') {
            tasks = tasks.filter(task => task.status === this.currentFilter);
        }
        
        // Aplica busca
        if (this.currentSearch) {
            const search = this.currentSearch.toLowerCase();
            tasks = tasks.filter(task => 
                task.title.toLowerCase().includes(search) ||
                (task.description && task.description.toLowerCase().includes(search))
            );
        }
        
        const container = SistemaTarefas.dom.$('#tasksContainer');
        if (!container) return;
        
        if (tasks.length === 0) {
            container.innerHTML = '<div class="alert alert-info">Nenhuma tarefa encontrada.</div>';
            return;
        }
        
        container.innerHTML = tasks.map(task => this.renderTaskCard(task)).join('');
    },
    
    renderTaskCard: function(task) {
        const list = SistemaTarefas.storage.getListById(task.listId);
        const listName = list ? list.name : 'Lista não encontrada';
        
        return `
            <div class="col-md-6 col-lg-4 mb-3">
                <div class="card border-start border-4 border-${this.getStatusColor(task.status)}">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h5 class="card-title mb-0">${SistemaTarefas.utils.sanitizeText(task.title)}</h5>
                            <span class="badge bg-${this.getPriorityColor(task.priority)}">${this.getPriorityLabel(task.priority)}</span>
                        </div>
                        <p class="card-text text-muted small">${SistemaTarefas.utils.sanitizeText(task.description || 'Sem descrição')}</p>
                        <div class="mb-2">
                            <small class="text-muted">
                                <i class="bi bi-folder"></i> ${SistemaTarefas.utils.sanitizeText(listName)}
                            </small>
                            ${task.dueDate ? `
                            <br><small class="text-muted">
                                <i class="bi bi-calendar"></i> ${SistemaTarefas.utils.formatDate(task.dueDate)}
                            </small>
                            ` : ''}
                        </div>
                        <div class="d-flex gap-1">
                            <button class="btn btn-sm btn-outline-primary flex-fill" onclick="SistemaTarefas.TarefasPage.editTask('${task.id}')">
                                <i class="bi bi-pencil"></i> Editar
                            </button>
                            <button class="btn btn-sm btn-outline-success" onclick="SistemaTarefas.TarefasPage.toggleTaskStatus('${task.id}')">
                                <i class="bi bi-check"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="SistemaTarefas.TarefasPage.deleteTask('${task.id}')">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    setupEventListeners: function() {
        const btnNovaTarefa = SistemaTarefas.dom.$('#btnNovaTarefa');
        if (btnNovaTarefa) {
            SistemaTarefas.dom.on(btnNovaTarefa, 'click', () => this.showCreateModal());
        }
        
        const btnSalvarTarefa = SistemaTarefas.dom.$('#btnSalvarTarefa');
        if (btnSalvarTarefa) {
            SistemaTarefas.dom.on(btnSalvarTarefa, 'click', () => this.handleSaveTarefa());
        }
        
        // Filtros
        const filterButtons = SistemaTarefas.dom.$$('.filter-btn');
        filterButtons.forEach(btn => {
            SistemaTarefas.dom.on(btn, 'click', (e) => {
                filterButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.getAttribute('data-filter');
                this.loadTasks();
            });
        });
        
        // Busca com debounce
        const searchInput = SistemaTarefas.dom.$('#searchTasks');
        if (searchInput) {
            const debouncedSearch = SistemaTarefas.utils.debounce((value) => {
                this.currentSearch = value;
                this.loadTasks();
            }, 300);
            
            SistemaTarefas.dom.on(searchInput, 'input', (e) => {
                debouncedSearch(e.target.value);
            });
        }
    },
    
    showCreateModal: function() {
        this.currentTaskId = null;
        const form = SistemaTarefas.dom.$('#formTarefa');
        if (form) {
            SistemaTarefas.dom.clearForm(form);
            SistemaTarefas.dom.$('#modalTarefaTitle').textContent = 'Nova Tarefa';
        }
        
        // Define data mínima
        const dateInput = SistemaTarefas.dom.$('#dataVencimento');
        if (dateInput) {
            const today = new Date().toISOString().split('T')[0];
            dateInput.setAttribute('min', today);
        }
        
        const modal = new bootstrap.Modal(SistemaTarefas.dom.$('#modalTarefa'));
        modal.show();
    },
    
    editTask: function(taskId) {
        this.currentTaskId = taskId;
        const task = SistemaTarefas.storage.getTaskById(taskId);
        if (!task) return;
        
        SistemaTarefas.dom.$('#tituloTarefa').value = task.title;
        SistemaTarefas.dom.$('#descricaoTarefa').value = task.description || '';
        SistemaTarefas.dom.$('#prioridadeTarefa').value = task.priority;
        SistemaTarefas.dom.$('#statusTarefa').value = task.status;
        SistemaTarefas.dom.$('#listaTarefa').value = task.listId;
        SistemaTarefas.dom.$('#dataVencimento').value = task.dueDate || '';
        SistemaTarefas.dom.$('#modalTarefaTitle').textContent = 'Editar Tarefa';
        
        const modal = new bootstrap.Modal(SistemaTarefas.dom.$('#modalTarefa'));
        modal.show();
    },
    
    handleSaveTarefa: function() {
        const data = {
            title: SistemaTarefas.dom.$('#tituloTarefa')?.value,
            description: SistemaTarefas.dom.$('#descricaoTarefa')?.value,
            priority: SistemaTarefas.dom.$('#prioridadeTarefa')?.value,
            status: SistemaTarefas.dom.$('#statusTarefa')?.value,
            listId: SistemaTarefas.dom.$('#listaTarefa')?.value,
            dueDate: SistemaTarefas.dom.$('#dataVencimento')?.value
        };
        
        const validation = SistemaTarefas.validation.taskForm(data);
        if (!validation.isValid) {
            SistemaTarefas.validation.displayErrors(validation.errors, '#formTarefa');
            return;
        }
        
        let success = false;
        if (this.currentTaskId) {
            success = SistemaTarefas.storage.updateTask(this.currentTaskId, data);
            if (success) SistemaTarefas.notification.success('Tarefa atualizada com sucesso!');
        } else {
            const newTask = SistemaTarefas.storage.addTask(data);
            success = !!newTask;
            if (success) SistemaTarefas.notification.success('Tarefa criada com sucesso!');
        }
        
        if (success) {
            const modal = bootstrap.Modal.getInstance(SistemaTarefas.dom.$('#modalTarefa'));
            if (modal) modal.hide();
            this.loadTasks();
        }
    },
    
    toggleTaskStatus: function(taskId) {
        const task = SistemaTarefas.storage.getTaskById(taskId);
        if (!task) return;
        
        const newStatus = task.status === SistemaTarefas.config.TASK_STATUS.CONCLUIDA 
            ? SistemaTarefas.config.TASK_STATUS.PENDENTE 
            : SistemaTarefas.config.TASK_STATUS.CONCLUIDA;
        
        if (SistemaTarefas.storage.updateTask(taskId, { status: newStatus })) {
            SistemaTarefas.notification.success('Status atualizado!');
            this.loadTasks();
        }
    },
    
    deleteTask: function(taskId) {
        if (!confirm('Deseja realmente excluir esta tarefa?')) return;
        
        if (SistemaTarefas.storage.removeTask(taskId)) {
            SistemaTarefas.notification.success('Tarefa excluída com sucesso!');
            this.loadTasks();
        }
    },
    
    getStatusColor: function(status) {
        const colors = { pendente: 'warning', em_andamento: 'info', concluida: 'success', cancelada: 'danger' };
        return colors[status] || 'secondary';
    },
    
    getPriorityColor: function(priority) {
        const colors = { baixa: 'secondary', media: 'info', alta: 'warning', urgente: 'danger' };
        return colors[priority] || 'secondary';
    },
    
    getPriorityLabel: function(priority) {
        return SistemaTarefas.config.LABELS.PRIORITY[priority] || priority;
    }
};

document.addEventListener('DOMContentLoaded', function() {
    const isTarefasPage = document.body.classList.contains('tarefas-page') || 
                          window.location.pathname.includes('tarefas.html');
    
    if (isTarefasPage) {
        SistemaTarefas.TarefasPage.init();
    }
});

