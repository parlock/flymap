const electron = require('electron');
const path = require('path');
const fs = require('fs');

// this is for airports data on the disk
class AirportsDB {
    constructor() {
        const userAppPath = (electron.app || electron.remote.app).getAppPath();

        this.path = path.join(userAppPath, 'assets/airports.json');
        this.data = parseDataFile(this.path);
    }

    get() {
        return this.data;
    }
}

function parseDataFile(filePath) {
    try {
        return JSON.parse(fs.readFileSync(filePath));
    } catch (error) {
        console.log(error);

        return [];
    }
}

// expose the class
module.exports = AirportsDB;