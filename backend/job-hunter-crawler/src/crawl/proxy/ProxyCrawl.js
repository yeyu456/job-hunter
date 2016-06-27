
const async = require('async');
const cheerio = require('cheerio');

const CrawlConfig = require('./../../crawl.config.js');
const Logger = require('./../../support/Log.js');
const Client = require('./../../support/Client.js');
const Utils = require('./../../support/Utils.js');
const HttpError = require('./../../exception/HttpError.js');
const ProxyError = require('./../../exception/ProxyError.js');
const ProxyDataError = require('./../../exception/ProxyDataError.js');

module.exports = class ProxyCrawl {

    start() {
        return new Promise((resolve) => {
            this._crawl(resolve);
        });
    }

    _crawl(resolve) {
        let urls = [];
        urls.push(CrawlConfig.PROXY_NORMAL_URL);
        urls.push(CrawlConfig.PROXY_HIGH_ANONYMOUS_URL);
        for(let i=2;i<=CrawlConfig.PROXY_CRAWL_PAGE_NUM;i++) {
            urls.push((CrawlConfig.PROXY_NORMAL_URL + '/' + i));
            urls.push((CrawlConfig.PROXY_HIGH_ANONYMOUS_URL + '/' + i));
        }
        async.forEachOf(urls, (url, key, cb) => {
            Client.get(url, JSON.parse(CrawlConfig.DEFAULT_LAGOU_GET_HEADERS)).then((body) => {
                this._parse(body);
                cb();

            }).catch((err) => {
                Logger.error(new HttpError(err, `Failed to crawl proxy url ${url}`));
                cb();
            });

        }, (err) => {
            if (err) {
                Logger.error(new ProxyError(err));
            }
            resolve();
        });
    }

    _parse(body) {
        let $ = cheerio.load(body);
        let proxies = [];
        $('#ip_list tr').each((i) => {
            if (i === 0) {
                return;
            } else {
                let children = $(this).find('td');
                if (children.length === 10) {
                    let ip = children.get(1);
                    if (!Utils.isValidIP(ip)) {
                        Logger.error(new ProxyDataError(`Invalid proxy ip ${ip}`));
                        return;
                    }
                    let port = children.get(2);
                    if (!Number.isInteger(port)) {
                        Logger.error(new ProxyDataError(`Invalid proxy port ${port}`));
                        return;
                    }
                    let type = children.get(5);
                    if (!Utils.isValidProxyType(type)) {
                        Logger.error(new ProxyDataError(`Invalid proxy type ${type}`));
                        return;
                    }
                    proxies.push({
                        ip: ip,
                        port: port,
                        type: type.toLowerCase()
                    });
                } else {
                    Logger.error(new ProxyDataError('Proxy data structure changed with len ' + children.length));
                }
            }
        });
    }
};