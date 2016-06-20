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
const JobTask = require('./JobTask.js');

module.exports = class JobCrawl {

    constructor() {
        this.ws = new ws.Server({port : 8080});
        this.ws.on('message', function incoming(message) {
            console.log('received: %s', message);
        });
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
        this._initSeedTasks();
        this.jobEvent = new EventEmitter();
        this.curJobTask = 0;
    }

    start() {
        return new Promise((resolve, reject) => {
            console.log('seed job task');
            this._seedTask().then(() => {
                console.log('job task');
                return this._jobTask();

            }).catch((err)=>{
                reject(err);

            }).then(() => {
                this.end();
            });
        });
    }

    end() {
        Logger.log('job crawl end');
    }

    _initSeedTasks() {
        this.seedTasks = [];
        this.failedTasks = [];
        this.jobTaskIds = [];
        for (let city of Config.CITIES) {
            for (let job of Config.JOB_TYPES) {
                let url = Config.CITY_URL + urlencode.encode(city, 'utf8') +
                    Config.CITY_URL_POSTFIX;
                let task = new JobTask();
                task.url = url;
                task.job = job;
                task.city = city;
                task.useragent = Utils.getUserAgent();
                this.seedTasks.push(task);
            }
        }
    }

    _seedTask() {
        let tasks = [];
        for (let index in this.seedTasks) {
            tasks.push(new Promise((resolve, reject) => {
                setTimeout(this._onTask.bind(this, index, resolve, reject),
                    Config.TASK_INTERVAL * index);
            }));
        }
        return Promise.all(tasks);
    }

    _jobTask() {
        for(let i=0;i<Config.CONCURRENT_TASK_NUM;i++) {
            this.curJobTask++;
            setTimeout(this._startNewTask.bind(this, i),
                Config.TASK_INTERVAL * i);
        }
        return new Promise((resolve, reject) => {
            this.jobEvent.on('endJobTask', (i) => {
                if (this.curJobTask <= 0) {
                    resolve();
                } else {
                    console.log('finsih job task ' + i);
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
                moreDelay += Config.TASK_INTERVAL * this.failedTasks.length;

            } else {
                this._endNewTask(id);
                return;
            }
        } else {
            index = Utils.getRandomInt(0, this.seedTasks.length);
        }
        this._onTask(index, () => {
            setTimeout(this._startNewTask.bind(this, id),
                Config.TASK_INTERVAL * id + moreDelay);

        }, () => {
            this._endNewTask(id);
        });
    }

    _endNewTask(id) {
        this.curJobTask--;
        this.jobEvent.emit('endJobTask', id);
    }

    _onTask(taskIndex, resolve, reject) {
        let task = this.seedTasks[taskIndex];
        if (!task) {
            console.log('No such task with index ' + taskIndex + ' len:' + this.seedTasks.length);
            resolve();
            return;
        } else {
            this.seedTasks.splice(taskIndex, 1);
        }
        let startPageNum = task.startPageNum;
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
                console.error('wrong page number' + startPageNum + ' ' + data['content']['pageNo']);
                console.log(data);
                let args = [path.join(__dirname, '..', 'phantomjs', 'LagouJob.js')];
                childProcess.execFile(phantomjs.path, args, (err, stdout, stderr) => {});
                this.failedTasks.push(task);
                resolve();
                return;

            } else {
                task.maxPageNum = this._getMaxPageNum(data);
                this._saveJobs(data['content']['positionResult']['result']);
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
                throw new Error('!!!data structure changed!!!' + data.content.positionResult);
            }
        } else {
            throw new Error('No data');
        }
    }

    _saveJobs(jobs) {
        if (jobs.length <= 0) {
            return;
        }
        for (let job of jobs) {
            
        }
    }
}
