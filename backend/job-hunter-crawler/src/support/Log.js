const fs = require('fs');
const path = require('path');

const mkdirp = require('mkdirp');
const nodemailer = require('nodemailer');

const Config = require('./../config.js');
const getLogDate = require('./../support/Utils.js').getLogDate;
const LogFileError = require('./../exception/LogFileError.js');

module.exports = class Logger {

    static debug(...contents) {
        if (Config.LOG_LEVEL > Config.LOG_TYPE.DEBUG) {
            return;
        }
        console.log(contents.join('\n'));
    }

    static info(content) {
        if (Config.LOG_LEVEL > Config.LOG_TYPE.LOG) {
            return;
        }
        Logger._record(Config.LOG_PATH, '\n[INFO]' + getLogDate() + content);
        if (Config.ENABLE_EMAIL && Config.EMAIL_LOG_LEVEL <= Config.LOG_TYPE.LOG) {
            Logger._email(content);
        }
    }

    static warn(err) {
        if (Config.LOG_LEVEL > Config.LOG_TYPE.WARN) {
            return;
        }
        Logger._record(Config.LOG_PATH, '\n[WARN]' + getLogDate() + Logger._getErrorStack(err));
        if (Config.ENABLE_EMAIL && Config.EMAIL_LOG_LEVEL <= Config.LOG_TYPE.WARN) {
            Logger._email(err.toString());
        }
    }

    static error(err) {
        if (Config.LOG_LEVEL > Config.LOG_TYPE.ERROR) {
            return;
        }
        Logger._record(Config.ERROR_PATH, '\n[ERROR]' + getLogDate() + Logger._getErrorStack(err));
        if (Config.ENABLE_EMAIL && Config.EMAIL_LOG_LEVEL <= Config.LOG_TYPE.ERROR) {
            Logger._email(err.toString());
        }
    }

    static fatal(err) {
        Logger._record(Config.ERROR_PATH, '\n[FATAL]' + getLogDate() + Logger._getErrorStack(err, true));
        Logger._email(err.toString());
        Logger.debug(err);
    }

    static _record(logPath, content) {
        if (!logPath || logPath === '') {
            throw new LogFileError('Illegal log path', logPath);
        }
        fs.access(logPath, fs.F_OK | fs.W_OK, (err) => {
            if (err) {
                if (err.code !== 'ENOENT') {
                    throw new LogFileError(err, logPath);

                } else {
                    Logger._makeLogDir(logPath, Logger._write2File.bind(this, logPath, content));
                }
            } else {
                Logger._write2File(logPath, content)
            }
        });
    }

    static _getErrorStack(e, isFatal = false) {
        if (isFatal) {
            return e.stack;

        } else {
            return e.stack.split('\n').filter((value, index, array) => {
                return index <= Config.RECORD_ERROR_STACK_DEPTH;
            }).join('\n');
        }
    }

    static _write2File(logPath, content) {
        fs.appendFile(logPath, content, 'utf8', (err) => {
            if (err) {
                throw new LogFileError(err, logPath + ' ' + content);
            }
        });
    }

    static _makeLogDir(logPath, cb) {
        let dir = path.dirname(logPath);
        if (dir === '.') {
            cb();

        } else {
            mkdirp(dir, function (err) {
                if (err) {
                    throw new LogFileError(err, logPath);

                } else {
                    cb();
                }
            });
        }
    }

    static _email(content) {
        //TODO send email
    }
};
