
const Utils = require('./../support/Utils.js');

module.exports = class Proxy {

    constructor(ip, port, type, useragent) {
        this._ip = ip;
        this._port = port;
        this._type = type;
        this.useragent = useragent;
    }

    set ip(value) {
        if (Utils.isValidIP(value)) {
            this._ip = value;
        }
    }

    get ip() {
        return this._ip;
    }

    set port(value) {
        if (Number.isInteger(value) && value > 0 && value < 65535) {
            this._port = value;
        }
    }

    get port() {
        return this._port;
    }

    set type(value) {
        if (value === 'http' || value === 'https') {
            this._type = value;
        }
    }

    get type() {
        return this._type;
    }

    get useragent() {
        return this._useragent;
    }

    set useragent(value) {
        this._useragent = value;
    }

    get url() {
        return this._type + '//' + this._ip + ':' + this._port === 80? '': this._port;
    }
};
