const Config = {

    //****************** CRAWL ******************//

    USER_AGENTS : [
        'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.84 Safari/537.36'],

    MOBILE_USER_AGENTS : [
        'Mozilla/5.0 (Linux; Android 5.1.1; Nexus 5 Build/LMY48B; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/43.0.2357.65 Mobile Safari/537.36',
        'Mozilla/5.0 (Linux; Android 4.4; Nexus 5 Build/_BuildID_) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/30.0.0.0 Mobile Safari/537.36',
        'Mozilla/5.0 (Linux; U; Android 4.1.1; zh-cn; Build/KLP) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Safari/534.30',
        'Mozilla/5.0 (Linux; U; Android 4.0.3; zh-cn; LG-L160L Build/IML74K) AppleWebkit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30',
        'Mozilla/5.0 (Linux; U; Android 4.2.2; zh-cn; NX403A Build/JDQ39) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30',
        'Mozilla/5.0 (Linux; Android 4.4.2; Nexus 4 Build/KOT49H) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.59 Mobile Safari/537.36'
    ],

    DEFAULT_LAGOU_POST_HEADERS : JSON.stringify({
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Encoding': 'gzip, deflate',
        'Accept-Language': 'zh-CN,zh,q:0.8,en,q:0.6,ja,q:0.4,ko,q:0.2,zh-TW,q:0.2',
        'Cache-Control': 'no-cache',
        'X-Anit-Forge-Code': 0,
        'X-Anit-Forge-Token': 'None',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Origin': 'http://www.lagou.com',
        'X-Requested-With': 'XMLHttpRequest'
    }),

    MOBILE_LAGOU_GET_HEADERS : JSON.stringify({
        'Accept-Language' : 'zh-CN,zh;q=0.8,en;q=0.6,ja;q=0.4,ko;q=0.2',
        'Accept' : 'application/json',
        'X-Requested-With' : 'XMLHttpRequest'
    }),

    ACCEPT_JSON : 'application/json',

    CITIES : [
        '上海', '深圳', '广州', '北京', '杭州'
    ],

    //高端技术职位:gaoduanjishuzhiwei
    JOB_TYPES : [
        'Java', 'Node.js', 'Javascript', 'gaoduanjishuzhiwei'
    ],

    CITY_URL : 'http://www.lagou.com/jobs/positionAjax.json?city=',

    CITY_URL_POSTFIX : '&needAddtionalResult=false',

    CITY_REF : 'http://www.lagou.com/zhaopin/',

    CITY_REF_POSTFIX : '/?labelWords=label',

    MOBILE_CITY_URL : 'http://www.lagou.com/custom/search.json?city=',

    MOBILE_CITY_URL_POSTFIX : '&positionName=',

    MOBILE_CITY_REF : 'http://www.lagou.com/custom/search.html?m=1',

    MOBILE_COMPANY_URL : '',

    MOBILE_COMPANY_URL_POSTFIX : '',

    MOBILE_COMPANY_REF : '',



    //****************** TASK ******************//

    CONCURRENT_TASK_NUM : 1,

    TASK_INTERVAL : 2 * 1000, //1s



    //****************** TIME ******************//

    START_TIME : '17:00:00', //5:00 PM

    CHECK_INTERVAL : 5000, //5s

    RETRY_INTERVAL : 60 * 1000, //1min

    ONE_DAY : 24 * 3600 * 1000, //1 day in millisecond

    MAX_REJECT_NUM : 3,


    //****************** EMAIL ******************//

    ENABLE_EMAIL : false,

    EMAIL_OPTIONS : {

    },



    //****************** LOG ******************//

    LOG_PATH : 'log/out.log',

    ERROR_PATH : 'log/err.log',

    LogType : {
        LOG: 0,
        WARN: 1,
        ERROR: 2,
        FATAL: 3
    },

    LOG_LEVEL : 0, // 0:log 1:warn 2:error 3:fatal



    //****************** CACHE ******************//

    CACHE_TIME : this.ONE_DAY,

    CACHE_CLEAN_TRESHOLD : 5000,



    //****************** DB ******************//

    DATABASE_HOST : '127.0.0.1',

    DATABASE_PORT : '27017',

    DATABASE_USERNAME : '',

    DATABASE_PASSWORD : '',

    DATABASE_OPTIONS : {

    },

};
Object.seal(Config),

module.exports = Config;
