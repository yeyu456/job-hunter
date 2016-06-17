// const EventEmitter = require('events');
// const request = require('request');
const webpage = require('webpage');

//
// let count = 0;
// function test(){
//     let options = {
//         url: 'http://www.lagou.com/jobs/positionAjax.json?city=%E4%B8%8A%E6%B5%B7&needAddtionalResult=false',
//         proxy: 'http://112.65.200.211',
//         //url: 'http://www.bing.com',
//         headers: {
//             //'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
//             'User-Agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36'
//         },
//         //form: {first: true, pn: 1, kd: 'Java'}
//         //, followRedirect:false
//     };
//     request.get(options, (error, response, body)=>{
//         console.log(response);
//         console.log(response);
//         if (count > 3) {
//             return;
//         } else {
//             count++;
//             //setTimeout(test, 3000 * count);
//         }
//     })
// }
//

try {
console.error = function () {
    require("system").stderr.write(Array.prototype.join.call(arguments, ' ') + '\n');
};
console.warn = function () {
    require("system").stderr.write(Array.prototype.join.call(arguments, ' ') + '\n');
};

function test2() {
    phantom.setProxy('112.65.200.211', 80, 'http', '', '');
    var page = webpage.create({
        settings: {
            //userAgent: 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36'
        }
    });
    page.onResourceRequested = function(requestData, request) {
        if (/JPG|jpg|png|\.css|baidu|google|(qq\.com)/.test(requestData['url'])) {
            request.abort();
        }
    };
    // page.open('http://www.lagou.com/zhaopin/Java/?labelWords=label', function (status) {
    //     if (status !== 'success') {
    //         console.error('Unable to access network');
    //         phantom.exit();
    //
    //     } else {
            page.open('http://www.lagou.com/jobs/positionAjax.json?city=%E4%B8%8A%E6%B5%B7&needAddtionalResult=false', 'post', 'first=true&pn=2&kd=Java', function (status) {
                if (status !== 'success') {
                    console.error('Unable to post!');
                } else {
                    console.log(page.plainText);
                }
                phantom.exit();
            });
    //     }
    // });
}
//test2();
} catch (e) {
    console.log(e);
}
phantom.exit(1);
