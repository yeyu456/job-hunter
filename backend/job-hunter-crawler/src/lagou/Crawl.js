const JobCrawl = require('./JobCrawl.js');

module.exports = class Crawl {

    constructor() {
        this.job = new JobCrawl();
        this.company = new CompanyCrawl();
    }

    start() {
        return this.job.start().then(() => {
            return this.company.start();
        });
    }

    end() {
        this.job.end();
        this.company.end();
        Logger.log('crawl end');
    }

    _saveCompany(company) {

    }

    _companyTask() {

    }
}
