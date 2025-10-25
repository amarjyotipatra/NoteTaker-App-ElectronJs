# NoteTaker - Electron Note-Taking App

A modern, feature-rich note-taking application built with Electron.js. Clean interface, powerful features, and persistent storage.

## Features

### Core Functionality
- **Create, Edit, Delete Notes** - Full CRUD operations with auto-save
- **Rich Text Editor** - Clean, distraction-free writing experience
- **Search & Filter** - Find notes quickly by title or content
- **Import/Export** - Support for `.txt` and `.md` files
- **Persistent Storage** - Notes saved automatically with electron-store

### User Experience
- **Modern UI** - Clean, responsive design with dark sidebar
- **Keyboard Shortcuts** - Efficient navigation and actions
- **Auto-save** - Changes saved automatically every 3 seconds
- **Word/Character Count** - Real-time statistics
- **Cross-platform** - Works on Windows, macOS, and Linux

### Keyboard Shortcuts
- `Ctrl+N` (or `Cmd+N`) - New Note
- `Ctrl+S` (or `Cmd+S`) - Save Note
- `Ctrl+E` (or `Cmd+E`) - Export Note
- `Ctrl+O` (or `Cmd+O`) - Import Note
- `Ctrl+Q` (or `Cmd+Q`) - Quit Application

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Install Dependencies

```bash
npm install
```

### Development Mode

```bash
npm run dev
```

### Build for Production

```bash
# Build the app
npm run build

# Create distributable packages
npm run dist
```

### Available Scripts

- `npm start` - Start the application
- `npm run dev` - Start in development mode (with DevTools)
- `npm run build` - Build the application
- `npm run dist` - Create distribution packages
- `npm run pack` - Pack the app without creating installers

## Architecture

### Main Process (`src/main.js`)
- Window management and lifecycle
- Application menu creation
- IPC handlers for file operations
- Security configurations

### Preload Script (`src/preload.js`)
- Secure bridge between main and renderer processes
- Exposes safe APIs to the renderer
- Context isolation for security

### Renderer Process (`src/renderer.js`)
- User interface logic
- Note management and operations
- Search and filtering functionality
- Auto-save implementation

### Data Storage
- Uses `electron-store` for persistent note storage
- JSON-based storage with automatic file management
- Cross-platform data directory handling

## Project Structure

```
Notetaker-app-electron/
├── package.json                 # Dependencies and scripts
├── src/
│   ├── main.js                 # Main Electron process
│   ├── preload.js              # Preload script for security
│   ├── index.html              # Application UI
│   ├── styles.css              # Application styling
│   └── renderer.js             # Renderer process logic
└── README.md                   # This file
```

## Key Technologies

- **Electron** - Cross-platform desktop app framework
- **Node.js** - Runtime environment
- **electron-store** - Persistent data storage
- **HTML5/CSS3** - Modern web technologies
- **Vanilla JavaScript** - No framework dependencies for simplicity

## Security Features

- **Context Isolation** - Renderer process isolated from Node.js
- **Preload Script** - Controlled API exposure
- **No Node Integration** - Secure renderer environment
- **File Validation** - Input sanitization and validation

## Distribution

The app can be packaged for multiple platforms:

- **Windows** - NSIS installer
- **macOS** - DMG with app bundle
- **Linux** - AppImage format

Build configurations are in `package.json` under the `build` section.

## Development Tips

1. **Hot Reload** - Use `npm run dev` for development with automatic reloading
2. **DevTools** - Access Chrome DevTools in development mode
3. **Debugging** - Console logs available in both main and renderer processes
4. **File Structure** - Keep all source files in the `src/` directory

## Future Enhancements

- [ ] Rich text formatting (bold, italic, lists)
- [ ] Note categories and tagging
- [ ] Cloud synchronization
- [ ] Multiple note formats (Markdown, HTML)
- [ ] Themes and customization
- [ ] Note encryption
- [ ] Plugin system

## Troubleshooting

### App Won't Start
- Ensure Node.js is installed (v16+)
- Run `npm install` to install dependencies
- Check console for error messages

### Notes Not Saving
- Check file permissions in the app data directory
- Verify electron-store is properly installed
- Look for error messages in developer console

### Build Issues
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Ensure electron-builder is installed
- Check platform-specific build requirements

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project for personal or commercial applications.

## Support

For issues or questions:
1. Check the troubleshooting section
2. Search existing GitHub issues
3. Create a new issue with detailed information