const request = require('request');
const zlib = require('zlib');

module.exports = class Client {

    static get(url, headers, proxy = null, agent = null) {
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
        return new Promise((resolve, reject) => {
            request.get(op, (error, res, body) => {
                if (!error && res.statusCode === 200) {
                    resolve(body);

                } else {
                    reject(error ||
                        new Error('Response status code:' + res.statusCode));
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
                    reject(error ||
                        new Error('Response status code:' + res.statusCode));
                }
            });
        });
    }
};
