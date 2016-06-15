const BaseTask = require('./BaseTask.js');

module.exports = class JobTask extends BaseTask {

    get city() {
        return this._city;
    }

    set city(name) {
        if (name) {
            this._city = name;
        }
    }

    get job() {
        return this._job;
    }

    set job(name) {
        if (name) {
            this._job = name;
        }
    }
}
