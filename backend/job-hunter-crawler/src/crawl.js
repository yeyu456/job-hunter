const urlencode = require('urlencode');
import * as utils from './support/utils';
import Client from './support/client';
import {CITIES, JOB_TYPES} from './config';
import Cache from './cache';
import Logger from './log';
import Task from './task';

export class Crawl {

    constructor() {
        this.cookie = '';
        this.useragent = utils.getUserAgent();
        this.commpanyCache = new Cache();
        this.jobCache = new Cache();

        this.client = new Client();
        this.seedTasks = [];
        this._initSeedTasks();
    }

    _initSeedTasks() {
        for (let city of CITIES) {
            let url = 'http://www.lagou.com/jobs/positionAjax.json?city='
                + urlencode.encode(city, 'UTF-8') + '&needAddtionalResult=false';
            this.seedTasks.push(new Task(url));
        }
    }

    start() {
        this._seedTask();
        this.client.done().then(() => {
            this.jobId = setImmediate(() => {
                this._jobTask();
            });
            this.companyId = setImmediate(() => {
                this._companyTask();
            });
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
    }

    _seedTask() {
        for (let job of JOB_TYPES) {
            for (let task of this.seedTasks) {
                let options = {
                    body: {
                        first: false,
                        pn: task.startPageNum,
                        kd: job
                    }
                }
                this.client.post(task.url, options).then((res) => {
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

                    } else {
                        Logger.fatal('!!!data struction changed!!!', data);
                    }

                }).catch((err) => {
                    //do something to makeup
                    Logger.error('')
                });
            }
        }
    }

    _saveJobs(jobs) {
        if (jobs.length <= 0) {
            return;
        }
        for (let job of jobs) {
            
        }
    }

    _saveCompany(company) {

    }

    _jobTask() {

    }

    _companyTask() {

    }
}
