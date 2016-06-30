const request = require('request');

const Logger = require('./Log.js');
const Utils = require('./Utils.js');
const HttpError = require('./../exception/HttpError.js');

module.exports = class Client {

    static get(url, headers, proxy = null, agent = null) {
        let op = {
            url: url,
            headers: headers,
            gzip: true,
            followRedirect: false
        };
        if (proxy) {
            op.proxy = proxy.url;
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

                } else {
                    reject(new HttpError(error, `Get ${url } with status ${res.statusCode}`));
                }
            });
        });
    }

    static post(url, headers, data, proxy = null, agent = null) {
        let op = {
            url: url,
            headers: headers,
            form: data,
            gzip: true,
            followRedirect: false
        };
        if (proxy) {
            op.proxy = proxy.url;
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
                    reject(new HttpError(error, `Post ${url } with status ${res.statusCode}`));
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
                return;
            }
            request.get(op, (error, res) => {
                if (res) {
                    Logger.info(proxy.url + '\n' + res.headers.location);
                }
                if (!error &&
                    (res.statusCode === 301 || res.statusCode === 302) &&
                    res.headers.location &&
                    res.headers.location.indexOf(keyword) !== -1) {
                    resolve(Date.now() - time);

                } else {
                    reject(error?new HttpError(error, `speed test on ${proxy.url} failed`):null, Date.now() - time);
                }
            });
        });
    }
};
