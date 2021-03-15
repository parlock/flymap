const { app, BrowserWindow, ipcMain } = require('electron');
const Store = require('./utils/store.js');


const store = new Store({
  configName: 'flymap-user-preferences',
  defaults: {
    windowBounds: { width: 1280, height: 800 },
    theme: 'light',
    position: { lat: 32.73273, lng: -117.19246 },
    zoom: 14.48
  }
});

let mainWindow;

app.on('ready', () => {

  // get window size
  let { width, height } = store.get('windowBounds');

  // once electron has started up, create a window.
  mainWindow = new BrowserWindow({ 
      title: 'Fly Map',
      width: width, 
      height: height,
      frame: false,
      webPreferences: { 
        contextIsolation: false,
        nodeIntegration: true,
        enableRemoteModule: true,
        plugins: true
       }
    });

  // hide the default menu bar that comes with the browser window
  mainWindow.setMenuBarVisibility(null);

  // mainWindow.webContents.openDevTools();

  // save window size
  mainWindow.on('resize', () => {
    let { width, height } = mainWindow.getBounds();

    store.set('windowBounds', { width, height });
  });

  // theme changed by user
  ipcMain.on('themechange', (event,arg) => {
    store.set('theme', arg);
  });

  // get current theme set
  ipcMain.handle('themeset', (event, arg) => {
    let theme = store.get('theme');

    return theme;
  });

  // position changed by user
  ipcMain.on('positionchange', (event, arg) => {
    store.set('position', arg);
  });

  // get last position set
  ipcMain.handle('positionset', (event, arg) => {
    let pos = store.get('position');

    return pos;
  });

  // zoom changed by user
  ipcMain.on('zoomchange', (event, arg) => {
    store.set('zoom', arg);
  });

  // get last zoom set
  ipcMain.handle('zoomset', (event, arg) => {
    let zoom = store.get('zoom');

    return zoom;
  });

  // load a website to display
  mainWindow.loadFile('map.html');
});
