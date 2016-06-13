const urlencode = require('urlencode');
import {USER_AGENTS, START_TIME} from './../config';

export function getUserAgent() {
    let index = Math.floor(USER_AGENTS.length * Math.random());
    return USER_AGENTS[index];
}

export function getStartTime(date = new Date()) {
    return Date.parse(date.toDateString() + ' ' + START_TIME);
}

export function getNextStartTime(curStartTime) {
    let d = new Date(curStartTime);
    d.setMinutes(0);
    d.setSeconds(0);
    //next day
    d.setHours(24);
    return getStartTime(d);
}

export function getMaxPageNum(totalCount, pageSize) {
    totalCount = parseInt(totalCount);
    pageSize = parseInt(pageSize);
    return Math.ceil(totalCount / pageSize);
}
