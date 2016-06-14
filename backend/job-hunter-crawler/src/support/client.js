const requestPromise = require('superagent-promise-plugin');
const request = require('request');

module.exports = class Client {

    get(url, options = {}) {
        let p = request.get(url)
            .set(options);
        this._add(p);
        return this;
    }

    post(url, options, ...data) {
        let op = {
            url: url
        };
        request.post(op, (error, response, body)=>{
            if (!error && response.statusCode == 200) {
                var info = JSON.parse(body);
                console.log(info.stargazers_count + " Stars");
                console.log(info.forks_count + " Forks");
            } else {
                console.log('error request\n');
                console.error(error);
            }
        });
        //this._add(p);
        //return this;
    }

    _add(p){
        if (!this.rlist) {
            this.rlist = [];
        }
        this.rlist.push(p);
    }

    then(callback) {
        let p = this.rlist.pop();
        this.rlist.push(p.then(callback));
        return this;
    }

    catch(callback) {
        let p = this.rlist.pop();
        this.rlist.push(p.catch(callback));
        return this;
    }

    done() {
        return Promise.all(this.rlist);
    }
}
