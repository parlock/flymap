const { app, BrowserWindow, ipcMain } = require('electron');
const Store = require('./utils/store.js');
const AirportsDB = require('./utils/airportsdb.js');
const SimbriefImport = require('./utils/simbriefimport.js');

const store = new Store({
    configName: 'flymap-user-preferences',
    defaults: {
        windowBounds: { x: 0, y: 0, width: 1280, height: 800 },
        maximized: false,
        theme: 'light',
        position: { lat: 32.73273, lng: -117.19246 },
        zoom: 14.48
    }
});

const airportsDB = new AirportsDB();

let mainWindow;

app.on('ready', () => {

    // get window size
    let mainBounds = store.get('windowBounds');

    // once electron has started up, create a window.
    mainWindow = new BrowserWindow({
        title: 'Fly Map',
        x: mainBounds.x,
        y: mainBounds.y,
        width: mainBounds.width,
        height: mainBounds.height,
        minWidth: 1280,
        minHeight: 768,
        backgroundColor: '#191a1a',
        icon: 'assets/flymap.ico',
        frame: false,
        show: true,
        paintWhenInitiallyHidden: true,
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true,
            enableRemoteModule: true,
            plugins: true
        }
    });

    /* restore maximize if previously */
    let maximized = store.get('maximized');
    if (maximized) {
        mainWindow.maximize();
    }

    // hide the default menu bar that comes with the browser window
    mainWindow.setMenuBarVisibility(null);

    // mainWindow.webContents.openDevTools();

    // save window size
    mainWindow.on('resized', () => {
        let saveBounds = mainWindow.getBounds();

        store.set('windowBounds', saveBounds);
    });
    mainWindow.on('moved', () => {
        let saveBounds = mainWindow.getBounds();

        store.set('windowBounds', saveBounds);
    });
    mainWindow.on('maximize', () => {
        store.set('maximized', true);
    });
    mainWindow.on('unmaximize', () => {
        store.set('maximized', false);
    });

    // make web links open in default browser
    mainWindow.webContents.on('new-window', function(e, url) {
        e.preventDefault();
        require('electron').shell.openExternal(url);
    });

    // theme changed by user
    ipcMain.on('themechange', (event, arg) => {
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

    ipcMain.handle('getsimbriefplan', (event, arg) => {
        var importer = new SimbriefImport(342019);
        return importer.parsePlan();
    });

    mainWindow.on('ready-to-show', () => {
        /* delay for window state */
        mainWindow.show();

        // send airport data to renderer
        mainWindow.webContents.send('airportdata', airportsDB.get());

        // TEST SIM UDP
    });

    // load a website to display
    mainWindow.loadFile('map.html');
});