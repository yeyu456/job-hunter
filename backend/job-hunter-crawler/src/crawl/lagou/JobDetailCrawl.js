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
const ProxyError = require('./../../exception/ProxyError.js');
const JobDetailDataError = require('./../../exception/JobDetailDataError.js');

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
                this._retrieve();

            }, Config.MISSION_INTERVAL);
        });
    }

    end(err) {
        if (err) {
            this.detailEvent.emit(Config.EVENT_END, err);

        } else {
            this.detailEvent.emit(Config.EVENT_END);
        }
    }

    _retrieve() {
        mongoose.model('JobModel').find({
            $or: [
                { address: null },
                { content: null }
            ]
        }).exec((error, docs) => {
            if (error) {
                error = new DatabaseError(error, 'Failed to query job detail data.');
                Logger.error(error);
                this.end(error);

            } else if (docs.length === 0) {
                Logger.info('Finish crawlling all job details.');
                this.end();

            } else {
                this.jobs = docs;
                this._run();
            }
        });
    }

    _run() {
        ProxyManager.getProxies().then((proxies) => {
            this.proxies = proxies;
            this.runningTask = 0;
            for(let i=0;i<Config.CONCURRENT_TASK_NUM;i++) {
                setTimeout(this._crawl.bind(this), Config.MISSION_INTERVAL * i);
                this.runningTask++;
            }
            this._monitor();

        }).catch((err) => {
            Logger.error(err);
            this.end(err);
        });
    }

    _monitor() {
        setInterval(() => {
            Logger.debug(''+ Date.now() + ' Task num:' + this.runningTask +
                ' Job num:' + this.jobs.length + ' proxy num:' + this.proxies.length);
            if (this.runningTask === 0) {
                this.end();
            }
        }, 1000);
    }

    _crawl() {
        if (this.proxies.length === 0) {
            Logger.error(new ProxyError('No valid proxy.'));
            this.runningTask--;

        } else if (this.jobs.length === 0) {
            Logger.info('Cannot find any job for update');
            this.runningTask--;

        } else {
            let proxy = this.proxies.pop();
            let job = this.jobs.pop();

            this._network(job, proxy).then((body) => {
                this.proxies.push(proxy);
                return body;

            }).catch((e) => {
                ProxyManager.deleteProxy(proxy);
                throw new HttpError(e, `Failed to crawl job detail with proxy ${proxy.ip}`);

            }).then((body) => {
                let [detail, address] = this._parse(body);
                if (!detail) {
                    Logger.debug(body);
                    throw new JobDetailDataError(`Invalid job detail with job id ${job.id} proxy ${proxy.ip}`);
                }
                if (!address) {
                    address = '-';
                }
                job.content = detail;
                job.address = address;
                return this._save(job);

            }).catch((e) => {
                if (e) {
                    Logger.error(e);
                    if (!(e instanceof DatabaseError)) {
                        this.jobs.push(job);
                    }
                }

            }).then(()=> {
                setTimeout(this._crawl.bind(this), Config.MISSION_INTERVAL);
            });
        }
    }

    _network(job, proxy) {
        let url = CrawlConfig.JOB_DETAIL_URL + job.id + CrawlConfig.JOB_DETAIL_URL_POSTFIX;
        let options = JSON.parse(CrawlConfig.DEFAULT_LAGOU_GET_HEADERS);
        options['User-Agent'] = proxy.useragent;

        return Client.get(url, options, proxy);
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