const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const Store = require('electron-store');

// Initialize electron-store for persistent data
const store = new Store();

let mainWindow;

// Persisted theme preference ("dark" | "light"), default to dark
// We keep theme in electron-store so it survives app restarts
function getStoredTheme() {
  return store.get('theme', 'dark');
}

function setStoredTheme(theme) {
  store.set('theme', theme);
  // Inform renderer processes to update their UI
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send('theme-updated', theme);
  }
}

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets', 'icon.png'), // Add your icon here
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    show: false
  });

  // Load the app
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Open DevTools in development
    if (process.argv.includes('--development')) {
      mainWindow.webContents.openDevTools();
    }

    // Send initial theme to renderer once UI is ready
    setImmediate(() => {
      mainWindow.webContents.send('theme-updated', getStoredTheme());
    });
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Create application menu
  createMenu();
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Note',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-new-note');
          }
        },
        {
          label: 'Save Note',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.send('menu-save-note');
          }
        },
        { type: 'separator' },
        {
          label: 'Import Note',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openFile'],
              filters: [
                { name: 'Text Files', extensions: ['txt', 'md'] },
                { name: 'All Files', extensions: ['*'] }
              ]
            });

            if (!result.canceled && result.filePaths.length > 0) {
              try {
                const content = await fs.readFile(result.filePaths[0], 'utf8');
                const fileName = path.basename(result.filePaths[0]);
                mainWindow.webContents.send('import-note', { content, fileName });
              } catch (error) {
                console.error('Error importing file:', error);
              }
            }
          }
        },
        {
          label: 'Export Note',
          accelerator: 'CmdOrCtrl+E',
          click: () => {
            mainWindow.webContents.send('menu-export-note');
          }
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectall' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    // Theme menu to switch between Dark and Light modes
    {
      label: 'Theme',
      submenu: [
        {
          label: 'Toggle Dark/Light',
          accelerator: 'CmdOrCtrl+T',
          click: () => {
            const next = getStoredTheme() === 'dark' ? 'light' : 'dark';
            setStoredTheme(next);
          }
        },
        { type: 'separator' },
        {
          label: 'Dark',
          type: 'radio',
          checked: getStoredTheme() === 'dark',
          click: () => setStoredTheme('dark')
        },
        {
          label: 'Light',
          type: 'radio',
          checked: getStoredTheme() === 'light',
          click: () => setStoredTheme('light')
        }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    }
  ];

  // macOS specific menu adjustments
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    });

    // Window menu
    template[5].submenu = [
      { role: 'close' },
      { role: 'minimize' },
      { role: 'zoom' },
      { type: 'separator' },
      { role: 'front' }
    ];
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC handlers for note operations
ipcMain.handle('get-notes', () => {
  return store.get('notes', []);
});

ipcMain.handle('save-note', (event, note) => {
  const notes = store.get('notes', []);
  const existingIndex = notes.findIndex(n => n.id === note.id);
  
  if (existingIndex >= 0) {
    notes[existingIndex] = note;
  } else {
    notes.push(note);
  }
  
  store.set('notes', notes);
  return note;
});

ipcMain.handle('delete-note', (event, noteId) => {
  const notes = store.get('notes', []);
  const filteredNotes = notes.filter(n => n.id !== noteId);
  store.set('notes', filteredNotes);
  return filteredNotes;
});

ipcMain.handle('export-note', async (event, note) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: `${note.title || 'Untitled'}.txt`,
    filters: [
      { name: 'Text Files', extensions: ['txt'] },
      { name: 'Markdown Files', extensions: ['md'] }
    ]
  });

  if (!result.canceled) {
    try {
      await fs.writeFile(result.filePath, note.content);
      return { success: true, path: result.filePath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  return { success: false, cancelled: true };
});

// IPC handlers for theme operations
// Renderer asks for the current theme
ipcMain.handle('get-theme', () => getStoredTheme());

// Renderer explicitly sets a theme
ipcMain.handle('set-theme', (event, theme) => {
  if (theme === 'dark' || theme === 'light') {
    setStoredTheme(theme);
    return { success: true, theme };
  }
  return { success: false, error: 'Invalid theme' };
});

// Renderer can request a toggle
ipcMain.handle('toggle-theme', () => {
  const next = getStoredTheme() === 'dark' ? 'light' : 'dark';
  setStoredTheme(next);
  return next;
});

// App event handlers
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
  });
});