const EventEmitter = require('events');

const mongoose = require('mongoose');
const async = require('async');
const cheerio = require('cheerio');

const Config = require('./../../config.js');
const CrawlConfig = require('./../../crawl.config.js');
const Logger = require('./../../support/Log.js');
const ProxyManager = require('./../proxy/ProxyManager.js');
const Client = require('./../../support/Client.js');

const DatabaseError = require('./../../exception/DatabaseError.js');
const HttpError = require('./../../exception/HttpError.js');

module.exports = class JobDetailCrawl {

    constructor() {
        this.detailEvent = new EventEmitter();
    }

    start() {
        return new Promise((resolve, reject) => {
            this.detailEvent.on(Config.EVENT_END, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
            setTimeout(() => {
                this._main();
            }, Config.MISSION_INTERVAL);
        });
    }

    _main() {
        async.waterfall([
            this._retrieve.bind(this),
            this._run.bind(this)

        ], (err) => {
            if (err) {
                Logger.error(err, 'retrieve detail error');
                this.detailEvent.emit(Config.EVENT_END, err);

            } else {
                this.detailEvent.emit(Config.EVENT_END);
            }
        });
    }

    _retrieve(cb) {
        mongoose.model('JobModel').find({
            $or: [
                { address: null },
                { content: null }
            ]
        }).exec((error, docs) => {
            if (error) {
                Logger.error(new DatabaseError(error, 'Failed to query job detail data.'));
                cb(error);

            } else if (docs.length === 0) {
                Logger.info('Finish crawlling all job details.');
                cb();

            } else {
                cb(docs);
            }
        });
    }

    _run(jobs, cb) {
        if (!jobs) {
            cb();

        } else {
            this._crawl(jobs).then(() => {
                cb();

            }).catch((err) => {
                Logger.error(err, 'running error.');
                cb(err);
            });
        }
    }

    _crawl(job) {
        return ProxyManager.getProxies().then((proxies) => {

            async.queue(() => {

            });
            let url = CrawlConfig.JOB_DETAIL_URL + job.id + CrawlConfig.JOB_DETAIL_URL_POSTFIX;
            let options = JSON.parse(CrawlConfig.DEFAULT_LAGOU_GET_HEADERS);
            options['User-Agent'] = proxy.useragent;

            return Client.get(url, options, proxy).then((body) => {
                return this._parse(body);

            }).then((detail, address) => {
                job.content = detail;
                job.address = address;
                return this._save(job);
            });
        });
    }

    _parse(body) {
        let $ = cheerio.load(body);
        let detail = $(CrawlConfig.JOB_DETAIL_SELECTOR).html();
        let address = $(CrawlConfig.JOB_ADDRESS_SELECTOR).text();
        return [detail, address];
    }

    _save(job) {
        return new Promise((resolve, reject) => {
            mongoose.model('JobModel').update({
                id: job.id,
                companyId: job.companyId
            }, job, {
                upsert: false,
                new: true
            }, (err) => {
                if (err) {
                    Logger.error(new DatabaseError(err, `Failed to update job detail with id ${job.id}`));
                    reject(err);

                } else {
                    resolve();
                }
            })
        })
    }
};