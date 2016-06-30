const mongoose = require('mongoose');

const Logger = require('./../../support/Log.js');
const DatabaseError = require('./../../exception/DatabaseError.js');

module.exports = class ProxyManager {

    static getMostFastProxy() {
        return new Promise((resolve, reject) => {
            mongoose.model('ProxyModel').findOneAndUpdate({
                valid: true

            }, { $inc: { used: 1 }}, { sort: { used: 1, delay: 1 }, new: true }, (error, doc) => {
                if (error) {
                    Logger.error(new DatabaseError(error, 'Failed to get proxy'));
                    reject();

                } else if (!doc) {
                    Logger.error(new DatabaseError('Cannot find any valid proxy'));
                    reject();

                } else {
                    resolve(doc);
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