const EventEmitter = require('events');
const Config = require('./../config.js');

module.exports = class Cache {

    constructor() {
        this.cache = Object.create(null);
        this.hitCount = 0;
        this.missCount = 0;
        this.size = 0;
        this._initCleaner();
    }

    _initCleaner() {
        this.emitter = new EventEmitter();
        this.emitter.on('clean', () => {
            if (this.cleanId) {
                clearImmediate(this.cleanId);
            }
            this.cleanId = setImmediate(() => {
                let date = Date.now();
                for (let k in this.cache) {
                    if (this.cache[k].expire < date) {
                        this.del(k);
                    }
                }
                this.cleanId = null;
            });
        });
    }

    put(key, value) {
        let record = this.cache[key];
        if (!record) {
            this.size++;
        }
        record = {
            value: value,
            expire: Date.now() + Config.CACHE_TIME,
            hit: 0
        };
        this.cache[key] = record;
        if (this.size() > Config.CACHE_CLEAN_TRESHOLD) {
            this.emitter.emit('clean');
        }
    }

    del(key) {
        let record = this.cache[key];
        if (record) {
            this.size--;
            delete this.cache[key];
            return true;
        } else {
            return false;
        }
    }

    clear() {
        clearImmediate(this.cleanId);
        this.cleanId = null;
        this.size = 0;
        this.cache = Object.create(null);
        this.hitCount = 0;
        this.missCount = 0;
    }

    get(key) {
        let data = this.cache[key];
        if (data) {
            data.hit++;
            data.expire = Date.now() + Config.CACHE_TIME;
            this.hitCount++;
            //return a copy
            let value = JSON.parse(JSON.stringify(data.value));
            return value;
        } else {
            this.missCount++;
            return null;
        }
    }

    keys() {
        return Object.keys(cache);
    }

    size() {
        return this.size;
    }
}
