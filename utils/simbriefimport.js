const electron = require('electron');
const path = require('path');
var https = require('https');
var xml2js = require('xml2js');
var parser = new xml2js.Parser();

// this is for importing a simbrief flight plan
class SimbriefImport {
    constructor(userid) {
        const userAppPath = (electron.app || electron.remote.app).getAppPath();

        this.url = "https://www.simbrief.com/api/xml.fetcher.php?userid=" + userid;
        this.data = '';
    }

    get() {
        return this.data;
    }

    async parsePlan() {
        var self = this;
        return new Promise(function(resolve, reject) {
            var temp = '';
            https.get(self.url, function(res) {
                if (res.statusCode >= 200 && res.statusCode < 400) {
                    res.on('data', function(data_) { temp += data_.toString(); });
                    res.on('end', function() {
                        parser.parseString(temp, function(err, result) {
                            resolve(result);
                        });
                    });
                }
            });
        });
    }
}

// expose the class
module.exports = SimbriefImport;