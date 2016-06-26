const Utils = require('./support/Utils.js');
const Logger = require('./support/Log.js');
const Crawl = require('./lagou/Crawl.js');
const Database = require('./db/Database.js');
const Config = require('./config.js');

let isDebug = false;
let startTime = null;
let isRunning = false;
let rejectNum = 0;

function main() {
    if (process.argv.length > 2) {
        let args = [];
        for (let i = 2; i < process.argv.length; i++) {
            args.push(process.argv[i].trim().toLowerCase());
        }
        if (args.indexOf('-de') || args.indexOf('-debug')) {
            isDebug = true;
        }
    }
    if (isDebug) {
        startTime = new Date();
    }
    if (!startTime) {
        startTime = Utils.getStartTime();
        if (new Date().getTime() > startTime) {
            startTime += Config.ONE_DAY;
        }
    }
    // connect -> task
    Database.connect()
        .then(task.bind(this))
        .catch((error) => {
            Logger.error(error);
            throw error;
        });
}

function task() {
    //In case of multiple task running at the same time
    if (!isRunning) {
        if (Utils.isStartTime(startTime)) {
            Logger.info('Not the start time.');
            setTimeout(task, Config.CHECK_INTERVAL);

        } else {
            Logger.info('startTime' + startTime);
            isRunning = true;
            crawlJob();
        }
    }
}

function crawlJob() {
    let crawlTask = new Crawl();
    crawlTask.start().then(() => {
        Logger.info('crawl finished');
        startTime = Utils.getNextStartTime(startTime);
        isRunning = false;
        rejectNum = 0;

    }).catch((error) => {
        rejectNum++;
        isRunning = false;
        if (rejectNum > Config.MAX_REJECT_NUM) {
            Logger.fatal('No more running.', error);
            process.exit(1);

        } else {
            isRunning = false;
            setTimeout(task, Config.RETRY_INTERVAL * rejectNum);
        }
    });
}

if (require.main === module) {
    main();
}
