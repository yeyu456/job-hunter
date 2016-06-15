const Utils = require('./support/Utils.js');
const Logger = require('./support/Log.js');
const Crawl = require('./lagou/Crawl.js');
const Config = require('./config.js');

let isDebug = false;
let startTime = undefined;
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
    console.log('startTime');
    console.log(startTime);
    task();
}

function task() {
    //In case of multiple task running at the same time
    if (isRunning) {
        return;
    } else if (new Date().getTime() < startTime) {
        console.log('not in time');
        setTimeout(task, Config.CHECK_INTERVAL);
        return;
    }
    isRunning = true;
    let crawl = new Crawl();
    crawl.start().then(() => {
        crawl.end();
        startTime = Utils.getNextStartTime(startTime);
        isRunning = false;
        rejectNum = 0;
        crawl.end();
        return;

    }).catch((err) => {
        crawl.end();
        return;
        rejectNum++;
        isRunning = false;
        if (rejectNum > Config.MAX_REJECT_NUM) {
            try {
                Logger.fatal('No more running.', err);
            } finally {
                process.exit(1);
            }

        } else {
            Logger.error(err);
            isRunning = false;
            setTimeout(task, Config.RETRY_INTERVAL * rejectNum);
            task();
        }
    });
}

if (require.main === module) {
    main();
}
