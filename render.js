const { ipcRenderer, BrowserWindow, remote } = require('electron');

// all the map rendering code on the renderer side

// You can remove the following line if you don't need support for RTL (right-to-left) labels:
mapboxgl.setRTLTextPlugin('https://cdn.maptiler.com/mapbox-gl-js/plugins/mapbox-gl-rtl-text/v0.1.2/mapbox-gl-rtl-text.js');

var lightTheme = 'assets/mapstyles/Light_Map.json';
var darkTheme = 'assets/mapstyles/Dark_Map.json';

const btnTheme = document.getElementById('themebtn');
ipcRenderer.invoke('themeset', '').then((result) => {
    map.setStyle(result === 'light' ? lightTheme : darkTheme);
    btnTheme.setAttribute('class', result);
    btnTheme.setAttribute('src', result === 'light' ? 'assets/sun.svg' : 'assets/moon.svg');
});

ipcRenderer.invoke('positionset', '').then((result) => {
    map.setCenter(result);
});

ipcRenderer.invoke('zoomset', '').then((result) => {
    map.setZoom(result);
});

var map = new mapboxgl.Map({
    container: 'map',
    style: lightTheme,
    center: [-117.19246, 32.73273],
    zoom: 14.48
});

map.addControl(new mapboxgl.ScaleControl({
    maxWidth: 80,
    unit: 'imperial'
}));

map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

/* center changed */
map.on('dragend', function() {
    var center = { lat: map.getCenter().lat, lng: map.getCenter().lng };

    ipcRenderer.send('positionchange', center);

    /* save zoom as it might change when panning */
    var zoom = map.getZoom();

    ipcRenderer.send('zoomchange', zoom);
});

/* zoom changed */
map.on('zoomend', function() {
    var zoom = map.getZoom();

    ipcRenderer.send('zoomchange', zoom);

    /* save position as it might change when zooming */
    var center = { lat: map.getCenter().lat, lng: map.getCenter().lng };

    ipcRenderer.send('positionchange', center);
});

btnTheme.addEventListener('click', function() {
    if (this.getAttribute('class') === 'light') {
        this.setAttribute('class', 'dark');
        this.setAttribute('src', 'assets/moon.svg');
        map.setStyle(darkTheme);
    } else {
        this.setAttribute('class', 'light');
        this.setAttribute('src', 'assets/sun.svg');
        map.setStyle(lightTheme);
    }

    /* save theme setting */
    var theme = this.getAttribute('class');
    ipcRenderer.send('themechange', theme);
});

/* handle window titlebar controls */
document.getElementById("min-btn").addEventListener("click", function(e) {
    var window = remote.BrowserWindow.getFocusedWindow();
    window.minimize();
});

document.getElementById("max-btn").addEventListener("click", function(e) {
    var window = remote.BrowserWindow.getFocusedWindow();
    if (window.isMaximized()) {
        window.restore();
    } else {
        window.maximize();
    }
});

document.getElementById("close-btn").addEventListener("click", function(e) {
    var window = remote.BrowserWindow.getFocusedWindow();
    window.close();
});

/* set window state */
document.onreadystatechange = function() {
    if (document.readyState == "complete") {
        remote.BrowserWindow.getFocusedWindow().on('maximize', () => {
            document.getElementById('max-text').setAttribute('style', 'display: none !important;');
            document.getElementById('restore-text').setAttribute('style', 'display: block !important;');
        });

        remote.BrowserWindow.getFocusedWindow().on('unmaximize', () => {
            document.getElementById('max-text').setAttribute('style', 'display: block !important;');
            document.getElementById('restore-text').setAttribute('style', 'display: none !important;');
        });

        if (remote.BrowserWindow.getFocusedWindow().isMaximized()) {
            document.getElementById('max-text').setAttribute('style', 'display: none !important;');
            document.getElementById('restore-text').setAttribute('style', 'display: block !important;');
        } else {
            document.getElementById('max-text').setAttribute('style', 'display: block !important;');
            document.getElementById('restore-text').setAttribute('style', 'display: none !important;');
        }
    }
};

ipcRenderer.on('airportdata', (event, arg) => {
    arg.filter(a => a.type === 'large_airport' && !a.name.includes('Air Force Base') && !a.name.includes('Regional')).forEach(element => {
        var el = document.createElement('div');
        el.className = 'airport';
        var marker = new mapboxgl.Marker(el)
            .setLngLat([element.longitude_deg, element.latitude_deg])
            .addTo(map);
    });
});