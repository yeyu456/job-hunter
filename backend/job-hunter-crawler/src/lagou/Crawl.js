const urlencode = require('urlencode');
const Utils = require('./../support/Utils.js');
const Logger = require('./../support/Log.js');
const Client = require('./../support/Client.js');
const Config = require('./../config.js');
const Cache = require('./../db/Cache.js');
const JobTask = require('./JobTask.js');

module.exports = class Crawl {

    constructor() {
        this._initSeedTasks();
    }

    _initSeedTasks() {
        this.seedTasks = [];
        this.failedTasks = [];
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

    start() {
        return new Promise((resolve, reject) => {
            this._seedTask().then(() => {
                resolve();
            }).catch((err)=>{
                reject(err);
            });
        });
    }

    end() {
        Logger.log('crawl end');
    }

    _seedTask() {
        let tasks = [];
        for (let task of this.seedTasks) {
            tasks.push(new Promise((resolve, reject) => {
                setTimeout(this._onTask.bind(this, task, resolve, reject),
                    Config.TASK_INTERVAL);
            }));
        }
        return Promise.all(tasks);
    }

    _onTask(task, resolve, reject) {
        let options = JSON.parse(Config.DEFAULT_LAGOU_POST_HEADERS);
        options['Accept'] = Config.ACCEPT_JSON;
        options['Referer'] = 'http://www.lagou.com/jobs/list_' +
            task.job + '?px=new&city=' + urlencode.encode(task.city, 'utf8');
        options['Host'] = 'www.lagou.com';
        let data = {
            first : false,
            pn : task.startPageNum,
            kd : task.job
        };
        Client.post(task.url, options, data).then((data) => {
            task.maxPageNum = this._getMaxPageNum(data);
            this._saveJobs(data['content']['positionResult']['result']);
            resolve();

        }).catch((err) => {
            Log.error(err);
            this.failedTasks.push(task);
            reject();
        });
    }

    _getMaxPageNum(data) {
        if (data &&
            data.hasOwnProperty('content') &&
            data['content'].hasOwnProperty('positionResult') &&
            data['content']['positionResult'].hasOwnProperty('totalCount') &&
            data['content']['positionResult'].hasOwnProperty('pageSize') &&
            data['content']['positionResult'].hasOwnProperty('result')) {
            return Utils.getMaxPageNum(
                data['content']['positionResult']['totalCount'],
                data['content']['positionResult']['pageSize']
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
            Logger.log(job, '\n');
        }
    }

    _saveCompany(company) {

    }

    _jobTask() {

    }

    _companyTask() {

    }
}
