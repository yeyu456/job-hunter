
export default class Cache {

    constructor() {
        this.cache = Object.create(null);
        this.hitCount = 0;
        this.missCount = 0;
        this.size = 0;
    }

    put(key, value, time, timeoutCallback) {
        if (debug) {
            console.log('caching: %s = %j (@%s)', key, value, time);
        }

        if (typeof time !== 'undefined' && (typeof time !== 'number' || isNaN(time) || time <= 0)) {
            throw new Error('Cache timeout must be a positive number');
        } else if (typeof timeoutCallback !== 'undefined' && typeof timeoutCallback !== 'function') {
            throw new Error('Cache timeout callback must be a function');
        }

        let oldRecord = this.cache[key];
        if (oldRecord) {
            clearTimeout(oldRecord.timeout);
        } else {
            size++;
        }
        let record = {
            value: value,
            expire: time + Date.now()
        };

        if (!isNaN(record.expire)) {
            record.timeout = setTimeout(function() {
                _del(key);
                if (timeoutCallback) {
                    timeoutCallback(key, value);
                }
            }, time);
        }
        cache[key] = record;
        return value;
    }

    del(key) {
        let canDelete = true;
        let oldRecord = cache[key];
        if (oldRecord) {
            clearTimeout(oldRecord.timeout);
            if (!isNaN(oldRecord.expire) && oldRecord.expire < Date.now()) {
                canDelete = false;
            }
        } else {
            canDelete = false;
        }
        if (canDelete) {
            _del(key);
        }
        return canDelete;
    }

    _del(key) {
        size--;
        delete cache[key];
    }

    clear() {
        for (let key in cache) {
            clearTimeout(cache[key].timeout);
        }
        size = 0;
        cache = Object.create(null);
        if (debug) {
            hitCount = 0;
            missCount = 0;
        }
    }

    get(key) {
        let data = cache[key];
        if (typeof data !== 'undefined') {
            if (isNaN(data.expire) || data.expire >= Date.now()) {
                if (debug) hitCount++;
                return data.value;
            } else {
                // free some space
                if (debug) missCount++;
                size--;
                delete cache[key];
            }
        } else if (debug) {
            missCount++;
        }
        return null;
    }

    keys() {
        return Object.keys(cache);
    }

    size() {
        return this.size;
    }
}