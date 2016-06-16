const urlencode = require('urlencode');
const Config = require('./../config.js');

function getUserAgent() {
    return Config.USER_AGENTS[getRandomInt(0, Config.USER_AGENTS.length)];
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

function getRandomInt(from, to) {
    if (to < from) {
        throw new Error('Illegal args with from ' + from + ' to ' + to);
    }
    return Math.floor((to - from) * Math.random());
}

module.exports = {
    getUserAgent: getUserAgent,
    getStartTime: getStartTime,
    getNextStartTime: getNextStartTime,
    getMaxPageNum: getMaxPageNum,
    getRandomInt: getRandomInt
}