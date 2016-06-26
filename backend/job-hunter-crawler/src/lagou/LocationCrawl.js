const mongoose = require('mongoose');
const urlencode = require('urlencode');
const cheerio = require('cheerio');

require('./../model/TaskModel.js');
const Database = require('./../db/Database.js');
const Client = require('./../support/Client');
const Utils = require('./../support/Utils.js');
const Logger = require('./../support/Log.js');
const LocationError = require('./../exception/LocationError.js');
const DataBaseError = require('./../exception/DatabaseError.js');
const HttpError = require('./../exception/HttpError.js');
const CrawlConfig = require('./../crawl.config.js');

function main() {
    Database.connect().then(getTask).then(() => {
        Logger.debug('location crawl done');
    });
}

function getTask() {
    let headers = JSON.parse(CrawlConfig.DEFAULT_LAGOU_GET_HEADERS);
    headers['User-Agent'] = Utils.getUserAgent();

    let cityP = [];
    for (let city of CrawlConfig.CITIES) {
        let url = CrawlConfig.GET_URL + CrawlConfig.JOB_TYPES[0] + CrawlConfig.CITY_GET_URL +
            urlencode.encode(city, 'utf8');

        let cp = Client.get(url, headers).then((body) => {

            let dists = getAreas(body, '.detail-district-area a');
            let distP = [];
            for (let dist of dists) {
                let distUrl = url + CrawlConfig.DISTRICT_GET_URL +
                    urlencode.encode(dist, 'utf8');

                let dp = Client.get(distUrl, headers).then((body) => {
                    let zones = getAreas(body, '.detail-bizArea-area a');
                    saveTasks(city, dist, zones);

                }).catch((err) => {
                    Logger.error(new HttpError(err,
                        `Cannot retrieve zones in ${dist} district of ${city} city`));
                });

                distP.push(dp);
            }
            return Promise.all(distP);

        }).catch((err) => {
            Logger.error(new LocationError(err, `Cannot retrieve locations of ${city} city`));
        });

        cityP.push(cp);
    }
    return Promise.all(cityP);
}

function getAreas(body, selector) {
    let $ = cheerio.load(body);
    let areas = $(selector).not('.active');
    let result = [];
    if (areas && areas.length > 0) {
        areas.each(function() {
            let v = $(this).text().trim();
            if (v !== '') {
                result.push(v);
            }
        });
    }
    return result;
}

function saveTasks(city, dist, zones) {
    Logger.debug([].concat('save tasks', city, dist, zones));
    let models = [];
    for (let zone of zones) {
        for (let job of CrawlConfig.JOB_TYPES) {
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
    if (models.length === 0) {
        Logger.error(new LocationError(`No zone in ${dist} district of ${city} city`));
        return;
    }
    mongoose.model('TaskModel').insertMany(models, (err, docs) => {
        if (err) {
            Logger.error(new DataBaseError(err, `Failed to insert district ${dist} of city ${city}`));

        } else {
            Logger.debug([].concat(city, dist, docs, 'saved'));
        }
    });
}

if (require.main === module) {
    main();
}
