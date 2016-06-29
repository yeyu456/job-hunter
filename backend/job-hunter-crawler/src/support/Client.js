const request = require('request');
const zlib = require('zlib');

const HttpError = require('./../exception/HttpError.js');

module.exports = class Client {

    static get(url, headers, proxy = null, agent = null) {
        let op = {
            url: url,
            headers: headers,
            gzip: true
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
            gzip: true
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

    static speed(url, headers, proxy) {
        let op = {
            url: url,
            headers: headers,
            proxy: proxy.url
        };
        let time = Date.now();
        return new Promise((resolve, reject) => {
            request.get(op, (error) => {
                if (!error && res.statusCode === 200) {
                    resolve(null, Date.now() - time);

                } else {
                    reject(error, Date.now() - time);
                }
            });
        });
    }
};
