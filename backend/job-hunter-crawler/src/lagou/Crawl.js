const JobCrawl = require('./JobCrawl.js');
const Logger = require('./../support/Log.js');

module.exports = class Crawl {

    constructor() {
        this.job = new JobCrawl();
        //this.company = new CompanyCrawl();
    }

    start() {
        return this.job.start().then(() => {
            //return this.company.start();

        }).then(this.end.bind(this));
    }

    end() {
        this.job.end();
        //this.company.end();
        Logger.info('crawl end');
    }
};
