const request = require('request');
const zlib = require('zlib');

module.exports = class Client {

    static get(url, headers, agent = null) {
        let op = {
            proxy: 'http://112.65.200.211',
            url: url,
            headers: headers,
            gzip: true
        };
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

    static post(url, proxy, headers, data, agent = null) {
        let op = {
            proxy: proxy.url,
            url: url,
            headers: headers,
            form: data,
            gzip: true
        };
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
