const request = require('request');

const Logger = require('./Log.js');
const Utils = require('./Utils.js');
const HttpError = require('./../exception/HttpError.js');
const ProxyError = require('./../exception/ProxyError.js');
const UrlMovedError = require('./../exception/UrlMovedError.js');

module.exports = class Client {

    static get(url, headers, proxy = null, agent = null) {
        let op = {
            url: url,
            headers: headers,
            gzip: true,
            followRedirect: false
        };
        if (proxy) {
            op.proxy = Utils.getProxyUrl(proxy);
        }
        //http agent
        if (agent) {
            op.agent = agent;
        }
        //disable cache
        op.headers['Pragma'] = 'no-cache';
        return new Promise((resolve, reject) => {
            request.get(op, (error, res, body) => {
                if (!error && res.statusCode === 200) {
                    resolve(body);

                } else if (res.statusCode === 301) {
                    reject(new UrlMovedError(error, `Get ${url} not exist`));

                } else {
                    reject(new HttpError(error, `Get ${url} failed`));
                }
            });
        });
    }

    static post(url, headers, data, proxy = null, connTimeOut = null, agent = null) {
        let op = {
            url: url,
            headers: headers,
            form: data,
            gzip: true,
            followRedirect: false
        };
        if (proxy) {
            op.proxy = Utils.getProxyUrl(proxy);
        }
        if (connTimeOut) {
            op.timeout = connTimeOut;
        }
        //http agent
        if (agent) {
            op.agent = agent;
        }
        //disable cache
        op.headers['Pragma'] = 'no-cache';
        return new Promise((resolve, reject)=>{
            request.post(op, (error, res, body)=>{
                if (!error && res.statusCode === 200) {
                    resolve(body);

                } else {
                    reject(new HttpError(error, `Post ${url} failed`));
                }
            });
        });
    }

    static speed(url, headers, proxy, keyword, connTimeOut) {
        let proxyUrl = Utils.getProxyUrl(proxy);
        let op = {
            url: url,
            headers: headers,
            proxy: proxyUrl,
            followRedirect: false
        };
        if (connTimeOut) {
            op.timeout = connTimeOut;
        }
        let time = Date.now();
        return new Promise((resolve, reject) => {
            if (!proxyUrl) {
                reject(new Error(`Invalid proxy url ${proxyUrl}`));
            }
            request.get(op, (error, res) => {
                if (res) {
                    Logger.info(proxyUrl + '\n' + res.headers.location);
                }
                if (error) {
                    reject(new HttpError(error, `speed test on ${proxyUrl} failed`));

                } else if ((res.statusCode !== 301 && res.statusCode !== 302) ||
                    !res.headers.location ||
                    res.headers.location.indexOf(keyword) === -1) {

                    reject(new ProxyError(`Invalid proxy ${proxyUrl}`));

                } else {
                    resolve(Date.now() - time);
                }
            });
        });
    }
};
