const EventEmitter = require('events');
const path = require('path');
const childProcess = require('child_process');

const phantomjs = require('phantomjs-prebuilt');
const urlencode = require('urlencode');
const ws = require('ws');
const mongoose = require('mongoose');

const Utils = require('./../support/Utils.js');
const Logger = require('./../support/Log.js');
const Client = require('./../support/Client.js');
const Config = require('./../config.js');
const Cache = require('./../db/Cache.js');
const StructError = require('./../exception/StructError.js');
const JobDataError = require('./../exception/JobDataError.js');
const DatabaseError = require('./../exception/DatabaseError.js');

module.exports = class JobCrawl {

    constructor() {
        this.ws = new ws.Server({port : 8080});
        this.ws.on('message', function incoming(message) {
            console.log('received: %s', message);
        });
        this.interval = Config.TASK_INTERVAL;
        this.jobEvent = new EventEmitter();
        this.curJobTask = 0;
    }

    start() {
        return this._getSeedTasks().then(() => {
                return this._initSeedTasks();

            }).then(() => {
                return this._jobTask();

            }).then(() => {
                this.end();

            }).catch((error) => {
                Logger.error(error);
                throw error;
            });
    }

    end() {
        Logger.info('job crawl end');
    }

    _getSeedTasks() {
        this.seedTasks = [];
        this.failedTasks = [];
        return new Promise((resolve, reject) => {
            mongoose.model('TaskModel').find().sort({
                city:1,
                job:1
            }).exec((error, docs) => {
                if (error) {
                    error = new DatabaseError(error);
                    Logger.error(error);
                    reject(error);

                } else {
                    if (docs.length === 0) {
                        error = new DatabaseError('Cannot find any tasks.');
                        Logger.error(error);
                        reject(error);

                    } else {
                        this.seedTasks = this.seedTasks.concat(docs);
                        resolve();
                    }
                }
            });
        });
    }

    _initSeedTasks() {
        let tasks = [];
        for (let index in this.seedTasks) {
            if (Utils.isSameDay(this.seedTasks[index].updated, new Date())) {
                //No need to crawl max page num again while updated today
                if (this.seedTasks[index].maxNum > 1) {
                    //reset finished task
                    if (this.seedTasks[index].startNum > this.seedTasks[index].maxNum) {
                        this.seedTasks[index] = null;
                    }
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
        //remove finished task
        this.seedTasks = this.seedTasks.filter((v) => {
            return v !== null;
        });
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
                if (this.curJobTask <= 0) {
                    resolve();

                } else {
                    Logger.debug('finsih job task ' + i);
                }
            });
        });
    }

    _startNewTask(id){
        console.log('start new task ' + id);
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
        let options = JSON.parse(Config.DEFAULT_LAGOU_POST_HEADERS);
        options['Referer'] = Config.CITY_REF + task.job + Config.CITY_REF_POSTFIX;
        let data = {
            first : false,
            pn : startPageNum,
            kd : task.job
        };
        Client.post(task.url, options, data).then((data) => {
            data = JSON.parse(data);
            if (parseInt(data['content']['pageNo']) !== startPageNum) {
                Logger.error(new Error(`wrong page number ${startPageNum}-${data.content.pageNo}`));
                this.failedTasks.push(task);
                resolve();
                return;

            } else {
                task.maxPageNum = this._getMaxPageNum(data);
                this._saveJobs(data['content']['positionResult']['result'],
                    task.city, task.dist, task.zone);
                this.seedTasks.push(task);
                resolve();
                return;
            }

        }).catch((err) => {
            Logger.error(err);
            this.failedTasks.push(task);
            resolve();
            return;
        });
    }

    _crawlCP() {
        // start crawl contingency plan
        // stop all the running tasks


        // Emulate browser and do some normal actions to mislead the crawl target
        this.ws.on('connection', (socket) => {
            socket.send(JSON.stringify({
                city : urlencode.encode(Config.CITIES[0], 'utf8'),
                job : Config.JOB_TYPES[0],
                proxyIP : '112.65.200.211',
                proxyPort : 80,
                proxyType : 'http',
                useragent : Utils.getUserAgent()
            }));
        });
        let args = [path.join(__dirname, '..', 'phantomjs', 'LagouJob.js')];
        childProcess.execFile(phantomjs.path, args, (err, stdout, stderr) => {});

        //increase task crawl interval
        this.interval *= 2;

        //switch proxy ip
    }

    _getMaxPageNum(data) {
        if (data) {
            if (data.hasOwnProperty('content') &&
            data['content'] &&
            data['content'].hasOwnProperty('positionResult') &&
            data['content']['positionResult'].hasOwnProperty('totalCount') &&
            data['content']['positionResult'].hasOwnProperty('pageSize') &&
            data['content']['positionResult'].hasOwnProperty('result')) {
                return Utils.getMaxPageNum(
                    data['content']['positionResult']['totalCount'],
                    data['content']['positionResult']['pageSize']
                );
            } else {
                throw new StructError('!!!data structure changed!!!', JSON.stringify(data));
            }
        } else {
            throw new Error('No data');
        }
    }

    _saveJobs(jobs, city, dist, zone) {
        if (jobs.length <= 0) {
            return;
        }
        let models = [];
        for (let job of jobs) {
            if (job.city !== city) {
                Logger.error(new JobDataError(
                    `Not matched job id ${job.positionId} with city ${job.city} / ${city}-${dist}-${zone}`));
                models.push({
                    id: job.positionId,
                    companyId: job.companyId,
                    name: job.positionName,
                    salary: job.salary,
                    education: job.education,
                    year: job.workYear,
                    created: job.createTimeSort,
                    city: job.city,
                    dist: '-',
                    zone: '-'
                });

            } else {
                models.push({
                    id: job.positionId,
                    companyId: job.companyId,
                    name: job.positionName,
                    salary: job.salary,
                    education: job.education,
                    year: job.workYear,
                    created: job.createTimeSort,
                    city: city,
                    dist: dist,
                    zone: zone
                });
            }
        }
        mongoose.model('JobModel').insertMany(models, (error) => {
            if (error) {
                Logger.error(`Cannot insert jobs with ${city}-${dist}-${zone}`, error);
            }
        });
    }
};
