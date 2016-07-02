const mongoose = require('mongoose');
const async = require('async');
const cheerio = require('cheerio');

const CrawlConfig = require('./../../crawl.config.js');
const Logger = require('./../../support/Log.js');
const Client = require('./../../support/Client.js');
const Utils = require('./../../support/Utils.js');

const HttpError = require('./../../exception/HttpError.js');
const ProxyError = require('./../../exception/ProxyError.js');
const ProxyDataError = require('./../../exception/ProxyDataError.js');
const DatabaseError = require('./../../exception/DatabaseError.js');

module.exports = class ProxyCrawl {

    start() {
        Logger.info('start proxy crawl');
        return this._updateOldProxies().then(() => {
            return new Promise((resolve) => {
                this._crawl(resolve);
            });
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
        async.each(urls, (url, cb) => {
            let headers = JSON.parse(CrawlConfig.DEFAULT_LAGOU_GET_HEADERS);
            headers['User-Agent'] = Utils.getUserAgent();
            Client.get(url, headers).then((body) => {
                let proxies = this._parse(body);
                if (proxies.length === 0) {
                    Logger.warn(`No proxy data in ${url}`);

                } else {
                    return this._speedMesure(proxies);
                }

            }).then(() => {
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
        $('#ip_list tr').each((index, element) => {
            if (index === 0) {
                return;
            }
            let children = $(element).find('td');
            if (children.length === 10) {
                let ip = children.get(1).children[0].data;
                if (!Utils.isValidIP(ip)) {
                    Logger.error(new ProxyDataError(`Invalid proxy ip ${ip}`));
                    return;
                }
                let port = parseInt(children.get(2).children[0].data);
                if (!Number.isInteger(port)) {
                    Logger.error(new ProxyDataError(`Invalid proxy port ${port}`));
                    return;
                }
                let type = children.get(5).children[0].data;
                if (!Utils.isValidProxyType(type)) {
                    Logger.error(new ProxyDataError(`Invalid proxy type ${type}`));
                    return;
                }
                proxies.push({
                    ip: ip,
                    port: port,
                    type: type.toLowerCase(),
                    used: 0,
                    useragent: Utils.getUserAgent(),
                    updated: Date.now()
                });
            } else {
                Logger.error(new ProxyDataError('Proxy data structure changed with len ' + children.length));
            }
        });
        return proxies;
    }

    _speedMesure(proxies) {
        return new Promise((resolve) => {
            let headers = JSON.parse(CrawlConfig.DEFAULT_LAGOU_GET_HEADERS);
            headers['User-Agent'] = Utils.getUserAgent();
            async.each(proxies, (proxy, cb) => {
                Client.speed(CrawlConfig.SPEED_TEST_URL, headers, proxy, CrawlConfig.SPEED_KEYWORD, CrawlConfig.SPEED_TIMEOUT).then((delay) => {
                    proxy.valid = true;
                    proxy.delay = delay;

                }).catch((err) => {
                    if (err) {
                        Logger.error(err);
                    }
                    proxy.valid = false;
                    proxy.delay = Number.MAX_SAFE_INTEGER;

                }).then(() => {
                    mongoose.model('ProxyModel').findOneAndUpdate({
                        ip:proxy.ip,
                        port:proxy.port,
                        type:proxy.type

                    }, proxy, { upsert: true }, (err) => {
                        if (err) {
                            Logger.error(new DatabaseError(err, `Cannot update proxy ${proxy.ip}`));
                        }
                        cb();
                    });
                });
            }, (err) => {
                if (err) {
                    Logger.error(new ProxyError(err));
                }
                resolve();
            });
        });
    }

    _updateOldProxies() {
        return new Promise((resolve) => {
            mongoose.model('ProxyModel').find().exec((error, docs) => {
                if (error) {
                    Logger.warn(new DatabaseError(error, 'Cannot get any old proxies.'));
                    resolve([]);

                } else {
                    resolve(docs);
                }
            });
        }).then((proxies) => {
            return this._speedMesure(proxies);
        });
    }
};