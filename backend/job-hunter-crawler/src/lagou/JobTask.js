
const Task = require('./task.js');

module.exports = class JobTask extends Task {

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
