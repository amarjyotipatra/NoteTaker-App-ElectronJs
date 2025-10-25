const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Note operations
  getNotes: () => ipcRenderer.invoke('get-notes'),
  saveNote: (note) => ipcRenderer.invoke('save-note', note),
  deleteNote: (noteId) => ipcRenderer.invoke('delete-note', noteId),
  exportNote: (note) => ipcRenderer.invoke('export-note', note),

  // Menu events
  onMenuNewNote: (callback) => ipcRenderer.on('menu-new-note', callback),
  onMenuSaveNote: (callback) => ipcRenderer.on('menu-save-note', callback),
  onMenuExportNote: (callback) => ipcRenderer.on('menu-export-note', callback),
  onImportNote: (callback) => ipcRenderer.on('import-note', callback),

  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),

  // Theme APIs
  getTheme: () => ipcRenderer.invoke('get-theme'),
  setTheme: (theme) => ipcRenderer.invoke('set-theme', theme),
  toggleTheme: () => ipcRenderer.invoke('toggle-theme'),
  onThemeUpdated: (callback) => ipcRenderer.on('theme-updated', (event, theme) => callback(theme))
});