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

// Namespace para a página home
SistemaTarefas.HomePage = {
    /**
     * Inicializa a página home
     */
    init: function() {
        console.log('Página home inicializada');
        
        // Verifica autenticação
        SistemaTarefas.auth.requireAuth();
        
        // Configura event listeners
        this.setupEventListeners();
        
        // Carrega dados do dashboard
        this.loadDashboardData();
        
        // Atualiza informações do usuário
        this.updateUserInfo();
        
        // Configura atualização automática
        this.setupAutoRefresh();
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
            '.nav-listas, .btn-listas': SistemaTarefas.config.PAGES.LISTAS,
            '.nav-tarefas, .btn-tarefas': SistemaTarefas.config.PAGES.TAREFAS,
            '.nav-home, .btn-home': SistemaTarefas.config.PAGES.HOME
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
        
        // Event listener para ações rápidas
        const quickActionBtns = SistemaTarefas.dom.$$('.quick-action');
        quickActionBtns.forEach(btn => {
            SistemaTarefas.dom.on(btn, 'click', (e) => {
                this.handleQuickAction(e);
            });
        });

        // Event listeners para modais Bootstrap
        const btnSalvarTarefa = document.getElementById('btnSalvarTarefa');
        const btnSalvarLista = document.getElementById('btnSalvarLista');

        if (btnSalvarTarefa) {
            btnSalvarTarefa.addEventListener('click', () => this.criarNovaTarefa());
        }

        if (btnSalvarLista) {
            btnSalvarLista.addEventListener('click', () => this.criarNovaLista());
        }

        // Cards clicáveis (estatísticas)
        const clickableCards = document.querySelectorAll('.clickable-card');
        clickableCards.forEach(card => {
            card.addEventListener('click', () => {
                const page = card.dataset.page;
                if (page) {
                    window.location.href = page;
                }
            });
        });
        
        // Event listener para marcar tarefa como concluída
        SistemaTarefas.dom.delegate(document, '.task-item .btn-complete', 'click', (e) => {
            e.preventDefault();
            const taskId = e.target.getAttribute('data-task-id');
            this.toggleTaskComplete(taskId);
        });
        
        // Event listener para editar tarefa
        SistemaTarefas.dom.delegate(document, '.task-item .btn-edit', 'click', (e) => {
            e.preventDefault();
            const taskId = e.target.getAttribute('data-task-id');
            this.editTask(taskId);
        });
        
        // Event listener para atualizar dados
        const refreshBtn = SistemaTarefas.dom.$('.btn-refresh, #refreshBtn');
        if (refreshBtn) {
            SistemaTarefas.dom.on(refreshBtn, 'click', () => {
                this.refreshDashboard();
            });
        }
    },
    
    /**
     * Carrega dados do dashboard
     */
    loadDashboardData: function() {
        try {
            // Carrega estatísticas
            this.loadStatistics();
            
            // Carrega tarefas recentes
            this.loadRecentTasks();
            
            // Carrega resumo de listas
            this.loadListsSummary();
            
            // Atualiza última atualização
            this.updateLastRefresh();
            
        } catch (error) {
            console.error('Erro ao carregar dados do dashboard:', error);
            SistemaTarefas.notification.error('Erro ao carregar dados do dashboard');
        }
    },
    
    /**
     * Carrega estatísticas das tarefas
     */
    loadStatistics: function() {
        const stats = SistemaTarefas.storage.getTaskStats();
        
        // Atualiza cards de estatísticas
        this.updateStatCard('.stat-total', stats.total, 'Total de Tarefas');
        this.updateStatCard('.stat-pendentes', stats.pendentes, 'Pendentes');
        this.updateStatCard('.stat-andamento', stats.emAndamento, 'Em Andamento');
        this.updateStatCard('.stat-concluidas', stats.concluidas, 'Concluídas');
        
        // Atualiza gráfico de progresso (se existir)
        this.updateProgressChart(stats);
        
        // Atualiza estatísticas por prioridade
        this.updatePriorityStats(stats.porPrioridade);
    },
    
    /**
     * Atualiza um card de estatística
     * @param {string} selector - Seletor do card
     * @param {number} value - Valor a ser exibido
     * @param {string} label - Label do card
     */
    updateStatCard: function(selector, value, label) {
        const card = SistemaTarefas.dom.$(selector);
        if (!card) return;
        
        // Atualiza número
        const numberEl = SistemaTarefas.dom.$('.stat-number, .card-stat-num', card);
        if (numberEl) {
            // Animação de contagem
            this.animateNumber(numberEl, value);
        }
        
        // Atualiza label
        const labelEl = SistemaTarefas.dom.$('.stat-label, .card-stat-label', card);
        if (labelEl) {
            SistemaTarefas.dom.text(labelEl, label);
        }
    },
    
    /**
     * Anima um número (efeito de contagem)
     * @param {Element} element - Elemento do número
     * @param {number} targetValue - Valor final
     */
    animateNumber: function(element, targetValue) {
        const currentValue = parseInt(SistemaTarefas.dom.text(element)) || 0;
        const increment = targetValue > currentValue ? 1 : -1;
        const duration = 1000; // 1 segundo
        const steps = Math.abs(targetValue - currentValue);
        const stepTime = steps > 0 ? duration / steps : 0;
        
        let current = currentValue;
        
        const timer = setInterval(() => {
            current += increment;
            SistemaTarefas.dom.text(element, current.toString());
            
            if (current === targetValue) {
                clearInterval(timer);
            }
        }, stepTime);
    },
    
    /**
     * Atualiza gráfico de progresso
     * @param {Object} stats - Estatísticas das tarefas
     */
    updateProgressChart: function(stats) {
        const progressContainer = SistemaTarefas.dom.$('.progress-chart, .progress-container');
        if (!progressContainer) return;
        
        const total = stats.total;
        if (total === 0) {
            progressContainer.innerHTML = '<p class="text-muted">Nenhuma tarefa encontrada</p>';
            return;
        }
        
        const percentConcluidas = Math.round((stats.concluidas / total) * 100);
        const percentAndamento = Math.round((stats.emAndamento / total) * 100);
        const percentPendentes = Math.round((stats.pendentes / total) * 100);
        
        progressContainer.innerHTML = `
            <div class="progress-item">
                <div class="progress-info">
                    <span>Concluídas</span>
                    <span>${percentConcluidas}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill bg-success" style="width: ${percentConcluidas}%"></div>
                </div>
            </div>
            <div class="progress-item">
                <div class="progress-info">
                    <span>Em Andamento</span>
                    <span>${percentAndamento}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill bg-warning" style="width: ${percentAndamento}%"></div>
                </div>
            </div>
            <div class="progress-item">
                <div class="progress-info">
                    <span>Pendentes</span>
                    <span>${percentPendentes}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill bg-secondary" style="width: ${percentPendentes}%"></div>
                </div>
            </div>
        `;
    },
    
    /**
     * Atualiza estatísticas por prioridade
     * @param {Object} priorityStats - Estatísticas por prioridade
     */
    updatePriorityStats: function(priorityStats) {
        const priorityContainer = SistemaTarefas.dom.$('.priority-stats');
        if (!priorityContainer) return;
        
        const priorityLabels = {
            urgente: 'Urgente',
            alta: 'Alta',
            media: 'Média',
            baixa: 'Baixa'
        };
        
        const priorityClasses = {
            urgente: 'text-danger',
            alta: 'text-warning',
            media: 'text-info',
            baixa: 'text-secondary'
        };
        
        let html = '';
        Object.keys(priorityStats).forEach(priority => {
            const count = priorityStats[priority];
            const label = priorityLabels[priority] || priority;
            const className = priorityClasses[priority] || 'text-secondary';
            
            html += `
                <div class="priority-item">
                    <span class="${className}">${label}:</span>
                    <strong>${count}</strong>
                </div>
            `;
        });
        
        priorityContainer.innerHTML = html;
    },
    
    /**
     * Carrega tarefas recentes
     */
    loadRecentTasks: function() {
        const tasks = SistemaTarefas.storage.getTasks();
        const recentTasks = tasks
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
            .slice(0, 5); // Últimas 5 tarefas
        
        const container = SistemaTarefas.dom.$('.recent-tasks, #recentTasks');
        if (!container) return;
        
        if (recentTasks.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p class="text-muted">Nenhuma tarefa encontrada</p>
                    <button class="btn btn-primary btn-sm" onclick="window.location.href='${SistemaTarefas.config.PAGES.TAREFAS}'">
                        Criar primeira tarefa
                    </button>
                </div>
            `;
            return;
        }
        
        let html = '';
        recentTasks.forEach(task => {
            const statusClass = this.getStatusClass(task.status);
            const priorityClass = this.getPriorityClass(task.priority);
            
            html += `
                <div class="task-item" data-task-id="${task.id}">
                    <div class="task-content">
                        <div class="task-header">
                            <h6 class="task-title">${SistemaTarefas.utils.sanitizeText(task.title)}</h6>
                            <div class="task-badges">
                                <span class="badge ${statusClass}">${this.getStatusLabel(task.status)}</span>
                                <span class="badge ${priorityClass}">${this.getPriorityLabel(task.priority)}</span>
                            </div>
                        </div>
                        ${task.description ? `<p class="task-description">${SistemaTarefas.utils.sanitizeText(task.description)}</p>` : ''}
                        <div class="task-meta">
                            <small class="text-muted">
                                Atualizada: ${SistemaTarefas.utils.formatDateTime(task.updatedAt)}
                            </small>
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="btn btn-sm btn-outline-success btn-complete" data-task-id="${task.id}" title="Marcar como concluída">
                            ✓
                        </button>
                        <button class="btn btn-sm btn-outline-primary btn-edit" data-task-id="${task.id}" title="Editar">
                            ✏️
                        </button>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    },
    
    /**
     * Carrega resumo das listas
     */
    loadListsSummary: function() {
        const lists = SistemaTarefas.storage.getLists();
        const stats = SistemaTarefas.storage.getTaskStats();
        
        const container = SistemaTarefas.dom.$('.lists-summary, #listsSummary');
        if (!container) return;
        
        let html = `<h6>Suas Listas (${lists.length})</h6>`;
        
        lists.forEach(list => {
            const taskCount = stats.porLista[list.id] || 0;
            html += `
                <div class="list-item" data-list-id="${list.id}">
                    <div class="list-info">
                        <strong>${SistemaTarefas.utils.sanitizeText(list.name)}</strong>
                        <span class="text-muted">${taskCount} tarefa(s)</span>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
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
        
        // Atualiza email do usuário
        const userEmailElements = SistemaTarefas.dom.$$('.user-email, #userEmail');
        userEmailElements.forEach(element => {
            SistemaTarefas.dom.text(element, user.email);
        });
        
        // Atualiza saudação baseada no horário
        this.updateGreeting(user.name);
    },
    
    /**
     * Atualiza saudação baseada no horário
     * @param {string} userName - Nome do usuário
     */
    updateGreeting: function(userName) {
        const greetingElement = SistemaTarefas.dom.$('.greeting, #greeting');
        if (!greetingElement) return;
        
        const hour = new Date().getHours();
        let greeting;
        
        if (hour < 12) {
            greeting = 'Bom dia';
        } else if (hour < 18) {
            greeting = 'Boa tarde';
        } else {
            greeting = 'Boa noite';
        }
        
        SistemaTarefas.dom.text(greetingElement, `${greeting}, ${userName}!`);
    },
    
    /**
     * Atualiza timestamp da última atualização
     */
    updateLastRefresh: function() {
        const lastRefreshElement = SistemaTarefas.dom.$('.last-refresh, #lastRefresh');
        if (lastRefreshElement) {
            const now = new Date().toLocaleTimeString('pt-BR');
            SistemaTarefas.dom.text(lastRefreshElement, `Última atualização: ${now}`);
        }
    },
    
    /**
     * Configura atualização automática
     */
    setupAutoRefresh: function() {
        // Atualiza a cada 5 minutos
        setInterval(() => {
            this.refreshDashboard();
        }, 5 * 60 * 1000);
    },
    
    /**
     * Atualiza o dashboard
     */
    refreshDashboard: function() {
        console.log('Atualizando dashboard...');
        this.loadDashboardData();
        SistemaTarefas.notification.info('Dashboard atualizado');
    },
    
    /**
     * Manipula ações rápidas
     * @param {Event} event - Evento de clique
     */
    handleQuickAction: function(event) {
        const action = event.target.getAttribute('data-action');
        
        switch (action) {
            case 'new-task':
                window.location.href = SistemaTarefas.config.PAGES.TAREFAS + '?action=new';
                break;
            case 'new-list':
                window.location.href = SistemaTarefas.config.PAGES.LISTAS + '?action=new';
                break;
            case 'view-all-tasks':
                window.location.href = SistemaTarefas.config.PAGES.TAREFAS;
                break;
            case 'view-all-lists':
                window.location.href = SistemaTarefas.config.PAGES.LISTAS;
                break;
            default:
                console.warn('Ação rápida não reconhecida:', action);
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
            this.loadDashboardData();
        } else {
            SistemaTarefas.notification.error('Erro ao atualizar tarefa');
        }
    },
    
    /**
     * Edita uma tarefa
     * @param {string} taskId - ID da tarefa
     */
    editTask: function(taskId) {
        window.location.href = `${SistemaTarefas.config.PAGES.TAREFAS}?edit=${taskId}`;
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
            [SistemaTarefas.config.TASK_STATUS.PENDENTE]: 'badge-secondary',
            [SistemaTarefas.config.TASK_STATUS.EM_ANDAMENTO]: 'badge-warning',
            [SistemaTarefas.config.TASK_STATUS.CONCLUIDA]: 'badge-success',
            [SistemaTarefas.config.TASK_STATUS.CANCELADA]: 'badge-danger'
        };
        return classes[status] || 'badge-secondary';
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
    // Verifica se estamos na página home
    if (document.body.classList.contains('home-page') || 
        document.title.toLowerCase().includes('home') ||
        document.title.toLowerCase().includes('dashboard') ||
        window.location.pathname.includes('home.html')) {
        
        SistemaTarefas.HomePage.init();
    }
});



    /**
     * Criar nova tarefa via modal
     */
    criarNovaTarefa: function() {
        const form = document.getElementById('formNovaTarefa');
        if (!form) return;

        // Validar formulário
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        // Coletar dados
        const titulo = document.getElementById('tituloTarefa').value.trim();
        const descricao = document.getElementById('descricaoTarefa').value.trim();
        const prioridade = document.getElementById('prioridadeTarefa').value;
        const listaId = document.getElementById('listaTarefa').value;
        const dataVencimento = document.getElementById('dataVencimento').value;

        if (!titulo) {
            SistemaTarefas.notification.warning('Por favor, informe o título da tarefa.');
            return;
        }

        // Criar tarefa
        const novaTarefa = {
            id: Date.now().toString(),
            title: titulo,
            description: descricao,
            priority: prioridade,
            listId: listaId,
            status: 'pendente',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            dueDate: dataVencimento || null,
            completed: false
        };

        // Salvar
        SistemaTarefas.storage.addTask(novaTarefa);
        
        // Fechar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalNovaTarefa'));
        if (modal) modal.hide();

        // Limpar formulário
        form.reset();

        // Atualizar página
        this.loadDashboardData();

        // Notificação
        SistemaTarefas.notification.success('Tarefa criada com sucesso!');
    },

    /**
     * Criar nova lista via modal
     */
    criarNovaLista: function() {
        const form = document.getElementById('formNovaLista');
        if (!form) return;

        // Validar formulário
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        // Coletar dados
        const nome = document.getElementById('nomeLista').value.trim();
        const descricao = document.getElementById('descricaoLista').value.trim();

        if (!nome) {
            SistemaTarefas.notification.warning('Por favor, informe o nome da lista.');
            return;
        }

        // Criar lista
        const novaLista = {
            id: Date.now().toString(),
            name: nome,
            description: descricao,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Salvar
        SistemaTarefas.storage.addList(novaLista);
        
        // Fechar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalNovaLista'));
        if (modal) modal.hide();

        // Limpar formulário
        form.reset();

        // Atualizar página
        this.loadDashboardData();

        // Notificação
        SistemaTarefas.notification.success('Lista criada com sucesso!');
    },

