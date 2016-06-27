const JobCrawl = require('./lagou/JobCrawl.js');
const ProxyCrawl = require('./proxy/ProxyCrawl.js');
const Logger = require('./../support/Log.js');

module.exports = class Crawl {

    constructor() {
        this.job = new JobCrawl();
        this.proxy = new ProxyCrawl();
        //this.company = new CompanyCrawl();
    }

    start() {
        return this.proxy.start().then(this.job.start).then(() => {
            //return this.company.start();

        }).then(this.end.bind(this));
    }

    end() {
        this.job.end();
        //this.company.end();
        Logger.info('crawl end');
    }
};
