let rp = require('request-promise');
import * as utils from './utils';

export class Crawl {

    constructor() {
        this.cookie = '';
        this.useragent = utils.getUserAgent();
        this.urls = utils.getSeedUrls();
    }

    start() {
        let p = new Promise((resolve, reject) => {
            this.useragent;
        });
        return p;
    }

    request(url) {

        rp(url).then();
    }
}