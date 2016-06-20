const mongoose = require('mongoose');
const urlencode = require('urlencode');
const cheerio = require('cheerio');

const Client = require('./support/Client');
const Utils = require('./support/Utils.js');
const Logger = require('./support/Log.js');
const Config = require('./config.js');
require('./model/TaskModel.js');

function main() {
    getTask().then(() => {
        console.log('done');
    });
}

function getTask() {
    let headers = JSON.parse(Config.DEFAULT_LAGOU_GET_HEADERS);
    headers['User-Agent'] = Utils.getUserAgent();

    let cityP = [];
    for (let city of Config.CITIES) {
        let url = Config.CITY_GET_URL + Config.JOB_TYPES[0] + Config.CITY_GET_URL_MIDDLE +
            urlencode.encode(city, 'utf8');

        let cp = Client.get(url, headers).then((body) => {
            let dists = getAreas(body, '.detail-district-area a');
            let distP = [];
            for (let dist of dists) {
                let durl = url + Config.DISTRICT_GET_URL_MIDDLE +
                    urlencode.encode(dist, 'utf8');
                let dp = Client.get(durl, headers).then((body) => {
                    let zones = getAreas(body, '.detail-bizArea-area a');
                    saveTasks(city, dist, zones);
                }).catch((err) => {
                    Logger.error(`Cannot retrieve zones of district ${dist} of city ${city}. Msg:${err.message} Strack:${err.stack}`);
                });
                distP.push(dp);
            }
            return Promise.all(distP);
        }).catch((err) => {
            Logger.error(`Cannot retrieve city ${city}. Msg:${err.message} Strack:${err.stack}`);
        });
        cityP.push(cp);
    }
    return Promise.all(cityP);
}

function getAreas(body, selector) {
    let $ = cheerio.load(body);
    let dists = $(selector).not('.active');
    let result = [];
    if (dists && dists.length > 0) {
        dists.each(function() {
            let v = $(this).text().trim();
            if (v !== '') {
                result.push(v);
            }
        });
    }
    return result;
}

function saveTasks(city, dist, zones) {
    console.log(city + ' ' + dist + JSON.stringify(zones));
    for (let zone of zones) {
        
    }
}

if (require.main === module) {
    main();
}
