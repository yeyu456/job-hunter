const fs = require('fs');
const path = require('path');

const mongoose = require('mongoose');

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
    connectDB().then(() => {
        task();
        
    }).catch((error) => {
        Logger.error(error);
        throw error;
    });
}

function connectDB() {
    //regist all models
    let dir = path.join(__dirname, 'model');
    let models = fs.readdirSync(dir);
    for (let model of models) {
        require(path.join(dir, model));
    }

    //use native Promise
    mongoose.Promise = global.Promise;

    //get db url
    let url = 'mongodb://';
    if (Config.DATABASE_USERNAME &&
        DATABASE_USERNAME !== '' &&
        Config.DATABASE_PASSWORD &&
        Config.DATABASE_PASSWORD !==  '') {
        url += Config.DATABASE_USERNAME + ':' + Config.DATABASE_PASSWORD + '@';
    }
    url += Config.DATABASE_HOST;
    if (Config.DATABASE_PORT && Config.DATABASE_PORT !== '') {
        url += ':' + Config.DATABASE_PORT;
    }
    url += '/' + Config.DATABASE_NAME;

    //do connect
    return mongoose.connect(url, Config.DATABASE_OPTIONS);
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
        startTime = Utils.getNextStartTime(startTime);
        isRunning = false;
        rejectNum = 0;

    }).catch((err) => {
        console.log(err);
        crawl.end();
        return;
        rejectNum++;
        isRunning = false;
        if (rejectNum > Config.MAX_REJECT_NUM) {
            Logger.fatal('No more running.', err);
            process.exit(1);

        } else {
            Logger.error(err);
            isRunning = false;
            setTimeout(task, Config.RETRY_INTERVAL * rejectNum);
        }
    });
}

if (require.main === module) {
    main();
}
