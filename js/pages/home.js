/**
 * PÁGINA HOME - DASHBOARD (home.html)
 * 
 * Este arquivo contém toda a lógica da página principal do sistema (dashboard).
 * Funcionalidades implementadas:
 * - Exibição de estatísticas das tarefas
 * - Lista de tarefas recentes
 * - Ações rápidas
 * - Navegação para outras páginas
 * - Informações do usuário
 * 
 * Deve ser carregado apenas na página home.html
 */
SistemaTarefas.HomePage = {
    initialized: false,
    
    init: function() {
        if (this.initialized) return;
        
        SistemaTarefas.auth.requireAuth();
        this.updateUserInfo();
        this.loadStatistics();
        this.loadRecentTasks();
        this.loadListsSummary();
        this.setupEventListeners();
        
        this.initialized = true;
    },
    
    updateUserInfo: function() {
        const user = SistemaTarefas.auth.getCurrentUser();
        if (!user) return;
        
        const userNameEl = SistemaTarefas.dom.$('.user-name');
        if (userNameEl) userNameEl.textContent = user.name;
        
        const greetingEl = SistemaTarefas.dom.$('.greeting');
        if (greetingEl) {
            const hour = new Date().getHours();
            let greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
            greetingEl.textContent = `${greeting}, ${user.name}!`;
        }
    },
    
    loadStatistics: function() {
        const stats = SistemaTarefas.storage.getTaskStats();
        this.updateStatCard('.stat-number', stats.total);
        this.updateStatCard('.stat-pendentes', stats.pendentes);
        this.updateStatCard('.stat-concluidas', stats.concluidas);
        this.updateStatCard('.stat-urgentes', stats.porPrioridade.urgente || 0);
    },
    
    updateStatCard: function(selector, value) {
        const el = SistemaTarefas.dom.$(selector);
        if (el) el.textContent = value;
    },
    
    loadRecentTasks: function() {
        const tasks = SistemaTarefas.storage.getTasks();
        const recentTasks = tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
        
        const container = SistemaTarefas.dom.$('#recentTasks');
        if (!container) return;
        
        if (recentTasks.length === 0) {
            container.innerHTML = '<p class="text-muted text-center py-3">Nenhuma tarefa cadastrada</p>';
            return;
        }
        
        container.innerHTML = recentTasks.map(task => `
            <div class="task-item mb-2 p-2 border-start border-3 border-${this.getStatusColor(task.status)}">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <strong>${SistemaTarefas.utils.sanitizeText(task.title)}</strong>
                        <br><small class="text-muted">${this.getStatusLabel(task.status)}</small>
                    </div>
                    <span class="badge bg-${this.getPriorityColor(task.priority)} ms-2">
                        ${this.getPriorityLabel(task.priority)}
                    </span>
                </div>
            </div>
        `).join('');
    },
    
    loadListsSummary: function() {
        const lists = SistemaTarefas.storage.getLists();
        const container = SistemaTarefas.dom.$('#listsSummary');
        if (!container) return;
        
        if (lists.length === 0) {
            container.innerHTML = '<p class="text-muted text-center py-3">Nenhuma lista cadastrada</p>';
            return;
        }
        
        container.innerHTML = lists.map(list => {
            const taskCount = this.getTaskCountForList(list.id);
            return `
                <div class="list-item mb-2 p-2 border rounded">
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="flex-grow-1">
                            <strong>${SistemaTarefas.utils.sanitizeText(list.name)}</strong>
                            <br><small class="text-muted">${taskCount} tarefa(s)</small>
                        </div>
                        <a href="listas.html" class="btn btn-sm btn-outline-primary">Ver</a>
                    </div>
                </div>
            `;
        }).join('');
    },
    
    getTaskCountForList: function(listId) {
        return SistemaTarefas.storage.getTasks().filter(task => task.listId === listId).length;
    },
    
    setupEventListeners: function() {
        const clickableCards = SistemaTarefas.dom.$$('.clickable-card');
        clickableCards.forEach(card => {
            SistemaTarefas.dom.on(card, 'click', () => {
                const page = card.getAttribute('data-page');
                if (page) window.location.href = page;
            });
        });
        
        const btnSalvarTarefa = SistemaTarefas.dom.$('#btnSalvarTarefa');
        if (btnSalvarTarefa) {
            SistemaTarefas.dom.on(btnSalvarTarefa, 'click', () => this.handleNovaTarefa());
        }
        
        const btnSalvarLista = SistemaTarefas.dom.$('#btnSalvarLista');
        if (btnSalvarLista) {
            SistemaTarefas.dom.on(btnSalvarLista, 'click', () => this.handleNovaLista());
        }
        
        this.loadListsIntoSelect();
    },
    
    loadListsIntoSelect: function() {
        const select = SistemaTarefas.dom.$('#listaTarefa');
        if (!select) return;
        
        const lists = SistemaTarefas.storage.getLists();
        select.innerHTML = lists.map(list => 
            `<option value="${list.id}">${SistemaTarefas.utils.sanitizeText(list.name)}</option>`
        ).join('');
    },
    
    handleNovaTarefa: function() {
        const form = SistemaTarefas.dom.$('#formNovaTarefa');
        if (!form) return;
        
        const data = {
            title: SistemaTarefas.dom.$('#tituloTarefa')?.value,
            description: SistemaTarefas.dom.$('#descricaoTarefa')?.value,
            priority: SistemaTarefas.dom.$('#prioridadeTarefa')?.value,
            listId: SistemaTarefas.dom.$('#listaTarefa')?.value,
            dueDate: SistemaTarefas.dom.$('#dataVencimento')?.value,
            status: SistemaTarefas.config.TASK_STATUS.PENDENTE
        };
        
        const validation = SistemaTarefas.validation.taskForm(data);
        if (!validation.isValid) {
            SistemaTarefas.validation.displayErrors(validation.errors, '#formNovaTarefa');
            return;
        }
        
        const newTask = SistemaTarefas.storage.addTask(data);
        if (newTask) {
            SistemaTarefas.dom.clearForm(form);
            
            const modalEl = SistemaTarefas.dom.$('#modalNovaTarefa');
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) {
                modal.hide();
            }
            
            // Remove backdrop manualmente se necessário
            setTimeout(() => {
                const backdrop = document.querySelector('.modal-backdrop');
                if (backdrop) backdrop.remove();
                document.body.classList.remove('modal-open');
                document.body.style.overflow = '';
                document.body.style.paddingRight = '';
            }, 100);
            
            this.loadStatistics();
            this.loadRecentTasks();
            
            SistemaTarefas.notification.success('Tarefa criada com sucesso!');
        }
    },
    
    handleNovaLista: function() {
        const form = SistemaTarefas.dom.$('#formNovaLista');
        if (!form) return;
        
        const data = {
            name: SistemaTarefas.dom.$('#nomeLista')?.value,
            description: SistemaTarefas.dom.$('#descricaoLista')?.value
        };
        
        const validation = SistemaTarefas.validation.listForm(data);
        if (!validation.isValid) {
            SistemaTarefas.validation.displayErrors(validation.errors, '#formNovaLista');
            return;
        }
        
        const newList = SistemaTarefas.storage.addList(data);
        if (newList) {
            SistemaTarefas.dom.clearForm(form);
            
            const modalEl = SistemaTarefas.dom.$('#modalNovaLista');
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) {
                modal.hide();
            }
            
            // Remove backdrop manualmente se necessário
            setTimeout(() => {
                const backdrop = document.querySelector('.modal-backdrop');
                if (backdrop) backdrop.remove();
                document.body.classList.remove('modal-open');
                document.body.style.overflow = '';
                document.body.style.paddingRight = '';
            }, 100);
            
            this.loadListsSummary();
            this.loadListsIntoSelect();
            
            SistemaTarefas.notification.success('Lista criada com sucesso!');
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
    
    getStatusLabel: function(status) {
        return SistemaTarefas.config.LABELS.STATUS[status] || status;
    },
    
    getPriorityLabel: function(priority) {
        return SistemaTarefas.config.LABELS.PRIORITY[priority] || priority;
    }
};

document.addEventListener('DOMContentLoaded', function() {
    const isHomePage = document.body.classList.contains('home-page') || 
                       window.location.pathname.includes('home.html');
    
    if (isHomePage) {
        SistemaTarefas.HomePage.init();
    }
});

