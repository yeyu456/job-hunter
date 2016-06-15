const Config = {

    //****************** CRAWL ******************//

    USER_AGENTS : [
        'Mozilla/5.0 (Windows NT 6.3, Win64, x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.33 Safari/537.36'],

    DEFAULT_LAGOU_POST_HEADERS : JSON.stringify({
        'Accept-Encoding': 'gzip, deflate',
        'Accept-Language': 'zh-CN,zh,q:0.8,en,q:0.6,ja,q:0.4,ko,q:0.2,zh-TW,q:0.2',
        'Content-Type': 'application/x-www-form-urlencoded, charset:UTF-8',
        'Host': 'www.lagou.com',
        'Origin': 'http://www.lagou.com',
        'X-Requested-With': 'XMLHttpRequest'
    }),

    ACCEPT_JSON : 'application/json',

    CITIES : [
        '上海', '深圳', '广州', '北京', '杭州'
    ],

    //高端技术职位:gaoduanjishuzhiwei
    JOB_TYPES : [
        'Java', 'Node.js', 'Javascript', 'gaoduanjishuzhiwei'
    ],

    CITY_URL : 'http://www.lagou.com/jobs/positionAjax.json?px=new&city=',

    CITY_URL_POSTFIX : '&needAddtionalResult=false',

    CITY_REF : 'http://www.lagou.com/zhaopin/',

    CITY_REF_POSTFIX : '/?labelWords=label',



    //****************** TIME ******************//

    START_TIME : '05:00:00', //5:00 AM

    CHECK_INTERVAL : 5000, //5s

    RETRY_INTERVAL : 60 * 1000, //1min

    ONE_DAY : 24 * 3600 * 1000, //1 day in millisecond

    MAX_REJECT_NUM : 3,

    TASK_INTERVAL : 1 * 1000, //1s


    //****************** EMAIL ******************//

    ENABLE_EMAIL : false,

    EMAIL_OPTIONS : {

    },



    //****************** LOG ******************//

    LOG_PATH : '../log/out.log',
    ERROR_PATH : '../log/err.log',

    LogType : {
        LOG: 0,
        WARN: 1,
        ERROR: 2,
        FATAL: 3
    },

    LOG_LEVEL : 0, // 0:log 1:warn 2:error 3:fatal



    //****************** CACHE ******************//

    CACHE_TIME : this.ONE_DAY,

    CACHE_CLEAN_TRESHOLD : 5000
}
Object.seal(Config),

module.exports = Config;
