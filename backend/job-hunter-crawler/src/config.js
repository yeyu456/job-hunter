//****************** CRAWL ******************//

export const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.33 Safari/537.36'];

export const CITIES = [
    '上海', '深圳', '广州', '北京', '杭州'
];

//高端技术职位:gaoduanjishuzhiwei
export const JOB_TYPES = [
    'Java', 'Node.js', 'Javascript', 'gaoduanjishuzhiwei'
];
Object.seal(USER_AGENTS);
Object.seal(CITIES);
Object.seal(JOB_TYPES);



//****************** TIME ******************//

export const START_TIME = '05:00:00'; //5:00 AM

export const CHECK_INTERVAL = 5000; //5s

export const ONE_DAY = 24 * 3600 * 1000; //1 day in millisecond

export const MAX_REJECT_NUM = 3;



//****************** EMAIL ******************//

export const ENABLE_EMAIL = false;

export const EMAIL_OPTIONS = {

};
Object.seal(EMAIL_OPTIONS);


//****************** LOG ******************//

export const LOG_PATH = '../log/out.log';
export const ERROR_PATH = '../log/err.log';

export const LogType = {
    LOG: 0,
    WARN: 1,
    ERROR: 2,
    FATAL: 3
};
Object.seal(LogType);

export const LOG_LEVEL = LogType.WARN; // 0:log 1:warn 2:error 3:fatal



//****************** CACHE ******************//

export const CACHE_TIME = ONE_DAY;

export const CACHE_CLEAN_TRESHOLD = 5000;
