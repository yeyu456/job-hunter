const Proxy = require('./../support/Proxy.js');

module.exports = class BaseTask {

    constructor() {
        this._startPageNum = 1;
        this._maxPageNum = 1;
        this._url = null;
        this._cookies = null;
        this._useragent = null;
        this._proxy = null;
    }

    get maxPageNum() {
        return this._maxPageNum;
    }

    set maxPageNum(num) {
        this._maxPageNum = num;
    }

    get startPageNum() {
        if (this._startPageNum > this._maxPageNum) {
            return null;
        } else {
            let tmp = this._startPageNum;
            this._startPageNum++;
            return tmp;
        }
    }

    set startPageNum(num) {
        if (num < 1) {
            return;
        }
        this._startPageNum = num;
    }

    get url() {
        return this._url;
    }

    set url(url) {
        if (url) {
            this._url = url;
        }
    }

    get cookies() {
        return this._cookies;
    }

    set cookies(cookies) {
        if (cookies) {
            this._cookies = cookies;
        }
    }

    get proxy() {
        return this._proxy;
    }

    set proxy(proxyObj) {
        if (proxyObj && proxyObj instanceof Proxy) {
            this._proxy = proxyObj;
        }
    }
}
