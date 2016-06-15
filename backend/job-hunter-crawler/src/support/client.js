const request = require('request');

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
                    resolve(body);

                } else {
                    reject(error ||
                        new Error('Response status code:' + res.statusCode));
                }
            });
        });
    }

    static post(url, headers, data, agent = null) {
        let op = {
            url: url,
            headers: headers,
            form: data
        };
        //http agent
        if (agent) {
            op.agent = agent;
        }
        return new Promise((resolve, reject)=>{
            request.post(op, (error, res, body)=>{
                if (!error && res.statusCode === 200) {
                    resolve(JSON.parse(body));

                } else {
                    reject(error ||
                        new Error('Response status code:' + res.statusCode));
                }
            });
        });
    }
}
