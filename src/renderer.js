// Check if electronAPI is available
if (!window.electronAPI) {
    console.error('Electron API not available');
}

class NoteTaker {
    constructor() {
        this.notes = [];
        this.currentNote = null;
        this.isModified = false;
        this.autoSaveTimer = null;
        
        this.initializeElements();
        this.bindEvents();
        this.loadNotes();
        this.setupAutoSave();
        this.setupMenuHandlers();
        this.initializeTheme();
    }

    initializeElements() {
        // Sidebar elements
        this.newNoteBtn = document.getElementById('newNoteBtn');
        this.searchInput = document.getElementById('searchInput');
        this.notesList = document.getElementById('notesList');
        
        // Editor elements
        this.noteTitle = document.getElementById('noteTitle');
        this.noteContent = document.getElementById('noteContent');
        this.saveBtn = document.getElementById('saveNoteBtn');
        this.exportBtn = document.getElementById('exportNoteBtn');
        this.deleteBtn = document.getElementById('deleteNoteBtn');
        
        // Stats elements
        this.wordCount = document.getElementById('wordCount');
        this.charCount = document.getElementById('charCount');
        this.lastSaved = document.getElementById('lastSaved');
        
        // Welcome elements
        this.welcomeMessage = document.getElementById('welcomeMessage');

        // Theme elements
        this.themeToggleBtn = document.getElementById('themeToggleBtn');
        this.iconMoon = document.getElementById('iconMoon');
        this.iconSun = document.getElementById('iconSun');
        this.toggleSlider = document.querySelector('.toggle-slider');
    }

    bindEvents() {
        // Button events
        this.newNoteBtn.addEventListener('click', () => this.createNewNote());
        this.saveBtn.addEventListener('click', () => this.saveCurrentNote());
        this.exportBtn.addEventListener('click', () => this.exportCurrentNote());
        this.deleteBtn.addEventListener('click', () => this.deleteCurrentNote());
        this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());
        
        // Search functionality
        this.searchInput.addEventListener('input', (e) => this.filterNotes(e.target.value));
        
        // Editor events
        this.noteTitle.addEventListener('input', () => this.onContentChange());
        this.noteContent.addEventListener('input', () => this.onContentChange());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    setupMenuHandlers() {
        if (window.electronAPI) {
            window.electronAPI.onMenuNewNote(() => this.createNewNote());
            window.electronAPI.onMenuSaveNote(() => this.saveCurrentNote());
            window.electronAPI.onMenuExportNote(() => this.exportCurrentNote());
            window.electronAPI.onImportNote((event, data) => this.importNote(data));
            // Listen for theme updates broadcast from main process (e.g., via menu)
            window.electronAPI.onThemeUpdated((theme) => this.applyTheme(theme));
        }
    }

    handleKeyboardShortcuts(e) {
        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case 'n':
                    e.preventDefault();
                    this.createNewNote();
                    break;
                case 's':
                    e.preventDefault();
                    this.saveCurrentNote();
                    break;
                case 'e':
                    e.preventDefault();
                    this.exportCurrentNote();
                    break;
                case 't':
                    e.preventDefault();
                    this.toggleTheme();
                    break;
            }
        }
    }

    // Theme initialization: ask main for stored theme and apply it
    async initializeTheme() {
        try {
            if (window.electronAPI) {
                const theme = await window.electronAPI.getTheme();
                this.applyTheme(theme);
            } else {
                // Default to dark in pure browser environment
                this.applyTheme('dark');
            }
        } catch (err) {
            console.error('Failed to initialize theme', err);
        }
    }

    // Apply theme by toggling a class on <body> and switching the icon
    applyTheme(theme) {
        // Add transitioning class for smooth animation
        document.body.classList.add('theme-transitioning');
        
        // Apply theme class
        document.body.classList.toggle('theme-light', theme === 'light');

        // Pulse animation on the toggle button - the slider will move automatically via CSS
        if (this.themeToggleBtn) {
            this.themeToggleBtn.classList.add('pulse');
            setTimeout(() => {
                this.themeToggleBtn.classList.remove('pulse');
            }, 600);
        }

        // Remove transitioning class after animation completes
        setTimeout(() => {
            document.body.classList.remove('theme-transitioning');
        }, 400);

        // Ensure the editor (textarea + header/stats) reflects the theme even if external CSS is missing
        // We inject a small <style> block with theme-specific rules targeting editor elements only.
        this.updateEditorThemeStyles(theme);
    }

    // Toggle theme: ask main to toggle and then apply the returned theme
    async toggleTheme() {
        try {
            if (window.electronAPI) {
                const next = await window.electronAPI.toggleTheme();
                this.applyTheme(next);
            } else {
                // Fallback: toggle body class
                const isLight = document.body.classList.contains('theme-light');
                this.applyTheme(isLight ? 'dark' : 'light');
            }
        } catch (err) {
            console.error('Failed to toggle theme', err);
        }
    }

    // Create or update dynamic CSS so the editor adopts the theme colors
    updateEditorThemeStyles(theme) {
        const DARK = {
            bodyBg: '#121212', text: '#e5e5e5',
            mainBg: '#1e1e1e', headerBg: '#1a1a1a', divider: '#2a2a2a',
            placeholder: '#9aa0a6'
        };
        const LIGHT = {
            bodyBg: '#f5f5f5', text: '#1e1e1e',
            mainBg: '#ffffff', headerBg: '#f7f7f7', divider: '#dddddd',
            placeholder: '#777777'
        };
        const p = theme === 'light' ? LIGHT : DARK;

        const css = `
            /* Editor theme (injected) */
            body { background-color: ${p.bodyBg}; color: ${p.text}; }
            .main-content { background-color: ${p.mainBg}; color: ${p.text}; }
            #noteContent { background-color: ${p.mainBg}; color: ${p.text}; caret-color: ${p.text}; }
            #noteContent::placeholder { color: ${p.placeholder}; }
            .editor-header, .editor-stats { background-color: ${p.headerBg}; border-color: ${p.divider}; }
            .editor-header { border-bottom: 1px solid ${p.divider}; }
            .editor-stats { border-top: 1px solid ${p.divider}; }
        `;

        if (!this._themeStyleEl) {
            this._themeStyleEl = document.createElement('style');
            this._themeStyleEl.setAttribute('id', 'dynamic-editor-theme');
            document.head.appendChild(this._themeStyleEl);
        }
        this._themeStyleEl.textContent = css;
    }

    async loadNotes() {
        try {
            if (window.electronAPI) {
                this.notes = await window.electronAPI.getNotes();
            } else {
                // Fallback for development
                this.notes = JSON.parse(localStorage.getItem('notes') || '[]');
            }
            this.renderNotesList();
            this.updateWelcomeVisibility();
        } catch (error) {
            console.error('Error loading notes:', error);
        }
    }

    renderNotesList() {
        this.notesList.innerHTML = '';
        
        this.notes.forEach(note => {
            const noteElement = this.createNoteListItem(note);
            this.notesList.appendChild(noteElement);
        });
    }

    createNoteListItem(note) {
        const noteElement = document.createElement('div');
        noteElement.className = 'note-item';
        noteElement.dataset.noteId = note.id;
        
        const title = note.title || 'Untitled Note';
        const preview = note.content.substring(0, 100) || 'No content';
        const date = new Date(note.updatedAt).toLocaleDateString();
        
        noteElement.innerHTML = `
            <h3>${this.escapeHtml(title)}</h3>
            <p>${this.escapeHtml(preview)}</p>
            <span class="note-date">${date}</span>
        `;
        
        noteElement.addEventListener('click', () => this.selectNote(note));
        
        return noteElement;
    }

    selectNote(note) {
        // Save current note if modified
        if (this.isModified && this.currentNote) {
            this.saveCurrentNote();
        }
        
        this.currentNote = note;
        this.noteTitle.value = note.title || '';
        this.noteContent.value = note.content || '';
        this.isModified = false;
        
        // Update active state
        document.querySelectorAll('.note-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeItem = document.querySelector(`[data-note-id="${note.id}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
        
        this.updateStats();
        this.updateWelcomeVisibility();
    }

    createNewNote() {
        // Save current note if modified
        if (this.isModified && this.currentNote) {
            this.saveCurrentNote();
        }
        
        const newNote = {
            id: this.generateId(),
            title: '',
            content: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.notes.unshift(newNote);
        this.renderNotesList();
        this.selectNote(newNote);
        this.noteTitle.focus();
    }

    async saveCurrentNote() {
        if (!this.currentNote) return;
        
        this.currentNote.title = this.noteTitle.value || 'Untitled Note';
        this.currentNote.content = this.noteContent.value;
        this.currentNote.updatedAt = new Date().toISOString();
        
        try {
            if (window.electronAPI) {
                await window.electronAPI.saveNote(this.currentNote);
            } else {
                // Fallback for development
                localStorage.setItem('notes', JSON.stringify(this.notes));
            }
            
            this.isModified = false;
            this.renderNotesList();
            this.selectNote(this.currentNote); // Refresh active state
            this.updateLastSaved();
            
            // Visual feedback
            this.showSaveIndicator();
        } catch (error) {
            console.error('Error saving note:', error);
        }
    }

    async deleteCurrentNote() {
        if (!this.currentNote) return;
        
        if (confirm('Are you sure you want to delete this note?')) {
            try {
                if (window.electronAPI) {
                    this.notes = await window.electronAPI.deleteNote(this.currentNote.id);
                } else {
                    // Fallback for development
                    this.notes = this.notes.filter(n => n.id !== this.currentNote.id);
                    localStorage.setItem('notes', JSON.stringify(this.notes));
                }
                
                this.currentNote = null;
                this.noteTitle.value = '';
                this.noteContent.value = '';
                this.isModified = false;
                
                this.renderNotesList();
                this.updateWelcomeVisibility();
                this.updateStats();
            } catch (error) {
                console.error('Error deleting note:', error);
            }
        }
    }

    async exportCurrentNote() {
        if (!this.currentNote) return;
        
        try {
            if (window.electronAPI) {
                const result = await window.electronAPI.exportNote(this.currentNote);
                if (result.success) {
                    console.log('Note exported successfully to:', result.path);
                }
            } else {
                // Fallback: download as text file
                this.downloadAsFile(this.currentNote.content, 
                    (this.currentNote.title || 'Untitled') + '.txt');
            }
        } catch (error) {
            console.error('Error exporting note:', error);
        }
    }

    importNote(data) {
        const newNote = {
            id: this.generateId(),
            title: data.fileName.replace(/\.[^/.]+$/, ""), // Remove extension
            content: data.content,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.notes.unshift(newNote);
        this.renderNotesList();
        this.selectNote(newNote);
        this.saveCurrentNote();
    }

    downloadAsFile(content, filename) {
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
        element.setAttribute('download', filename);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }

    filterNotes(searchTerm) {
        const filteredNotes = this.notes.filter(note => 
            note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            note.content.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        this.notesList.innerHTML = '';
        filteredNotes.forEach(note => {
            const noteElement = this.createNoteListItem(note);
            this.notesList.appendChild(noteElement);
        });
    }

    onContentChange() {
        this.isModified = true;
        this.updateStats();
        
        // Reset auto-save timer
        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
        }
        
        this.autoSaveTimer = setTimeout(() => {
            if (this.isModified && this.currentNote) {
                this.saveCurrentNote();
            }
        }, 3000); // Auto-save after 3 seconds of inaction
    }

    setupAutoSave() {
        // Auto-save every 30 seconds if modified
        setInterval(() => {
            if (this.isModified && this.currentNote) {
                this.saveCurrentNote();
            }
        }, 30000);
    }

    updateStats() {
        const content = this.noteContent.value;
        const words = content.trim() ? content.trim().split(/\s+/).length : 0;
        const chars = content.length;
        
        this.wordCount.textContent = `${words} word${words !== 1 ? 's' : ''}`;
        this.charCount.textContent = `${chars} character${chars !== 1 ? 's' : ''}`;
    }

    updateLastSaved() {
        const now = new Date();
        this.lastSaved.textContent = `Saved at ${now.toLocaleTimeString()}`;
    }

    showSaveIndicator() {
        const originalText = this.saveBtn.innerHTML;
        this.saveBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20,6 9,17 4,12"></polyline>
            </svg>
        `;
        this.saveBtn.style.color = '#4CAF50';
        
        setTimeout(() => {
            this.saveBtn.innerHTML = originalText;
            this.saveBtn.style.color = '#2196F3';
        }, 1000);
    }

    updateWelcomeVisibility() {
        if (this.notes.length === 0) {
            this.welcomeMessage.classList.remove('hidden');
        } else {
            this.welcomeMessage.classList.add('hidden');
        }
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new NoteTaker();
});

// Add platform-specific styling
if (navigator.platform.indexOf('Mac') === 0) {
    document.body.classList.add('platform-darwin');
}