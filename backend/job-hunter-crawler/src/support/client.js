const request = require('request');
const zlib = require('zlib');

module.exports = class Client {

    static get(url, headers, agent = null) {
        let op = {
            url: url,
            headers: headers
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
                    Client.dealWithCompat(res.headers['content-encoding'],
                        body, resolve, reject);

                } else {
                    reject(error ||
                        new Error('Response status code:' + res.statusCode));
                }
            });
        });
    }

    static post(url, headers, data, agent = null) {
        let op = {
            //proxy: 'http://112.65.200.211',
            url: url,
            headers: headers,
            form: data
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
                    Client.dealWithCompat(res.headers['content-encoding'],
                        body, resolve, reject);

                } else {
                    reject(error ||
                        new Error('Response status code:' + res.statusCode));
                }
            });
        });
    }

    static dealWithCompat(encoding, data, resolve, reject){
        let buffer = new Buffer(data);
        if (encoding === 'gzip') {
            zlib.gunzip(buffer, (err, decoded) => {
                if (err || !decoded) {
                    reject(err || new Error('Empty body.'));

                } else {
                    resolve(decoded);
                }
            });
        } else if (encoding === 'deflate') {
            zlib.inflate(buffer, (err, decoded) => {
                if (err || !decoded) {
                    reject(err || new Error('Empty body.'));

                } else {
                    resolve(decoded);
                }
            })
        } else {
            resolve(data);
        }
    }
}
