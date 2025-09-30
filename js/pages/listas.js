/**
 * PÁGINA DE LISTAS (listas.html)
 * 
 * Este arquivo contém toda a lógica da página de gerenciamento de listas.
 * Funcionalidades implementadas:
 * - Exibição de todas as listas
 * - Criação de novas listas
 * - Edição de listas existentes
 * - Exclusão de listas
 * - Visualização de tarefas por lista
 * 
 * Deve ser carregado apenas na página listas.html
 */

// Namespace para a página de listas
SistemaTarefas.ListasPage = {
    // Estado atual da página
    currentEditingId: null,
    
    /**
     * Inicializa a página de listas
     */
    init: function() {
        console.log('Página de listas inicializada');
        
        // Verifica autenticação
        SistemaTarefas.auth.requireAuth();
        
        // Configura event listeners
        this.setupEventListeners();
        
        // Carrega listas
        this.loadLists();
        
        // Atualiza informações do usuário
        this.updateUserInfo();
        
        // Verifica se deve abrir modal de nova lista
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
            '.nav-tarefas, .btn-tarefas': SistemaTarefas.config.PAGES.TAREFAS,
            '.nav-listas, .btn-listas': SistemaTarefas.config.PAGES.LISTAS
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
        
        // Event listener para botão de nova lista
        const newListBtn = SistemaTarefas.dom.$('.btn-new-list, #newListBtn');
        if (newListBtn) {
            SistemaTarefas.dom.on(newListBtn, 'click', () => {
                this.showListModal();
            });
        }
        
        // Event listener para formulário de lista
        const listForm = SistemaTarefas.dom.$('#listForm');
        if (listForm) {
            SistemaTarefas.dom.on(listForm, 'submit', (e) => {
                e.preventDefault();
                this.handleListSubmit(e);
            });
            
            // Validação em tempo real
            SistemaTarefas.validation.setupRealTimeValidation(listForm, SistemaTarefas.validation.listForm);
        }
        
        // Event listeners para ações das listas (usando delegação)
        SistemaTarefas.dom.delegate(document, '.list-item .btn-edit', 'click', (e) => {
            e.preventDefault();
            const listId = e.target.getAttribute('data-list-id');
            this.editList(listId);
        });
        
        SistemaTarefas.dom.delegate(document, '.list-item .btn-delete', 'click', (e) => {
            e.preventDefault();
            const listId = e.target.getAttribute('data-list-id');
            this.deleteList(listId);
        });
        
        SistemaTarefas.dom.delegate(document, '.list-item .btn-view', 'click', (e) => {
            e.preventDefault();
            const listId = e.target.getAttribute('data-list-id');
            this.viewListTasks(listId);
        });
        
        // Event listener para fechar modal
        const closeModalBtns = SistemaTarefas.dom.$$('.modal .btn-close, .modal .close');
        closeModalBtns.forEach(btn => {
            SistemaTarefas.dom.on(btn, 'click', () => {
                this.hideListModal();
            });
        });
        
        // Event listener para busca/filtro
        const searchInput = SistemaTarefas.dom.$('#searchLists');
        if (searchInput) {
            SistemaTarefas.dom.on(searchInput, 'input', SistemaTarefas.utils.debounce(() => {
                this.filterLists(searchInput.value);
            }, 300));
        }
        
        // Event listener para atualizar
        const refreshBtn = SistemaTarefas.dom.$('.btn-refresh, #refreshBtn');
        if (refreshBtn) {
            SistemaTarefas.dom.on(refreshBtn, 'click', () => {
                this.loadLists();
                SistemaTarefas.notification.info('Listas atualizadas');
            });
        }
    },
    
    /**
     * Carrega e exibe todas as listas
     */
    loadLists: function() {
        try {
            const lists = SistemaTarefas.storage.getLists();
            const stats = SistemaTarefas.storage.getTaskStats();
            
            const container = SistemaTarefas.dom.$('.lists-container, #listsContainer');
            if (!container) return;
            
            if (lists.length === 0) {
                container.innerHTML = `
                    <div class="empty-state text-center py-5">
                        <div class="mb-3">
                            <i class="fas fa-list-ul fa-3x text-muted"></i>
                        </div>
                        <h5 class="text-muted">Nenhuma lista encontrada</h5>
                        <p class="text-muted">Crie sua primeira lista para organizar suas tarefas</p>
                        <button class="btn btn-primary btn-new-list">
                            <i class="fas fa-plus"></i> Criar primeira lista
                        </button>
                    </div>
                `;
                return;
            }
            
            let html = '';
            lists.forEach(list => {
                const taskCount = stats.porLista[list.id] || 0;
                const isDefault = list.isDefault || false;
                
                html += `
                    <div class="list-item card mb-3" data-list-id="${list.id}">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start">
                                <div class="list-info flex-grow-1">
                                    <div class="d-flex align-items-center mb-2">
                                        <h5 class="card-title mb-0">
                                            ${SistemaTarefas.utils.sanitizeText(list.name)}
                                            ${isDefault ? '<span class="badge badge-primary ms-2">Padrão</span>' : ''}
                                        </h5>
                                    </div>
                                    ${list.description ? `
                                        <p class="card-text text-muted mb-2">
                                            ${SistemaTarefas.utils.sanitizeText(list.description)}
                                        </p>
                                    ` : ''}
                                    <div class="list-stats">
                                        <small class="text-muted">
                                            <i class="fas fa-tasks"></i> ${taskCount} tarefa(s)
                                            <span class="ms-3">
                                                <i class="fas fa-calendar"></i> 
                                                Criada em ${SistemaTarefas.utils.formatDate(list.createdAt)}
                                            </span>
                                        </small>
                                    </div>
                                </div>
                                <div class="list-actions">
                                    <div class="btn-group" role="group">
                                        <button class="btn btn-sm btn-outline-primary btn-view" 
                                                data-list-id="${list.id}" 
                                                title="Ver tarefas">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button class="btn btn-sm btn-outline-secondary btn-edit" 
                                                data-list-id="${list.id}" 
                                                title="Editar lista">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        ${!isDefault ? `
                                            <button class="btn btn-sm btn-outline-danger btn-delete" 
                                                    data-list-id="${list.id}" 
                                                    title="Excluir lista">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        ` : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            container.innerHTML = html;
            
            // Atualiza contador
            this.updateListsCounter(lists.length);
            
        } catch (error) {
            console.error('Erro ao carregar listas:', error);
            SistemaTarefas.notification.error('Erro ao carregar listas');
        }
    },
    
    /**
     * Atualiza contador de listas
     * @param {number} count - Número de listas
     */
    updateListsCounter: function(count) {
        const counterElement = SistemaTarefas.dom.$('.lists-counter, #listsCounter');
        if (counterElement) {
            SistemaTarefas.dom.text(counterElement, `${count} lista(s)`);
        }
    },
    
    /**
     * Mostra modal de lista (criar/editar)
     * @param {Object} listData - Dados da lista (opcional, para edição)
     */
    showListModal: function(listData = null) {
        const modal = SistemaTarefas.dom.$('#listModal, .list-modal');
        if (!modal) {
            // Cria modal dinamicamente se não existir
            this.createListModal();
            return this.showListModal(listData);
        }
        
        // Limpa formulário
        const form = SistemaTarefas.dom.$('#listForm');
        if (form) {
            SistemaTarefas.dom.clearForm(form);
            SistemaTarefas.validation.clearErrors('#listForm');
        }
        
        // Define título do modal e dados
        const modalTitle = SistemaTarefas.dom.$('.modal-title', modal);
        const submitBtn = SistemaTarefas.dom.$('button[type="submit"]', modal);
        
        if (listData) {
            // Modo edição
            this.currentEditingId = listData.id;
            if (modalTitle) SistemaTarefas.dom.text(modalTitle, 'Editar Lista');
            if (submitBtn) SistemaTarefas.dom.text(submitBtn, 'Salvar Alterações');
            
            // Preenche formulário
            if (form) {
                SistemaTarefas.dom.setFormData(form, {
                    name: listData.name,
                    description: listData.description || ''
                });
            }
        } else {
            // Modo criação
            this.currentEditingId = null;
            if (modalTitle) SistemaTarefas.dom.text(modalTitle, 'Nova Lista');
            if (submitBtn) SistemaTarefas.dom.text(submitBtn, 'Criar Lista');
        }
        
        // Mostra modal
        SistemaTarefas.dom.show(modal);
        modal.style.display = 'flex';
        
        // Foca no campo nome
        const nameField = SistemaTarefas.dom.$('#listName, input[name=\"name\"]', modal);
        if (nameField) {
            setTimeout(() => nameField.focus(), 100);
        }
    },
    
    /**
     * Esconde modal de lista
     */
    hideListModal: function() {
        const modal = SistemaTarefas.dom.$('#listModal, .list-modal');
        if (modal) {
            SistemaTarefas.dom.hide(modal);
            modal.style.display = 'none';
        }
        this.currentEditingId = null;
    },
    
    /**
     * Cria modal de lista dinamicamente
     */
    createListModal: function() {
        const modalHtml = `
            <div id="listModal" class="modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); z-index: 1000; justify-content: center; align-items: center;">
                <div class="modal-dialog" style="background: white; padding: 20px; border-radius: 8px; max-width: 500px; width: 90%;">
                    <div class="modal-header" style="border-bottom: 1px solid #dee2e6; padding-bottom: 15px; margin-bottom: 20px;">
                        <h5 class="modal-title">Nova Lista</h5>
                        <button type="button" class="btn-close close" style="background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
                    </div>
                    <form id="listForm">
                        <div class="mb-3">
                            <label for="listName" class="form-label">Nome da Lista *</label>
                            <input type="text" class="form-control" id="listName" name="name" required maxlength="50">
                        </div>
                        <div class="mb-3">
                            <label for="listDescription" class="form-label">Descrição</label>
                            <textarea class="form-control" id="listDescription" name="description" rows="3" maxlength="200"></textarea>
                        </div>
                        <div class="modal-footer" style="border-top: 1px solid #dee2e6; padding-top: 15px; margin-top: 20px; text-align: right;">
                            <button type="button" class="btn btn-secondary close" style="margin-right: 10px;">Cancelar</button>
                            <button type="submit" class="btn btn-primary">Criar Lista</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Reconfigura event listeners para o novo modal
        this.setupEventListeners();
    },
    
    /**
     * Manipula envio do formulário de lista
     * @param {Event} event - Evento de submit
     */
    handleListSubmit: function(event) {
        const form = event.target;
        const submitBtn = SistemaTarefas.dom.$('button[type="submit"]', form);
        
        // Obtém dados do formulário
        const formData = SistemaTarefas.dom.getFormData(form);
        
        // Valida os dados
        const validation = SistemaTarefas.validation.listForm(formData);
        
        if (!validation.isValid) {
            SistemaTarefas.validation.displayErrors(validation.errors, '#listForm');
            return;
        }
        
        // Limpa erros anteriores
        SistemaTarefas.validation.clearErrors('#listForm');
        
        // Mostra loading no botão
        this.setButtonLoading(submitBtn, true);
        
        // Simula delay
        setTimeout(() => {
            if (this.currentEditingId) {
                this.updateList(this.currentEditingId, formData, submitBtn);
            } else {
                this.createList(formData, submitBtn);
            }
        }, 500);
    },
    
    /**
     * Cria uma nova lista
     * @param {Object} listData - Dados da lista
     * @param {Element} submitBtn - Botão de submit
     */
    createList: function(listData, submitBtn) {
        try {
            const success = SistemaTarefas.storage.addList(listData);
            
            if (success) {
                SistemaTarefas.notification.success('Lista criada com sucesso!');
                this.hideListModal();
                this.loadLists();
            } else {
                SistemaTarefas.notification.error('Erro ao criar lista');
            }
        } catch (error) {
            console.error('Erro ao criar lista:', error);
            SistemaTarefas.notification.error('Erro interno ao criar lista');
        } finally {
            this.setButtonLoading(submitBtn, false);
        }
    },
    
    /**
     * Atualiza uma lista existente
     * @param {string} listId - ID da lista
     * @param {Object} listData - Dados atualizados
     * @param {Element} submitBtn - Botão de submit
     */
    updateList: function(listId, listData, submitBtn) {
        try {
            const success = SistemaTarefas.storage.updateList(listId, listData);
            
            if (success) {
                SistemaTarefas.notification.success('Lista atualizada com sucesso!');
                this.hideListModal();
                this.loadLists();
            } else {
                SistemaTarefas.notification.error('Erro ao atualizar lista');
            }
        } catch (error) {
            console.error('Erro ao atualizar lista:', error);
            SistemaTarefas.notification.error('Erro interno ao atualizar lista');
        } finally {
            this.setButtonLoading(submitBtn, false);
        }
    },
    
    /**
     * Edita uma lista
     * @param {string} listId - ID da lista
     */
    editList: function(listId) {
        const list = SistemaTarefas.storage.getListById(listId);
        if (!list) {
            SistemaTarefas.notification.error('Lista não encontrada');
            return;
        }
        
        this.showListModal(list);
    },
    
    /**
     * Exclui uma lista
     * @param {string} listId - ID da lista
     */
    deleteList: function(listId) {
        const list = SistemaTarefas.storage.getListById(listId);
        if (!list) {
            SistemaTarefas.notification.error('Lista não encontrada');
            return;
        }
        
        if (list.isDefault) {
            SistemaTarefas.notification.warning('Não é possível excluir a lista padrão');
            return;
        }
        
        const stats = SistemaTarefas.storage.getTaskStats();
        const taskCount = stats.porLista[listId] || 0;
        
        let confirmMessage = `Deseja realmente excluir a lista "${list.name}"?`;
        if (taskCount > 0) {
            confirmMessage += `\\n\\nEsta lista contém ${taskCount} tarefa(s). Elas serão movidas para a lista padrão.`;
        }
        
        if (confirm(confirmMessage)) {
            const success = SistemaTarefas.storage.removeList(listId);
            
            if (success) {
                SistemaTarefas.notification.success('Lista excluída com sucesso');
                this.loadLists();
            } else {
                SistemaTarefas.notification.error('Erro ao excluir lista');
            }
        }
    },
    
    /**
     * Visualiza tarefas de uma lista
     * @param {string} listId - ID da lista
     */
    viewListTasks: function(listId) {
        window.location.href = `${SistemaTarefas.config.PAGES.TAREFAS}?list=${listId}`;
    },
    
    /**
     * Filtra listas por nome
     * @param {string} searchTerm - Termo de busca
     */
    filterLists: function(searchTerm) {
        const listItems = SistemaTarefas.dom.$$('.list-item');
        const term = searchTerm.toLowerCase().trim();
        
        listItems.forEach(item => {
            const listName = SistemaTarefas.dom.$('.card-title', item);
            const listDescription = SistemaTarefas.dom.$('.card-text', item);
            
            let textContent = '';
            if (listName) textContent += listName.textContent.toLowerCase();
            if (listDescription) textContent += ' ' + listDescription.textContent.toLowerCase();
            
            if (term === '' || textContent.includes(term)) {
                SistemaTarefas.dom.show(item);
            } else {
                SistemaTarefas.dom.hide(item);
            }
        });
        
        // Atualiza contador de listas visíveis
        const visibleLists = SistemaTarefas.dom.$$('.list-item:not([style*=\"display: none\"])');
        this.updateListsCounter(visibleLists.length);
    },
    
    /**
     * Verifica parâmetros da URL
     */
    checkUrlParams: function() {
        const urlParams = new URLSearchParams(window.location.search);
        
        if (urlParams.get('action') === 'new') {
            this.showListModal();
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
    }
};

// Inicializa a página quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    // Verifica se estamos na página de listas
    if (document.body.classList.contains('listas-page') || 
        document.title.toLowerCase().includes('listas') ||
        window.location.pathname.includes('listas.html')) {
        
        SistemaTarefas.ListasPage.init();
    }
});

