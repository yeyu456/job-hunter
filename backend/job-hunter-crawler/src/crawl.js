const rp = require('request-promise');
import * as utils from './utils';
import Cache from './cache';

export class Crawl {

    constructor() {
        this.cookie = '';
        this.useragent = utils.getUserAgent();
        this.urls = utils.getSeedUrls();
        this.cache = new Cache();
    }

    start() {
        let p = new Promise((resolve, reject) => {
            this.useragent;
        });
        return p;
    }
}
