const mongoose = require('mongoose');
const urlencode = require('urlencode');
const cheerio = require('cheerio');

const Client = require('./support/Client');
const Utils = require('./support/Utils.js');
const Logger = require('./support/Log.js');
const Config = require('./config.js');
require('./model/TaskModel.js');

function main() {
    connectDB().then(getTask).then(() => {
        console.log('done');
    });
}

function connectDB() {
    //use native Promise
    mongoose.Promise = global.Promise;

    //get db url
    let url = 'mongodb://';
    if (Config.DATABASE_USERNAME &&
        DATABASE_USERNAME !== '' &&
        Config.DATABASE_PASSWORD &&
        Config.DATABASE_PASSWORD !==  '') {
        url += Config.DATABASE_USERNAME + ':' + Config.DATABASE_PASSWORD + '@';
    }
    url += Config.DATABASE_HOST;
    if (Config.DATABASE_PORT && Config.DATABASE_PORT !== '') {
        url += ':' + Config.DATABASE_PORT;
    }
    url += '/' + Config.DATABASE_NAME;

    //do connect
    return mongoose.connect(url, Config.DATABASE_OPTIONS);
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
    let models = [];
    for (let zone of zones) {
        for (let job of Config.JOB_TYPES) {
            models.push({
                job: job,
                city: city,
                dist: dist,
                zone: zone,
                startNum: 1,
                maxNum: 1
            });
        }
    }
    mongoose.model('TaskModel').insertMany(models, (err, docs) => {
        if (err) {
            Logger.error(`Insert district ${dist} of city ${city}. Msg:${err.message} Strack:${err.stack}`);
        } else {
            console.log(dist + ' saved');
        }
    });
}

if (require.main === module) {
    main();
}
