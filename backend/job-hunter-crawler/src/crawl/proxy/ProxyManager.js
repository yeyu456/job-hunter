const mongoose = require('mongoose');

const Logger = require('./../../support/Log.js');
const DatabaseError = require('./../../exception/DatabaseError.js');

module.exports = class ProxyManager {

    static getProxies() {
        return new Promise((resolve, reject) => {
            mongoose.model('ProxyModel').find({
                valid: true

            }).sort({used: 1, delay: 1}).exec((error, docs) => {
                if (error) {
                    Logger.error(new DatabaseError(error, 'Failed to get proxy'));
                    reject();

                } else if (!docs) {
                    Logger.error(new DatabaseError('Cannot find any valid proxy'));
                    reject();

                } else {
                    resolve(docs);
                }
            });
        });
    }

    static deleteProxy(proxy) {
        proxy.valid = false;
        mongoose.model('ProxyModel').findOneAndUpdate({
            ip: proxy.ip,
            port: proxy.port,
            type: proxy.type
        }, proxy, (error) => {
            if (error) {
                Logger.error(new DatabaseError(error, `Failed to disable proxy ${proxy.ip}`));
            } else {
                Logger.info(`Disable proxy ${proxy.ip}`);
            }
        });
    }
};