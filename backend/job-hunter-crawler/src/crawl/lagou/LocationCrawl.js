const mongoose = require('mongoose');
const urlencode = require('urlencode');
const cheerio = require('cheerio');

require('./../../model/TaskModel.js');
const Database = require('./../../db/Database.js');
const CrawlConfig = require('./../../crawl.config.js');
const Client = require('./../../support/Client');
const Utils = require('./../../support/Utils.js');
const Logger = require('./../../support/Log.js');
const LocationError = require('./../../exception/LocationError.js');
const DataBaseError = require('./../../exception/DatabaseError.js');
const HttpError = require('./../../exception/HttpError.js');

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
            saveTasks(city, dists);

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

function saveTasks(city, dists) {
    Logger.debug([].concat('save tasks', city, dists));
    let models = [];
    for (let dist of dists) {
        for (let job of CrawlConfig.JOB_TYPES) {
            models.push({
                job: job,
                city: city,
                dist: dist,
                startNum: 1,
                maxNum: 1,
                updateTime: 0
            });
        }
    }
    if (models.length === 0) {
        Logger.error(new LocationError(`No dist in ${city} city`));
        return;
    }
    mongoose.model('TaskModel').insertMany(models, (err) => {
        if (err) {
            Logger.error(new DataBaseError(err, `Failed to insert city ${city}`));

        } else {
            Logger.debug(`city ${city} saved`);
        }
    });
}

if (require.main === module) {
    main();
}
