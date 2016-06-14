const urlencode = require('urlencode');
const utils = require('./../support/utils.js');
const Logger = require('./../support/log.js');
const Client = require('./../support/client.js');
const Config = require('./../config.js');
const Cache = require('./../db/cache.js');
const JobTask = require('./JobTask.js');

module.exports = class Crawl {

    constructor() {
        this.seedTasks = [];
        this._initSeedTasks();
    }

    _initSeedTasks() {
        for (let city of Config.CITIES) {
            for (let job of Config.JOB_TYPES) {
                let url = Config.CITY_URL + urlencode.encode(city, 'UTF-8') +
                    Config.CITY_URL_POSTFIX;
                let task = new JobTask();
                task.url = url;
                task.job = job;
                task.city = city;
                this.seedTasks.push(task);
            }
        }
    }

    start() {
        return new Promise((resolve, reject) => {
            try {
                this._seedTask();
                resolve();
            } catch (e) {
                reject(e);
            }
        });
    }

    end() {
        if (this.jobId) {
            clearImmediate(this.jobId);
        }
        if (this.companyId) {
            clearImmediate(this.companyId);
        }
        if (this.client) {
            this.client.clear();
        }
        Logger.log('crawl end');
    }

    _seedTask() {
        let client = new Client();
        for (let job of Config.JOB_TYPES) {
            for (let task of this.seedTasks) {
                let pageNum = task.startPageNum;
                let options = JSON.parse(Config.DEFAULT_HEADERS);
                options['Accept'] = Config.ACCEPT_JSON;
                options['User-Agent'] = this.useragent;
                options['Referer'] = ``
                let data = [
                    'first=false',
                    `pn=${pageNum}`,
                    `kd=${job}`
                ];
                client.post(task.url, options, data);
                return;

                // client.post(task.url, options, data).then((res) => {
                //     let data = res.body;
                //     if (data &&
                //         data['content'] &&
                //         data.content['positionResult'] &&
                //         data.content.positionResult['totalCount'] &&
                //         data.content.positionResult['pageSize'] &&
                //         Array.isArray(data.content.positionResult['result'])) {
                //
                //         let r = data.content.positionResult;
                //         task.maxPageNum = utils.getMaxPageNum(r.totalCount, r.pageSize);
                //         this._saveJobs(r.result);
                //     } else {
                //         Logger.fatal('[seedTask]!!!data structure changed!!!', data);
                //     }
                // }).catch((err) => {
                //     Logger.error('[seedTask]' + JSON.stringify(err));
                // });
            }
        }
        return client;
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
