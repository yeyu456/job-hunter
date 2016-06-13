const nodemailer = require('nodemailer');
const fs = require('fs');
const Config = require('./../config.js');

module.exports = class Logger {

    static log(...content) {
        if (Config.LOG_LEVEL > Config.LogType.LOG) {
            return;
        }
        let str = Logger.getLog(content);
        console.log(str);
        fs.appendFileSync(Config.LOG_PATH, '[LOG]' + str, (err) => {
            if (err) {
                throw err;
            }
        });
        if (Config.ENABLE_EMAIL) {
            //TODO send email
        }
    }

    static warn(...content) {
        if (Config.LOG_LEVEL > Config.LogType.WARN) {
            return;
        }
        let str = Logger.getLog(content);
        console.log(str);
        fs.appendFileSync(Config.LOG_PATH, '[WARN]' + str, (err) => {
            if (err) {
                throw err;
            }
        });
        if (Config.ENABLE_EMAIL) {
            //TODO send email
        }
    }

    static error(...content) {
        if (Config.LOG_LEVEL > Config.LogType.ERROR) {
            return;
        }
        let str = Logger.getLog(content);
        console.log(str);
        fs.appendFileSync(Config.ERROR_PATH, '[ERROR]' + str, (err) => {
            if (err) {
                throw err;
            }
        });
        if (Config.ENABLE_EMAIL) {
            //TODO send email
        }
    }

    static fatal(...content) {
        let str = '[FATAL]' + Logger.getLog(content);
        console.log(str);
        fs.appendFileSync(Config.ERROR_PATH, str, (err) => {
            if (err) {
                throw err;
            }
        });
        if (Config.ENABLE_EMAIL) {
            //TODO send email
        }
        logger.assert(false, str);
    }

    static getLog(...content) {
        let log = '[' + (new Date()).toString() + ']';
        for (let c of content) {
            if (Object.prototype.toString.call(c) === '[object Object]') {
                log += ' ' + JSON.stringify(c);
            } else {
                log += ' ' + c.toString();
            }
        }
        return log;
    }
}
