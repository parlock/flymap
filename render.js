const { ipcRenderer } = require('electron');

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
