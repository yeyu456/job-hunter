
const Proxy = require('./Proxy.js');
const Utils = require('./../support/Utils.js');

module.exports = class ProxyManager {

    getProxy(){
        return new Proxy('112.65.200.211', 80, 'http', Utils.getUserAgent());
    }
};