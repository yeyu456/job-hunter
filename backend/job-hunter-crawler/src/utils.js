const urlencode = require('urlencode');
import {USER_AGENTS, START_TIME, CITIES, JOB_TYPES} from './config';

export function getUserAgent() {
    let index = Math.floor(USER_AGENTS.length * Math.random());
    return USER_AGENTS[index];
}

export function getSeedUrls() {
    let urls = [];
    CITIES.forEach(function (city, cityIndex, cityArray) {
        JOB_TYPES.forEach(function (job, jobIndex, jobArray) {
            urls.push('http://www.lagou.com/jobs/positionAjax.json?city='
                + urlencode.encode(city, 'UTF-8') + '&first=true&kd=' + urlencode.encode(job, 'UTF-8') + '&pn=1');
        });
    });
    return urls;
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
