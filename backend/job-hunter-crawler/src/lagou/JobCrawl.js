const EventEmitter = require('events');

const urlencode = require('urlencode');

const Utils = require('./../support/Utils.js');
const Logger = require('./../support/Log.js');
const Client = require('./../support/Client.js');
const Config = require('./../config.js');
const Cache = require('./../db/Cache.js');
const JobTask = require('./JobTask.js');

module.exports = class JobCrawl {

    constructor() {
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
                let url = Config.MOBILE_CITY_URL + urlencode.encode(city, 'utf8') +
                    Config.MOBILE_CITY_URL_POSTFIX + job;
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
                setTimeout(this._onTask.bind(this, this.seedTasks[index], resolve, reject),
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
        if (this.seedTasks.length === 0) {
            this._endNewTask(id);
            return;
        }
        let index = Utils.getRandomInt(0, this.seedTasks.length);
        let task = this.seedTasks[index];
        this.seedTasks.splice(index, 1);
        this._onTask(task, () => {
            setTimeout(this._startNewTask.bind(this, id),
                Config.TASK_INTERVAL * id)

        }, () => {
            this._endNewTask(id);
        });
    }

    _endNewTask(id) {
        this.curJobTask--;
        this.jobEvent.emit('endJobTask', id);
    }

    _onTask(task, resolve, reject) {
        let startPageNum = task.startPageNum;
        if (!startPageNum) {
            console.log('finish task ' + task.city + ' ' + task.job);
            resolve();
            return;
        }

        let options = JSON.parse(Config.MOBILE_LAGOU_GET_HEADERS);
        options['Referer'] = Config.MOBILE_CITY_REF;
        Client.get(task.url + '&pageNo=' + startPageNum, options).then((data) => {
            data = JSON.parse(data);
            task.maxPageNum = this._getMaxPageNum(data);
            console.log('save job ' + task.city + ' ' + task.job + ' ' +
                startPageNum + '/' + data['content']['data']['page']['pageNo']);
            this._saveJobs(data['content']['data']['page']['result']);
            this.seedTasks.push(task);
            resolve();

        }).catch((err) => {
            console.error(err);
            this.failedTasks.push(task);
            reject();
        });
    }

    _getMaxPageNum(data) {
        if (data &&
            data.hasOwnProperty('content') &&
            data['content'].hasOwnProperty('data') &&
            data['content']['data'].hasOwnProperty('page') &&
            data['content']['data']['page'].hasOwnProperty('pageSize') &&
            data['content']['data']['page'].hasOwnProperty('totalCount') &&
            data['content']['data']['page'].hasOwnProperty('result')) {
            return Utils.getMaxPageNum(
                data['content']['data']['page']['totalCount'],
                data['content']['data']['page']['pageSize']
            );

        } else {
            throw new Error('!!!data structure changed!!!');
        }
    }

    _saveJobs(jobs) {
        if (jobs.length <= 0) {
            return;
        }
        for (let job of jobs) {
            Logger.log(job);
        }
    }
}
