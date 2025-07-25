/**
 * PeopleSoft-style Change Requests Interface
 * Handles task status management, UI interactions, and Complete button functionality
 */

class ChangeRequestManager {
    constructor() {
        this.tasks = new Map();
        this.selectedTasks = new Set();
        this.isProcessing = false;
        
        this.initializeData();
        this.bindEvents();
        this.loadStoredState();
    }

    /**
     * Initialize task data structure
     */
    initializeData() {
        const taskRows = document.querySelectorAll('.task-row');
        taskRows.forEach(row => {
            const taskId = row.dataset.taskId;
            const status = row.dataset.status;
            this.tasks.set(taskId, {
                id: taskId,
                status: status,
                element: row,
                name: row.querySelector('td:nth-child(4)').textContent.trim(),
                assignedTo: row.querySelector('td:nth-child(5)').textContent.trim(),
                assignedToName: row.querySelector('td:nth-child(6)').textContent.trim()
            });
        });
    }

    /**
     * Bind all event listeners
     */
    bindEvents() {
        // Complete button
        document.getElementById('completeBtn').addEventListener('click', () => this.handleCompleteAction());

        // Other action buttons
        document.getElementById('cancelBtn').addEventListener('click', () => this.handleCancelAction());
        document.getElementById('holdBtn').addEventListener('click', () => this.handleHoldAction());

        // Tab navigation
        document.querySelectorAll('.tab-item').forEach(tab => {
            tab.addEventListener('click', (e) => this.handleTabSwitch(e));
        });

        // Sub-tab navigation
        document.querySelectorAll('.task-sub-tab-item').forEach(subtab => {
            subtab.addEventListener('click', (e) => this.handleSubTabSwitch(e));
        });

        // Select all checkbox
        document.getElementById('selectAll').addEventListener('change', (e) => this.handleSelectAll(e));

        // Individual task checkboxes
        document.querySelectorAll('.task-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => this.handleTaskSelection(e));
        });

        // Task row clicks for selection
        document.querySelectorAll('.task-row').forEach(row => {
            row.addEventListener('click', (e) => this.handleRowClick(e));
        });

        // Action icons
        document.querySelectorAll('.action-icon').forEach(icon => {
            icon.addEventListener('click', (e) => this.handleActionIcon(e));
        });

        // Individual task complete buttons
        document.querySelectorAll('.btn-task-complete').forEach(button => {
            button.addEventListener('click', (e) => this.handleIndividualTaskComplete(e));
        });

        // Inline complete buttons
        document.querySelectorAll('.btn-complete-inline').forEach(button => {
            button.addEventListener('click', (e) => this.handleInlineCompleteButton(e));
        });

        // Page links
        document.getElementById('newWindowLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.openInNewWindow();
        });
        
        document.getElementById('personalizeLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.showPersonalizationOptions();
        });
    }

    /**
     * Handle inline Complete button click (in task name)
     */
    handleInlineCompleteButton(e) {
        e.stopPropagation(); // Prevent row selection
        this.showToast('This task is already completed');
    }

    /**
     * Handle individual task Complete button click
     */
    async handleIndividualTaskComplete(e) {
        e.stopPropagation(); // Prevent row selection
        
        const button = e.currentTarget;
        const taskId = button.dataset.taskId;
        const task = this.tasks.get(taskId);
        
        if (!task || task.status === 'completed') {
            return;
        }

        // Show confirmation
        if (!confirm(`Are you sure you want to complete task "${task.name}"?`)) {
            return;
        }

        // Disable button during processing
        button.disabled = true;
        button.textContent = 'Processing...';

        try {
            await this.completeTask(taskId);
            this.showToast(`Task "${task.name}" completed successfully`);
        } catch (error) {
            console.error('Error completing task:', error);
            this.showToast('Failed to complete task. Please try again.');
            // Re-enable button on error
            button.disabled = false;
            button.textContent = 'Complete';
        } finally {
            this.saveState();
        }
    }

    /**
     * Handle Complete button action (bulk completion)
     */
    async handleCompleteAction() {
        const selectedTasks = this.getSelectedTasks();
        
        if (selectedTasks.length === 0) {
            this.showModal('No Tasks Selected', 'Please select at least one task to complete.');
            return;
        }

        // Filter out already completed tasks
        const incompleteTasks = selectedTasks.filter(task => task.status !== 'completed');
        
        if (incompleteTasks.length === 0) {
            this.showModal('All Selected Tasks Completed', 'All selected tasks are already completed.');
            return;
        }

        // Show confirmation
        const confirmMessage = `Are you sure you want to complete ${incompleteTasks.length} task(s)?`;
        if (!confirm(confirmMessage)) {
            return;
        }

        this.isProcessing = true;
        this.updateButtonStates();

        try {
            // Simulate API call delay
            await this.delay(1000);

            // Complete the tasks
            for (const task of incompleteTasks) {
                await this.completeTask(task.id);
            }

            this.showModal('Tasks Completed', `Successfully completed ${incompleteTasks.length} task(s).`);
            
        } catch (error) {
            console.error('Error completing tasks:', error);
            this.showModal('Error', 'Failed to complete tasks. Please try again.');
        } finally {
            this.isProcessing = false;
            this.updateButtonStates();
            this.saveState();
        }
    }

    /**
     * Complete a specific task
     */
    async completeTask(taskId) {
        const task = this.tasks.get(taskId);
        if (!task || task.status === 'completed') {
            return;
        }

        // Add loading animation
        task.element.classList.add('status-updating');

        // Simulate processing time
        await this.delay(300);

        // Update task status
        task.status = 'completed';
        task.element.dataset.status = 'completed';
        task.element.classList.add('completed');
        task.element.classList.remove('status-updating');

        // Update status icon
        const statusIcon = task.element.querySelector('.task-status-icon');
        statusIcon.className = 'fas fa-check-circle task-status-icon status-green';
        statusIcon.title = 'Completed';

        // Check the checkbox
        const checkbox = task.element.querySelector('.task-checkbox');
        checkbox.checked = true;

        // Replace Complete button with completed text
        const actionCell = task.element.querySelector('td:last-child');
        const completeButton = actionCell.querySelector('.btn-task-complete');
        if (completeButton) {
            actionCell.innerHTML = '<span class="task-completed">Complete</span>';
        }

        // Add highlight effect
        this.highlightCompletedTask(task.element);

        // Update task object
        this.tasks.set(taskId, task);
    }

    /**
     * Add highlight effect to completed task
     */
    highlightCompletedTask(taskElement) {
        taskElement.classList.add('highlighted');
        
        // Remove highlight after animation
        setTimeout(() => {
            taskElement.classList.remove('highlighted');
        }, 3000);
    }

    /**
     * Get currently selected tasks
     */
    getSelectedTasks() {
        const selectedTasks = [];
        document.querySelectorAll('.task-checkbox:checked').forEach(checkbox => {
            const row = checkbox.closest('.task-row');
            const taskId = row.dataset.taskId;
            const task = this.tasks.get(taskId);
            if (task) {
                selectedTasks.push(task);
            }
        });
        return selectedTasks;
    }

    /**
     * Handle task selection
     */
    handleTaskSelection(e) {
        const row = e.target.closest('.task-row');
        const taskId = row.dataset.taskId;
        
        if (e.target.checked) {
            this.selectedTasks.add(taskId);
            row.classList.add('selected');
        } else {
            this.selectedTasks.delete(taskId);
            row.classList.remove('selected');
        }

        this.updateButtonStates();
        this.updateSelectAllState();
    }

    /**
     * Handle select all checkbox
     */
    handleSelectAll(e) {
        const checkboxes = document.querySelectorAll('.task-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = e.target.checked;
            const row = checkbox.closest('.task-row');
            const taskId = row.dataset.taskId;
            
            if (e.target.checked) {
                this.selectedTasks.add(taskId);
                row.classList.add('selected');
            } else {
                this.selectedTasks.delete(taskId);
                row.classList.remove('selected');
            }
        });

        this.updateButtonStates();
    }

    /**
     * Update select all checkbox state
     */
    updateSelectAllState() {
        const allCheckboxes = document.querySelectorAll('.task-checkbox');
        const checkedCheckboxes = document.querySelectorAll('.task-checkbox:checked');
        const selectAllCheckbox = document.getElementById('selectAll');

        if (checkedCheckboxes.length === 0) {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
        } else if (checkedCheckboxes.length === allCheckboxes.length) {
            selectAllCheckbox.checked = true;
            selectAllCheckbox.indeterminate = false;
        } else {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = true;
        }
    }

    /**
     * Update button states based on selection and processing status
     */
    updateButtonStates() {
        const completeBtn = document.getElementById('completeBtn');
        const cancelBtn = document.getElementById('cancelBtn');
        const holdBtn = document.getElementById('holdBtn');
        
        const hasSelection = this.selectedTasks.size > 0;
        
        completeBtn.disabled = this.isProcessing || !hasSelection;
        cancelBtn.disabled = this.isProcessing;
        holdBtn.disabled = this.isProcessing;

        if (this.isProcessing) {
            completeBtn.textContent = 'Processing...';
        } else {
            completeBtn.textContent = 'Complete';
        }
    }

    /**
     * Handle row click for selection
     */
    handleRowClick(e) {
        // Ignore clicks on checkboxes and other interactive elements
        if (e.target.type === 'checkbox' || e.target.tagName === 'BUTTON' || e.target.tagName === 'A' || 
            e.target.classList.contains('btn-task-complete') || e.target.classList.contains('btn-complete-inline')) {
            return;
        }

        const checkbox = e.currentTarget.querySelector('.task-checkbox');
        checkbox.checked = !checkbox.checked;
        
        // Trigger change event
        const changeEvent = new Event('change', { bubbles: true });
        checkbox.dispatchEvent(changeEvent);
    }

    /**
     * Handle tab switching
     */
    handleTabSwitch(e) {
        const clickedTab = e.currentTarget;
        const tabName = clickedTab.dataset.tab;

        // Remove active class from all tabs
        document.querySelectorAll('.tab-item').forEach(tab => {
            tab.classList.remove('active');
        });

        // Add active class to clicked tab
        clickedTab.classList.add('active');

        // Here you would typically load different content based on the tab
        console.log(`Switched to tab: ${tabName}`);
    }

    /**
     * Handle sub-tab switching
     */
    handleSubTabSwitch(e) {
        const clickedSubTab = e.currentTarget;
        const subTabName = clickedSubTab.dataset.subtab;

        // Remove active class from all sub-tabs
        document.querySelectorAll('.task-sub-tab-item').forEach(subtab => {
            subtab.classList.remove('active');
        });

        // Add active class to clicked sub-tab
        clickedSubTab.classList.add('active');

        console.log(`Switched to sub-tab: ${subTabName}`);
    }

    /**
     * Handle other action buttons
     */
    handleCancelAction() {
        if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
            this.showModal('Action Cancelled', 'The operation has been cancelled.');
        }
    }

    handleHoldAction() {
        const selectedTasks = this.getSelectedTasks();
        if (selectedTasks.length === 0) {
            this.showModal('No Tasks Selected', 'Please select at least one task to put on hold.');
            return;
        }
        
        this.showModal('Tasks On Hold', `${selectedTasks.length} task(s) have been put on hold.`);
    }

    /**
     * Handle action icon clicks
     */
    handleActionIcon(e) {
        const icon = e.currentTarget;
        const action = icon.title.toLowerCase();
        
        switch (action) {
            case 'favorite':
                this.toggleFavorite();
                break;
            case 'refresh':
                this.refreshData();
                break;
            case 'link':
                this.copyLink();
                break;
            case 'attach':
                this.showAttachments();
                break;
            case 'list':
                this.showTaskList();
                break;
            case 'print':
                this.printPage();
                break;
            default:
                console.log(`Action: ${action}`);
        }
    }

    /**
     * Action icon handlers
     */
    toggleFavorite() {
        const favoriteIcon = document.querySelector('.action-icon[title="Favorite"]');
        if (favoriteIcon.classList.contains('fas')) {
            favoriteIcon.classList.remove('fas');
            favoriteIcon.classList.add('far');
            this.showToast('Removed from favorites');
        } else {
            favoriteIcon.classList.remove('far');
            favoriteIcon.classList.add('fas');
            this.showToast('Added to favorites');
        }
    }

    refreshData() {
        this.showToast('Refreshing data...');
        // Simulate refresh
        setTimeout(() => {
            this.showToast('Data refreshed');
        }, 1000);
    }

    copyLink() {
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            this.showToast('Link copied to clipboard');
        }).catch(() => {
            this.showToast('Failed to copy link');
        });
    }

    showAttachments() {
        this.showModal('Attachments', 'No attachments found for this change request.');
    }

    showTaskList() {
        const taskCount = this.tasks.size;
        const completedCount = Array.from(this.tasks.values()).filter(task => task.status === 'completed').length;
        this.showModal('Task Summary', `Total Tasks: ${taskCount}\nCompleted: ${completedCount}\nRemaining: ${taskCount - completedCount}`);
    }

    printPage() {
        window.print();
    }

    /**
     * Page action handlers
     */
    openInNewWindow() {
        window.open(window.location.href, '_blank');
    }

    showPersonalizationOptions() {
        this.showModal('Personalization', 'Personalization options are not available in this demo.');
    }

    /**
     * Show modal dialog
     */
    showModal(title, message) {
        const modal = document.getElementById('statusModal');
        const modalTitle = document.getElementById('statusModalLabel');
        const modalMessage = document.getElementById('statusMessage');
        
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
    }

    /**
     * Show toast notification
     */
    showToast(message) {
        // Create toast element if it doesn't exist
        let toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toastContainer';
            toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
            toastContainer.style.zIndex = '9999';
            document.body.appendChild(toastContainer);
        }

        const toastId = 'toast-' + Date.now();
        const toastHTML = `
            <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header">
                    <strong class="me-auto">Notification</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body">
                    ${message}
                </div>
            </div>
        `;

        toastContainer.insertAdjacentHTML('beforeend', toastHTML);
        
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement);
        toast.show();

        // Remove toast element after it's hidden
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    }

    /**
     * Save state to localStorage
     */
    saveState() {
        const state = {
            selectedTasks: Array.from(this.selectedTasks),
            taskStates: Array.from(this.tasks.entries()).map(([id, task]) => ({
                id,
                status: task.status
            }))
        };
        localStorage.setItem('changeRequestState', JSON.stringify(state));
    }

    /**
     * Load state from localStorage
     */
    loadStoredState() {
        try {
            const savedState = localStorage.getItem('changeRequestState');
            if (savedState) {
                const state = JSON.parse(savedState);
                
                // Restore task states
                state.taskStates.forEach(taskState => {
                    const task = this.tasks.get(taskState.id);
                    if (task && taskState.status === 'completed' && task.status !== 'completed') {
                        this.completeTask(taskState.id);
                    }
                });

                // Restore selected tasks
                state.selectedTasks.forEach(taskId => {
                    const checkbox = document.querySelector(`[data-task-id="${taskId}"] .task-checkbox`);
                    if (checkbox) {
                        checkbox.checked = true;
                        this.selectedTasks.add(taskId);
                    }
                });

                this.updateButtonStates();
                this.updateSelectAllState();
            }
        } catch (error) {
            console.error('Error loading saved state:', error);
        }
    }

    /**
     * Utility function for delays
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const changeRequestManager = new ChangeRequestManager();
    
    // Make it globally accessible for debugging
    window.changeRequestManager = changeRequestManager;
    
    console.log('Change Request Manager initialized successfully');
});

// Handle page visibility changes to save state
document.addEventListener('visibilitychange', () => {
    if (document.hidden && window.changeRequestManager) {
        window.changeRequestManager.saveState();
    }
});

// Save state before page unload
window.addEventListener('beforeunload', () => {
    if (window.changeRequestManager) {
        window.changeRequestManager.saveState();
    }
});
