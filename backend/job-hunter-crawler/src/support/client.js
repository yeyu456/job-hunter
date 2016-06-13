const requestPromise = require('superagent-promise-plugin');
const request = requestPromise.patch(require('superagent'));

module.exports = class Client {

    get(url, options = {}) {
        let p = request.get(url)
            .set(options);
        this._add(p);
        return this;
    }

    post(url, data, options = {}) {
        let p = request.post(url)
            .send(data)
            .set(options);
        this._add(p);
        return this;
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
        let tmp = this.rlist;
        this.clear();
        return Promise.all(tmp);
    }

    clear() {
        this.rlist = [];
    }
}
