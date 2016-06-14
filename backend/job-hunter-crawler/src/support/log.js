const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const Config = require('./../config.js');

module.exports = class Logger {

    static log(...content) {
        if (Config.LOG_LEVEL > Config.LogType.LOG) {
            return;
        }
        let str = Logger.getLog('[LOG]', content);
        Logger.record(Config.LOG_PATH, str);
        console.log(str);
        if (Config.ENABLE_EMAIL) {
            //TODO send email
        }
    }

    static warn(...content) {
        if (Config.LOG_LEVEL > Config.LogType.WARN) {
            return;
        }
        let str = Logger.getLog('[WARN]', content);
        Logger.record(Config.LOG_PATH, str);
        console.log(str);
        if (Config.ENABLE_EMAIL) {
            //TODO send email
        }
    }

    static error(...content) {
        if (Config.LOG_LEVEL > Config.LogType.ERROR) {
            return;
        }
        let str = Logger.getLog('[ERROR]', content);
        Logger.record(Config.ERROR_PATH, str);
        console.log(str);
        if (Config.ENABLE_EMAIL) {
            //TODO send email
        }
    }

    static fatal(...content) {
        let str = Logger.getLog('[FATAL]', content);
        Logger.record(Config.ERROR_PATH, str);
        console.log(str);
        if (Config.ENABLE_EMAIL) {
            //TODO send email
        }
        //process.exit(2);
    }

    static getLog(logLv, ...content) {
        let log = logLv + '[' + (new Date()).toString() + ']';
        for (let c of content) {
            if (Object.prototype.toString.call(c) === '[object Object]') {
                log += ' ' + JSON.stringify(c);
            } else {
                log += ' ' + c.toString();
            }
        }
        return log;
    }

    static record(logPath, content) {
        return;
        // if (!logPath || logPath === '') {
        //     throw new Error('Illegal log path ' + logPath);
        // }
        // fs.access(logPath, fs.F_OK | fs.W_OK, (err) => {
        //     if (err) {
        //         if (err.code === 'ENOENT') {
        //             let dir = path.dirname(logPath);
        //             if (dir === '.') {
        //                 fs.appendFileSync(logPath, content);
        //
        //             } else {
        //                 mkdirp(dir, function (err) {
        //                     if (err) {
        //                         throw new Error(JSON.stringify(err));
        //                     } else {
        //                         fs.appendFileSync(logPath, content);
        //                     }
        //                 });
        //             }
        //         } else {
        //             throw new Error(JSON.stringify(err));
        //         }
        //     } else {
        //         fs.appendFileSync(logPath, content);
        //     }
        // });
    }
}
