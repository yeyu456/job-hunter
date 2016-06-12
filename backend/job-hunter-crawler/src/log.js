
let nodemailer = require('nodemailer');
import {ENABLE_EMAIL, LOG_PATH, ERROR_PATH, LOG_LEVEL, LogType} from './config';

const output = fs.createWriteStream(LOG_PATH);
const errorOutput = fs.createWriteStream(ERROR_PATH);
const logger = new Console(output, errorOutput);

export default class Logger {

    static log(...content) {
        if (LOG_LEVEL > LogType.LOG) {
            return;
        }
        let str = Logger.getLog(content);
        logger.log(str);
        if (ENABLE_EMAIL) {
            //TODO send email
        }
    }

    static warn(...content) {
        if (LOG_LEVEL > LogType.WARN) {
            return;
        }
        let str = Logger.getLog(content);
        logger.warn(str);
        if (ENABLE_EMAIL) {
            //TODO send email
        }
    }

    static error(...content) {
        if (LOG_LEVEL > LogType.ERROR) {
            return;
        }
        let str = Logger.getLog(content);
        logger.error(str);
        if (ENABLE_EMAIL) {
            //TODO send email
        }
    }

    static fatal(...content) {
        let str = '[fatal]' + Logger.getLog(content);
        logger.error(str);
        if (ENABLE_EMAIL) {
            //TODO send email
        }
        logger.assert(false, str);
    }

    static getLog(...content) {
        return '[' + (new Date()).toString() + ']' + content.join(' ');
    }
}