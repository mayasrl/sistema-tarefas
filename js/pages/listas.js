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

SistemaTarefas.ListasPage = {
    initialized: false,
    currentListId: null,
    
    init: function() {
        if (this.initialized) return;
        
        SistemaTarefas.auth.requireAuth();
        this.updateUserInfo();
        this.loadLists();
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
        const container = SistemaTarefas.dom.$('#listsContainer');
        if (!container) return;
        
        if (lists.length === 0) {
            container.innerHTML = '<div class="alert alert-info">Nenhuma lista cadastrada. Crie sua primeira lista!</div>';
            return;
        }
        
        container.innerHTML = lists.map(list => {
            const taskCount = this.getTaskCountForList(list.id);
            return `
                <div class="col-md-4 mb-3">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">${SistemaTarefas.utils.sanitizeText(list.name)}</h5>
                            <p class="card-text text-muted">${SistemaTarefas.utils.sanitizeText(list.description || 'Sem descrição')}</p>
                            <p class="text-muted"><small>${taskCount} tarefa(s)</small></p>
                            <div class="btn-group w-100">
                                <button class="btn btn-sm btn-primary" onclick="SistemaTarefas.ListasPage.editList('${list.id}')">
                                    <i class="bi bi-pencil"></i> Editar
                                </button>
                                ${!list.isDefault ? `
                                <button class="btn btn-sm btn-danger" onclick="SistemaTarefas.ListasPage.deleteList('${list.id}')">
                                    <i class="bi bi-trash"></i> Excluir
                                </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },
    
    getTaskCountForList: function(listId) {
        return SistemaTarefas.storage.getTasks().filter(task => task.listId === listId).length;
    },
    
    setupEventListeners: function() {
        const btnNovaLista = SistemaTarefas.dom.$('#btnNovaLista');
        if (btnNovaLista) {
            SistemaTarefas.dom.on(btnNovaLista, 'click', () => this.showCreateModal());
        }
        
        const btnSalvarLista = SistemaTarefas.dom.$('#btnSalvarLista');
        if (btnSalvarLista) {
            SistemaTarefas.dom.on(btnSalvarLista, 'click', () => this.handleSaveLista());
        }
    },
    
    showCreateModal: function() {
        this.currentListId = null;
        const form = SistemaTarefas.dom.$('#formLista');
        if (form) {
            SistemaTarefas.dom.clearForm(form);
            SistemaTarefas.dom.$('#modalListaTitle').textContent = 'Nova Lista';
        }
        
        const modal = new bootstrap.Modal(SistemaTarefas.dom.$('#modalLista'));
        modal.show();
    },
    
    editList: function(listId) {
        this.currentListId = listId;
        const list = SistemaTarefas.storage.getListById(listId);
        if (!list) return;
        
        SistemaTarefas.dom.$('#nomeLista').value = list.name;
        SistemaTarefas.dom.$('#descricaoLista').value = list.description || '';
        SistemaTarefas.dom.$('#modalListaTitle').textContent = 'Editar Lista';
        
        const modal = new bootstrap.Modal(SistemaTarefas.dom.$('#modalLista'));
        modal.show();
    },
    
    handleSaveLista: function() {
        const data = {
            name: SistemaTarefas.dom.$('#nomeLista')?.value,
            description: SistemaTarefas.dom.$('#descricaoLista')?.value
        };
        
        const validation = SistemaTarefas.validation.listForm(data);
        if (!validation.isValid) {
            SistemaTarefas.validation.displayErrors(validation.errors, '#formLista');
            return;
        }
        
        let success = false;
        if (this.currentListId) {
            success = SistemaTarefas.storage.updateList(this.currentListId, data);
            if (success) SistemaTarefas.notification.success('Lista atualizada com sucesso!');
        } else {
            const newList = SistemaTarefas.storage.addList(data);
            success = !!newList;
            if (success) SistemaTarefas.notification.success('Lista criada com sucesso!');
        }
        
        if (success) {
            const modal = bootstrap.Modal.getInstance(SistemaTarefas.dom.$('#modalLista'));
            if (modal) modal.hide();
            this.loadLists();
        }
    },
    
    deleteList: function(listId) {
        if (!confirm('Deseja realmente excluir esta lista? As tarefas serão movidas para a lista padrão.')) {
            return;
        }
        
        if (SistemaTarefas.storage.removeList(listId)) {
            SistemaTarefas.notification.success('Lista excluída com sucesso!');
            this.loadLists();
        }
    }
};

document.addEventListener('DOMContentLoaded', function() {
    const isListasPage = document.body.classList.contains('listas-page') || 
                         window.location.pathname.includes('listas.html');
    
    if (isListasPage) {
        SistemaTarefas.ListasPage.init();
    }
});

