const EventEmitter = require('events');

const urlencode = require('urlencode');
const mongoose = require('mongoose');
const async = require('async');

const Config = require('./../../config.js');
const CrawlConfig = require('./../../crawl.config.js');
const ProxyManager = require('./../proxy/ProxyManager.js');
const Bridge = require('./../../phantomjs/Bridge.js');
const Utils = require('./../../support/Utils.js');
const Logger = require('./../../support/Log.js');
const Client = require('./../../support/Client.js');
const Cache = require('./../../db/Cache.js');

const StructError = require('./../../exception/StructError.js');
const JobDataError = require('./../../exception/JobDataError.js');
const DatabaseError = require('./../../exception/DatabaseError.js');
const HttpError = require('./../../exception/HttpError.js');
const PhantomError = require('./../../exception/PhantomError.js');
const ProxyError = require('./../../exception/ProxyError.js');

module.exports = class JobCrawl {

    constructor() {
        this.failedNum = 0;
        this._initBridge();
        this._initEvent();
    }

    _initEvent() {
        this.jobEvent = new EventEmitter();
    }

    _initBridge() {
        this.bridge = new Bridge();
        this.bridge.init();
        this.bridge.regist(this._crawl.bind(this), this._proxyFail.bind(this));
    }

    start() {
        return new Promise((resolve, reject) => {
            setTimeout(function () {
                Logger.info('start job crawl');
                this._getTask(Config.CONCURRENT_TASK_NUM);
                this.jobEvent.on(Config.EVENT_END, (error) => {
                    if (error) {
                        reject(error);

                    } else {
                        resolve();
                    }
                });
            }.bind(this), Config.MISSION_INTERVAL);
        });
    }

    _getTask(taskSize) {
        mongoose.model('TaskModel').find({
            $or: [
                { 'updated': {$lt: Utils.getYesterday() }},
                { $where: 'this.startNum <= this.maxNum' }
            ]
        }).sort({
            updateTime:1,
            city:1,
            job:1

        }).limit(taskSize).exec((error, docs) => {
            if (error) {
                error = new DatabaseError(error, 'Failed to get task.');
                Logger.error(error);
                this.jobEvent.emit(Config.EVENT_END, error);

            } else if (docs.length === 0) {
                Logger.info('No more task.');
                this.jobEvent.emit(Config.EVENT_END);

            } else {
                this._initTask(docs);
                this._emulate(docs);
            }
        });
    }

    _initTask(tasks) {
        for (let task of tasks) {
            if (!Utils.isSameDay(task.updated, new Date())) {
                //Reset page num of yesterday
                task.startNum = 1;
                task.maxNum = 1;
            }
        }
    }

    _emulate(tasks) {
        for (let task of tasks) {
            ProxyManager.getMostFastProxy().then((proxy) => {
                this.bridge.emulate(task, proxy);

            }).catch(() => {
                Logger.error(new PhantomError(`Task ${task.city}/${task.dist}/${task.zone} failed on emulate`));
            });
        }
    }

    _crawl(task, proxy) {
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
                    Logger.error(err, `Task ${task.city}/${task.dist}/${task.zone} failed on crawl`);
                } else {
                    Logger.debug(`Task ${task.city}/${task.dist}/${task.zone} finished on crawl`);
                }
                this._getTask(1);
            }
        );
    }

    _proxyFail(task, proxy) {
        Logger.error(new ProxyError(`Task ${task.city}/${task.dist}/${task.zone} failed on bridge`));
        ProxyManager.deleteProxy(proxy);
    }

    _network(task, proxy, cb) {
        Logger.debug('network', task.zone);
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

        Client.post(url, options, data, proxy, CrawlConfig.SPEED_TIMEOUT).then((data) => {
            data = JSON.parse(data);
            if (Utils.isNotValidData(data)) {
                throw new StructError('!!!data structure changed!!!', JSON.stringify(data));

            } else if (parseInt(data['content']['pageNo']) !== startPageNum) {
                Logger.warn(new JobDataError(
                    `Unmatched page number ${startPageNum}-${data.content.pageNo} ${task.city}/${task.dist}/${task.zone} ${task.job}`));
                cb(null, [], task, startPageNum);

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
            ProxyManager.deleteProxy(proxy);
            cb(new HttpError(err));
        });
    }

    _save(jobs, task, maxNum, cb) {
        Logger.debug('save ' + task.zone);
        if (jobs.length === 0) {
            Logger.warn(new JobDataError('No job data.'));
            task.startNum++;
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
