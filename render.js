const { ipcRenderer, BrowserWindow, remote } = require('electron');

// all the map rendering code on the renderer side

var airports = [];
var hasAirports = false;
const searchVal = document.getElementById('searchval');

searchVal.addEventListener('keyup', function(event) {
    if (hasAirports && event.key === 'Enter') {
        /* do search */
        var valSearch = document.getElementById('searchval').value;
        var resultsBox = document.getElementById('searchresults');

        /* clear results */
        resultsBox.innerHTML = '';

        var idents = airports.filter(a => a.ident.toLowerCase().includes(valSearch));
        var iata = airports.filter(a => a.iata_code.toLowerCase().includes(valSearch));
        var names = airports.filter(a => a.name.toLowerCase().includes(valSearch));
        var results = [].concat(idents, iata, names);
        var resultsdedup = [];
        results.forEach(el => {
            if(resultsdedup.filter(r => r.ident.toLowerCase().includes(el.ident.toLowerCase())).length == 0) {
                resultsdedup.push(el);
            }
        });

        /* get up to 12 results */
        var final = resultsdedup.slice(0, (resultsdedup.length > 12 ? 12 : resultsdedup.length))

        /* create results list */
        final.forEach(r => {
            var el = document.createElement('div');
            el.className = 'result';
            el.innerHTML = '<span class="name">' + r.name + '</span><br/><span class="ident">' + r.ident + (r.iata_code !== '' ? '/' + r.iata_code + '</span>' : '');
            el.setAttribute('data-lat', r.latitude_deg);
            el.setAttribute('data-lng', r.longitude_deg);
            resultsBox.append(el);
        });

        document.querySelectorAll('#searchresults .result').forEach(r => {
            r.addEventListener('click', function() {
                /* change map center to this airport */
                var lat = r.getAttribute('data-lat');
                var lng = r.getAttribute('data-lng');
                map.setCenter({ 'lat': lat, 'lng': lng });
                map.setZoom(14);
    
                /* hide results */
                resultsBox.setAttribute('style', 'display: none;');
                searchVal.value = '';

                /* save new location */
                var center = { lat: map.getCenter().lat, lng: map.getCenter().lng };

                ipcRenderer.send('positionchange', center);
            
                /* save zoom as it might change when panning */
                var zoom = map.getZoom();
            
                ipcRenderer.send('zoomchange', zoom);
            });
        });

        /* show results box */
        resultsBox.setAttribute('style', 'display: block;');
    }
});

/* clear search results */
document.getElementById('clearsearch').addEventListener('click', function() {
    var valSearch = document.getElementById('searchval').value;
    var resultsBox = document.getElementById('searchresults');

    /* hide results */
    resultsBox.setAttribute('style', 'display: none;');
    searchVal.value = '';
});

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
    zoom: 14.48,
    minZoom: 3,
    pitchWithRotate: false,
    dragRotate: false
});

map.addControl(new mapboxgl.ScaleControl({
    maxWidth: 80,
    unit: 'metric'
}));
map.addControl(new mapboxgl.ScaleControl({
    maxWidth: 80,
    unit: 'imperial'
}));

map.addControl(new mapboxgl.NavigationControl({
    showCompass: false
}), 'bottom-right');

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
        /* utc time */
        var d = new Date();
        var n = (d.getUTCHours() < 10 ? '0': '') + d.getUTCHours() + ':' + (d.getUTCMinutes() < 10 ? '0': '') + d.getUTCMinutes() + 'Z';
        document.getElementById('utctime').innerText = n;
    
        window.setInterval(function() {
                var d = new Date();
                var n = (d.getUTCHours() < 10 ? '0': '') + d.getUTCHours() + ':' + (d.getUTCMinutes() < 10 ? '0': '') + d.getUTCMinutes() + 'Z';
                document.getElementById('utctime').innerText = n;
        }, 
        1000);

        remote.BrowserWindow.getFocusedWindow().on('maximize', () => {
            document.getElementById('max-text').setAttribute('style', 'display: none;');
            document.getElementById('restore-text').setAttribute('style', 'display: block;');
        });

        remote.BrowserWindow.getFocusedWindow().on('unmaximize', () => {
            document.getElementById('max-text').setAttribute('style', 'display: block;');
            document.getElementById('restore-text').setAttribute('style', 'display: none;');
        });

        if (remote.BrowserWindow.getFocusedWindow().isMaximized()) {
            document.getElementById('max-text').setAttribute('style', 'display: none;');
            document.getElementById('restore-text').setAttribute('style', 'display: block;');
        } else {
            document.getElementById('max-text').setAttribute('style', 'display: block;');
            document.getElementById('restore-text').setAttribute('style', 'display: none;');
        }
    }
};

ipcRenderer.on('airportdata', (event, arg) => {
    /* store for searching later */
    airports = arg;

    /* process airport markers on map */
    arg.filter(a => a.type === 'large_airport' && !a.name.includes('Base') && !a.name.includes('Regional')).forEach(element => {
        var el = document.createElement('div');
        el.className = 'airport';
        var popup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            closeOnMove: true,
            focusAfterOpen: false
        }).setHTML('<h4>' + element.name + '</h4><h2>' + element.ident + (element.iata_code !== '' ? '/' + element.iata_code : '') + '</h2>');
        var marker = new mapboxgl.Marker(el)
            .setLngLat([element.longitude_deg, element.latitude_deg])
            .addTo(map)
            .setPopup(popup);
        el.addEventListener('mouseenter', () => { if (!marker.getPopup().isOpen()) { marker.togglePopup(); } });
        el.addEventListener('mouseleave', () => { if (marker.getPopup().isOpen()) { marker.togglePopup(); } });
    });

    /* turn on search */
    hasAirports = true;
});