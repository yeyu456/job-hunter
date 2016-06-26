const EventEmitter = require('events');

const urlencode = require('urlencode');
const mongoose = require('mongoose');
const async = require('async');

const Config = require('./../config.js');
const CrawlConfig = require('./../crawl.config.js');
const ProxyManager = require('./../proxy/ProxyManager.js');
const Bridge = require('./../phantomjs/Bridge.js');
const Utils = require('./../support/Utils.js');
const Logger = require('./../support/Log.js');
const Client = require('./../support/Client.js');
const Cache = require('./../db/Cache.js');

const StructError = require('./../exception/StructError.js');
const JobDataError = require('./../exception/JobDataError.js');
const DatabaseError = require('./../exception/DatabaseError.js');
const HttpError = require('./../exception/HttpError.js');

module.exports = class JobCrawl {

    constructor() {
        this._initBridge();
        this.proxyManager = new ProxyManager();
        this.interval = Config.TASK_INTERVAL;
        this.failedNum = 0;
        this._initEvent();
    }

    _initEvent() {
        this.jobEvent = new EventEmitter();
    }

    _initBridge() {
        this.bridge = new Bridge();
        this.bridge.start();
    }

    start() {
        return new Promise((resolve, reject) => {
            this._seed();
            this.jobEvent.on(Config.EVENT_END, (error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    }

    _seed() {
        this.seedTasks = [];
        mongoose.model('TaskModel').find().sort({
            city:1,
            job:1
        }).limit(500).exec((error, docs) => {
            if (error || docs.length === 0) {
                error = error ? new DatabaseError(error) : new DatabaseError('Cannot find any tasks');
                Logger.error(error);

            } else {
                this.seedTasks = this.seedTasks.concat(docs);
                this._crawl();
            }
        });
    }

    _crawl() {
        if (this.seedTasks.length === 0) {
            return;
        }
        let queue = async.queue(this._task.bind(this), Config.CONCURRENT_TASK_NUM);
        queue.drain = () => {
            this.jobEvent.emit(Config.EVENT_END);
        };
        for (let i= this.seedTasks.length;i>0;i--) {
            let task = this.seedTasks.pop();
            queue.push({task:task, order:i}, (error) => {
                if (error) {
                    Logger.error(new JobDataError(error,
                        `crawl task ${task.city}/${task.dist}/${task.zone} failed with page no ${task.startNum}`));
                } else {
                    Logger.debug(`finish task ${task.city}/${task.dist}/${task.zone}`);
                }
            });
        }
    }

    _emulate(task, proxy) {
        this.bridge.push(task, proxy);
    }

    _task(param, cb) {
        //No need to crawl again while updated today
        if (Utils.isSameDay(param.task.updated, new Date()) && param.task.startNum > param.task.maxNum) {
            Logger.info(`${param.task.city}/${param.task.dist}/${param.task.zone} already crawled.`);
            cb();

        } else {
            let proxy = this.proxyManager.getProxy();
            this._emulate(param.task, proxy);
            setTimeout(() => {
                this._initTask(param.task, proxy, param.order).then(() => {
                    cb();

                }).catch((err) => {
                    cb(err);
                });
            }, Config.PHANTOM_WARM_UP_TIME);
        }
    }

    _initTask(task, proxy) {
        return new Promise((resolve, reject) => {
            if (!Utils.isSameDay(task.updated, new Date())) {
                //Reset start page num of yesterday
                if (task.startNum > 1) {
                    task.startNum = 1;
                }
            }
            this._onTask(task, proxy, resolve, reject);
        });
    }

    _onTask(task, proxy, resolve, reject) {
        async.whilst(
            () => {
                Logger.debug(`zone ${task.zone}:${task.startNum}/${task.maxNum}`);
                return task.startNum <= task.maxNum;
            },
            (cb) => {
                async.waterfall([
                    this._network.bind(this, task, proxy),
                    this._save.bind(this)

                ], (err) => {
                    if (err) {
                        Logger.debug('Failed task:' + JSON.stringify(task));
                        cb(err);
                    } else {
                        cb();
                    }
                });
            },
            (err) => {
                if (err) {
                    Logger.debug('Failed task:' + JSON.stringify(task));
                    reject(err);
                } else {
                    Logger.debug('Finished task:' + JSON.stringify(task));
                    resolve();
                }
            }
        );

    }

    _network(task, proxy, cb) {
        Logger.debug('network ' + task.zone);
        let startPageNum = task.startNum;
        let url = CrawlConfig.CITY_URL + CrawlConfig.CITY_GET_URL + urlencode.encode(task.city, 'utf8') +
            CrawlConfig.DISTRICT_GET_URL + urlencode.encode(task.dist, 'utf8') +
            CrawlConfig.ZONE_GET_URL + urlencode(task.zone, 'utf8') + CrawlConfig.CITY_URL_POSTFIX;
        let options = JSON.parse(CrawlConfig.DEFAULT_LAGOU_POST_HEADERS);
        let data = {
            first : false,
            pn : startPageNum,
            kd : task.job
        };

        Client.post(url, proxy, options, data).then((data) => {
            data = JSON.parse(data);
            if (Utils.isNotValidData(data)) {
                throw new StructError('!!!data structure changed!!!', JSON.stringify(data));

            } else if (parseInt(data['content']['pageNo']) !== startPageNum) {
                throw new JobDataError(`Unmatched page number ${startPageNum}-${data.content.pageNo} ${task.city}/${task.dist}/${task.zone} ${task.job}`);

            } else {
                Logger.debug('total count' + data['content']['positionResult']['totalCount']);
                Logger.debug('page size' + data['content']['pageSize']);
                let maxNum = Utils.getMaxPageNum(
                    data['content']['positionResult']['totalCount'],
                    data['content']['pageSize']
                );
                Logger.debug('maxnum '+ maxNum);
                
                cb(null, data['content']['positionResult']['result'], task, maxNum);
            }

        }).catch((err) => {
            this.failedNum++;
            Logger.error(new HttpError(err, 'failed time ' + this.failedNum));
            cb(new HttpError(err));
        });
    }

    _save(jobs, task, maxNum, cb) {
        Logger.debug('save ' + task.zone);
        if (jobs.length === 0) {
            Logger.error(new JobDataError('No job data.'));
            mongoose.model('TaskModel').update({ _id: task._id }, task, (err) => {
                if (err) {
                    Logger.error(err);
                    cb(new DatabaseError(err));

                } else {
                    Logger.debug('finished saved task ' + task.zone);
                    cb();
                }
            });

        } else {
            let jobModels = [];
            let companyModels = [];
            for (let job of jobs) {
                if (job.city !== task.city || job.district !== task.dist) {
                    Logger.error(new JobDataError(
                        `Not matched job id ${job.positionId} with location ${job.city}-${job.district} / ${city}-${dist}-${zone}`));
                    jobModels.push({
                        id: job.positionId,
                        companyId: job.companyId,
                        type: task.job,
                        name: job.positionName,
                        salary: job.salary,
                        education: job.education,
                        year: job.workYear,
                        created: job.createTimeSort,
                        city: job.city,
                        dist: job.district,
                        zone: task.zone
                    });

                } else {
                    jobModels.push({
                        id: job.positionId,
                        companyId: job.companyId,
                        type: task.job,
                        name: job.positionName,
                        salary: job.salary,
                        education: job.education,
                        year: job.workYear,
                        created: job.createTimeSort,
                        city: task.city,
                        dist: task.dist,
                        zone: task.zone
                    });
                }
                companyModels.push({
                    id: job.companyId,
                    name: job.companyShortName,
                    field: job.industryField
                });
            }
            mongoose.model('JobModel').insertIfNotExist(jobModels).then(() => {
                Logger.debug('finished saved job ' + task.zone);
                return mongoose.model('CompanyModel').insertIfNotExist(companyModels);

            }).then(() => {
                Logger.debug('finished saved company ' + task.zone);
                task.maxNum = maxNum;
                task.startNum++;
                mongoose.model('TaskModel').update({ _id: task._id }, task, (err) => {
                    if (err) {
                        Logger.error(err, '2');
                        cb(new DatabaseError(err));

                    } else {
                        Logger.debug('finished saved task ' + task.zone);
                        cb();
                    }
                });
            }).catch((err) => {
                Logger.error(new DatabaseError(err), '1');
                cb(new DatabaseError(err));
            });
        }
    }
};
