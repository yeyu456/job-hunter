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
            this.jobs = jobs;
            ProxyManager.getProxies().then((proxies) => {
                this.proxies = proxies;
                for(let i=0;i<Config.CONCURRENT_TASK_NUM;i++) {
                    setTimeout(this._crawl.bind(this), Config.MISSION_INTERVAL * i);
                }

            }).catch((err) => {
                Logger.error(err, 'running error.');
                cb(err);
            });
        }
    }

    _crawl() {
        if (this.proxies.length === 0) {
            Logger.error('No valid proxy.');

        } else if (this.jobs.length === 0) {
            Logger.info('Cannot find any job for update');

        } else {
            let proxy = this.proxies.pop();
            let job = this.jobs.pop();

            this._network(job, proxy).catch((e) => {
                throw new HttpError(e, `Failed to crawl job detail with proxy ${proxy.ip}`);

            }).then(([detail, address]) => {
                job.content = detail;
                job.address = address;
                return this._save(job);

            }).then(()=> {
                setTimeout(this._crawl.bind(this), Config.MISSION_INTERVAL);

            }).catch((e) => {
                if (e) {
                    Logger.error(e);
                    if (!(e instanceof DatabaseError)) {
                        this.jobs.push(job);
                    }
                }
            });
        }
    }

    _network(job, proxy) {
        let url = CrawlConfig.JOB_DETAIL_URL + job.id + CrawlConfig.JOB_DETAIL_URL_POSTFIX;
        let options = JSON.parse(CrawlConfig.DEFAULT_LAGOU_GET_HEADERS);
        options['User-Agent'] = proxy.useragent;

        return Client.get(url, options, proxy).then((body) => {
            return this._parse(body);
        });
    }

    _parse(body) {
        let $ = cheerio.load(body, {decodeEntities: false});
        let detail = $(CrawlConfig.JOB_DETAIL_SELECTOR).html();
        let address = $(CrawlConfig.JOB_ADDRESS_SELECTOR).text().replace(/\s/gi, '');
        return [detail, address];
    }

    _save(job) {
        return new Promise((resolve) => {
            mongoose.model('JobModel').update({
                id: job.id,
                companyId: job.companyId

            }, job, {
                upsert: false

            }, (err) => {
                if (err) {
                    throw new DatabaseError(err, `Failed to update job detail with id ${job.id}`);

                } else {
                    resolve();
                }
            });
        })
    }
};