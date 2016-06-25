const EventEmitter = require('events');

const urlencode = require('urlencode');
const mongoose = require('mongoose');

const Config = require('./../config.js');
const ProxyManager = require('./../proxy/ProxyManager.js');
const Bridge = require('./../phantomjs/Bridge.js');
const Utils = require('./../support/Utils.js');
const Logger = require('./../support/Log.js');
const Client = require('./../support/Client.js');
const Cache = require('./../db/Cache.js');

const StructError = require('./../exception/StructError.js');
const JobDataError = require('./../exception/JobDataError.js');
const DatabaseError = require('./../exception/DatabaseError.js');

module.exports = class JobCrawl {

    constructor() {
        this.proxyManager = new ProxyManager();
        this.interval = Config.TASK_INTERVAL;
        this.failedNum = 0;
        this.curJobTask = 0;
        this._initEvent();
        this._initBridge();
    }

    _initEvent() {
        this.jobEvent = new EventEmitter();
        this.jobEvent.on(Config.EVENT_SEED, this._seed.bind(this));
        this.jobEvent.on(Config.EVENT_EMULATE, this._emulate.bind(this));
    }

    _initBridge() {
        this.bridge = new Bridge();
        this.bridge.start();
    }

    start() {
        this.jobEvent.emit(Config.EVENT_SEED);
        return new Promise((resolve, reject) => {
            this.jobEvent.on(Config.EVENT_END, (error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    }

    end() {
        Logger.info('job crawl end');
    }

    _seed() {
        this.seedTasks = [];
        this.failedTasks = [];
        mongoose.model('TaskModel').find().sort({
            city:1,
            job:1
        }).limit(3).exec((error, docs) => {
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
    }

    _emulate(task, proxy) {
        this.bridge.push(task, proxy);
    }

    _task(task, cb) {

    }

    _initSeedTasks() {
        let tasks = [];
        //remove finished task
        this.seedTasks = this.seedTasks.filter((v) => {
            return !Utils.isSameDay(v.updated, new Date()) ||
                v.maxNum <= 1 ||
                v.startNum <= v.maxNum;
        });
        for (let index in this.seedTasks) {
            if (Utils.isSameDay(this.seedTasks[index].updated, new Date())) {
                //No need to crawl max page num again while updated today
                if (this.seedTasks[index].maxNum > 1) {
                    continue;
                }

            } else {
                //Reset start page num of yesterday
                if (this.seedTasks[index].startNum > 1) {
                    this.seedTasks[index].startNum = 1;
                }
            }
            let p = new Promise((resolve, reject) => {
                setTimeout(this._onTask.bind(this, index, resolve, reject),
                    this.interval * index);
            });
            tasks.push(p);
        }
        return Promise.all(tasks);
    }

    _jobTask() {
        for(let i=0;i<Config.CONCURRENT_TASK_NUM;i++) {
            this.curJobTask++;
            setTimeout(this._startNewTask.bind(this, i),
                this.interval * i);
        }
        return new Promise((resolve, reject) => {
            this.jobEvent.on('endJobTask', (i) => {
                if (this.curJobTask > 0) {
                    Logger.debug(`finsih job task ${i}`);
                }
                resolve();
            });
        });
    }

    _startNewTask(id){
        Logger.debug('start new task ' + id);
        let index;
        let moreDelay = 0;
        if (this.seedTasks.length === 0) {
            if (this.failedTasks.length !== 0) {
                this.seedTasks.push(this.failedTasks.pop());
                index = 0;
                moreDelay += this.interval * this.failedTasks.length;

            } else {
                this._endNewTask(id);
                return;
            }
        } else {
            index = Utils.getRandomInt(0, this.seedTasks.length);
        }
        this._onTask(index, () => {
            setTimeout(this._startNewTask.bind(this, id),
                this.interval * id + moreDelay);

        }, () => {
            this._endNewTask(id);
        });
    }

    _endNewTask(id) {
        this.curJobTask--;
        this.jobEvent.emit('endJobTask', id);
    }

    _onTask(taskIndex, resolve, reject) {
        if (!this.seedTasks[taskIndex]) {
            Logger.error(new Error('No such task with index ' + taskIndex + ' len:' + this.seedTasks.length));
            resolve();
            return;
        }

        //remove in case of another call
        let task = this.seedTasks.splice(taskIndex, 1)[0];

        let startPageNum = task.startNum;
        let url = Config.CITY_URL + Config.CITY_GET_URL + urlencode.encode(task.city, 'utf8') +
            Config.DISTRICT_GET_URL + urlencode.encode(task.dist, 'utf8') +
            Config.ZONE_GET_URL + urlencode(task.zone, 'utf8') + Config.CITY_URL_POSTFIX
        let options = JSON.parse(Config.DEFAULT_LAGOU_POST_HEADERS);
        let data = {
            first : false,
            pn : startPageNum,
            kd : task.job
        };
        Client.post(url, options, data).then((data) => {
            data = JSON.parse(data);
            if (this._isNotValidData(data)) {
                throw new StructError('!!!data structure changed!!!', JSON.stringify(data));

            } else if (parseInt(data['content']['pageNo']) !== startPageNum) {
                throw new JobDataError(`Unmatched page number ${startPageNum}-${data.content.pageNo}`);

            } else {
                this._save(data['content']['positionResult']['result'], task)
                .then(() => {
                    resolve();
                });
            }

        }).catch((err) => {
            Logger.error(err);
            this.failedNum++;
            if (this.failedNum > Config.CRAWL_CONTINGENCY_PLAN_TRESHOLD) {
                this.jobEvent.emit('cp');
                this.failedNum = 0;
            }
            this.seedTasks.push(task);
            resolve();
        });
    }

    _isNotValidData(data) {
        return !data ||
            !data['content'] ||
            !data['content']['positionResult'] ||
            !data['content']['positionResult']['totalCount'] ||
            !data['content']['positionResult']['pageSize'] ||
            !data['content']['positionResult']['result'];
    }

    _save(jobs, task) {
        if (jobs.length <= 0) {
            return;
        }
        let jobModels = [];
        let companyModels = [];
        for (let job of jobs) {
            if (job.city !== task.city || job.district !== task.dist) {
                Logger.error(new JobDataError(
                    `Not matched job id ${job.positionId} with location ${job.city}-${job.district} / ${city}-${dist}-${zone}`));
                jobModels.push({
                    id: job.positionId,
                    companyId: job.companyId,
                    name: job.positionName,
                    salary: job.salary,
                    education: job.education,
                    year: job.workYear,
                    created: job.createTimeSort,
                    city: job.city,
                    dist: job.district,
                    zone: '-'
                });

            } else {
                jobModels.push({
                    id: job.positionId,
                    companyId: job.companyId,
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
        let p = mongoose.model('JobModel').insertIfNotExist(jobModels).then(() => {
            return mongoose.model('CompanyModel').insertIfNotExist(companyModels);

        }).then(() => {
            task.maxNum = Utils.getMaxPageNum(
                data['content']['positionResult']['totalCount'],
                data['content']['positionResult']['pageSize']
            );
            task.startNum++;
            return new Promise((resolve, reject) => {
                mongoose.model('TaskModel').update({ _id: task._id }, task, (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        });
        return p;
    }
};
