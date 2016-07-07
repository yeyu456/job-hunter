const path = require('path');

const Config = {


    //****************** TASK ******************//

    CONCURRENT_TASK_NUM: 30,

    EVENT_END: 'end',

    MISSION_INTERVAL: 1000,

    START_TIME: '17:00:00', //5:00 PM

    CHECK_INTERVAL: 5000, //5s

    RETRY_INTERVAL: 60 * 1000, //1min

    ONE_DAY: 24 * 3600 * 1000, //1 day in millisecond

    MAX_REJECT_NUM: 3,

    PHANTOM_MONITOR_INTERVAL: 5000, //5s

    PHANTOM_TASK_TIMEOUT: 10000, //10s


    //****************** EMAIL ******************//

    ENABLE_EMAIL: false,

    EMAIL_OPTIONS: {

    },

    EMAIL_LOG_LEVEL: 1, //LOG_TYPE



    //****************** LOG ******************//

    LOG_PATH: path.join(__dirname, 'log', 'out.log'),

    ERROR_PATH: path.join(__dirname, 'log', 'err.log'),

    LOG_TYPE: {
        DEBUG: -1,
        LOG: 0,
        WARN: 1,
        ERROR: 2,
        FATAL: 3
    },

    LOG_LEVEL: -1, //LOG_TYPE

    RECORD_ERROR_STACK_DEPTH: 9,



    //****************** CACHE ******************//

    CACHE_TIME: this.ONE_DAY,

    CACHE_CLEAN_TRESHOLD: 5000,



    //****************** DB ******************//

    DATABASE_HOST: '127.0.0.1',

    DATABASE_PORT: '27017',

    DATABASE_NAME: 'Lagou',

    DATABASE_USERNAME: '',

    DATABASE_PASSWORD: '',

    DATABASE_OPTIONS: {
        server: {
            socketOptions: {
                keepAlive: 1,
                connectTimeoutMS: 5000
            },
            auto_reconnect: true
        }
    },

    SCHEMA_OPTIONS: {
        emitIndexErrors: false
    }

};
Object.seal(Config);

module.exports = Config;
