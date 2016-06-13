const utils = require('./support/utils.js');
const Logger = require('./support/log.js');
const Crawl = require('./crawl/crawl.js');
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
        startTime = utils.getStartTime();
        if (new Date().getTime() > startTime) {
            startTime += Config.ONE_DAY;
        }
    }
    task();
}

function task() {
    //In case of multiple task running at the same time
    if (isRunning) {
        return;
    }
    if (new Date().getTime() < startTime) {
        setTimeout(task, Config.CHECK_INTERVAL);
    }
    isRunning = true;
    let crawl = new Crawl();
    crawl.start().then(() => {
        crawl.end();
        startTime = utils.getNextStartTime(startTime);
        isRunning = false;
        rejectNum = 0;
        task();

    }).catch((err) => {
        crawl.end();
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
            task();
        }
    });
}

if (require.main === module) {
    main();
}
