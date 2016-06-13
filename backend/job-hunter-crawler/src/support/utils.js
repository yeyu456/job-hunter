const urlencode = require('urlencode');
const Config = require('./../config.js');

function getUserAgent() {
    let index = Math.floor(Config.USER_AGENTS.length * Math.random());
    return Config.USER_AGENTS[index];
}

function getStartTime(date = new Date()) {
    return Date.parse(date.toDateString() + ' ' + Config.START_TIME);
}

function getNextStartTime(curStartTime) {
    let d = new Date(curStartTime);
    d.setMinutes(0);
    d.setSeconds(0);
    //next day
    d.setHours(24);
    return getStartTime(d);
}

function getMaxPageNum(totalCount, pageSize) {
    totalCount = parseInt(totalCount);
    pageSize = parseInt(pageSize);
    return Math.ceil(totalCount / pageSize);
}

module.exports = {
    getUserAgent: getUserAgent,
    getStartTime: getStartTime,
    getNextStartTime: getNextStartTime,
    getMaxPageNum: getMaxPageNum
}
