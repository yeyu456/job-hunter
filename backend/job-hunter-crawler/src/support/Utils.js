const urlencode = require('urlencode');
const Config = require('./../config.js');
const CrawlConfig = require('./../crawl.config.js');

function getUserAgent() {
    return CrawlConfig.USER_AGENTS[1];
}

function getLogDate() {
    let date = new Date();
    return '[' + date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate() +
        ' ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() + ']\n';
}

function getStartTime(date = new Date()) {
    return Date.parse(date.toDateString() + ' ' + Config.START_TIME);
}

function isStartTime(startTime) {
    return new Date().getTime() > startTime;
}

function getNextStartTime(curStartTime) {
    let d = new Date(curStartTime);
    d.setMinutes(0);
    d.setSeconds(0);
    //next day
    d.setHours(24);
    return getStartTime(d);
}

function isSameDay(date1, date2) {
    if (date1 && date2) {
        return date1.getFullYear() === date2.getFullYear() &&
                date1.getMonth() === date2.getMonth() &&
                date1.getDate() === date2.getDate();

    } else {
        return false;
    }
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
    return Math.floor(Math.random() * (to - from)) + from;
}

function isValidIP(ip) {
    return /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip);
}

function isNotValidData(data) {
    return !data ||
        !data['content'] ||
        (!data['content']['pageSize'] && data['content']['pageSize'] !== 0) ||
        !data['content']['positionResult'] ||
        (!data['content']['positionResult']['totalCount'] && data['content']['positionResult']['totalCount'] !== 0) ||
        !data['content']['positionResult']['result'];
}

function isValidProxyType(type) {
    return type && (type.toLowerCase() === 'http' || type.toLowerCase() === 'https');
}

function getProxyUrl(proxy) {
    if (proxy &&
        proxy.type &&
        proxy.ip && isValidIP(proxy.ip) &&
        Number.isInteger(proxy.port) && proxy.port > 0 && proxy.port < 65535) {
        return proxy.type + '://' + proxy.ip + (proxy.port === 80? '': ':' + proxy.port);

    } else {
        return null;
    }
}

module.exports = {
    getUserAgent: getUserAgent,
    getLogDate: getLogDate,
    getStartTime: getStartTime,
    isStartTime: isStartTime,
    getNextStartTime: getNextStartTime,
    isSameDay: isSameDay,
    getMaxPageNum: getMaxPageNum,
    getRandomInt: getRandomInt,
    isValidIP: isValidIP,
    isNotValidData: isNotValidData,
    isValidProxyType: isValidProxyType,
    getProxyUrl: getProxyUrl
};
