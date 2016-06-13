const urlencode = require('urlencode');
const utils = require('./../support/utils.js');
const Logger = require('./../support/log.js');
const Client = require('./../support/client.js');
const Config = require('./../config.js');
const Cache = require('./../db/cache.js');
const Task = require('./task.js');

module.exports = class Crawl {

    constructor() {
        this.cookie = '';
        this.useragent = utils.getUserAgent();
        this.commpanyCache = new Cache();
        this.jobCache = new Cache();
        this.seedTasks = [];
        this._initSeedTasks();
    }

    _initSeedTasks() {
        for (let city of Config.CITIES) {
            let url = 'http://www.lagou.com/jobs/positionAjax.json?city='
                + urlencode.encode(city, 'UTF-8') + '&needAddtionalResult=false';
            this.seedTasks.push(new Task(url));
        }
    }

    start() {
        return this._seedTask().done()
        // .then(() => {
        //     this.jobId = setImmediate(() => {
        //         this._jobTask();
        //     });
        //     this.companyId = setImmediate(() => {
        //         this._companyTask();
        //     });
        // });
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
                options['Referer'] = `http://www.lagou.com/zhaopin/${job}/?labelWords=label`
                options.body = {
                    first: false,
                    pn: pageNum,
                    kd: job
                };
                client.post(task.url, options).then((res) => {
                    let data = res.body;
                    if (data &&
                        data['content'] &&
                        data.content['positionResult'] &&
                        data.content.positionResult['totalCount'] &&
                        data.content.positionResult['pageSize'] &&
                        Array.isArray(data.content.positionResult['result'])) {

                        let r = data.content.positionResult;
                        task.maxPageNum = utils.getMaxPageNum(r.totalCount, r.pageSize);
                        this._saveJobs(r.result);
                    }  else {
                        Logger.fatal('[seedTask]!!!data structure changed!!!', data);
                    }
                }).catch((err) => {
                    Logger.error('[seedTask]' + err);
                });
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
