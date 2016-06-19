// const EventEmitter = require('events');
// const request = require('request');
const webpage = require('webpage');
var Config = require('./src/config.js');
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


console.error = function () {
    require("system").stderr.write(Array.prototype.join.call(arguments, ' ') + '\n');
};
console.warn = function () {
    require("system").stderr.write(Array.prototype.join.call(arguments, ' ') + '\n');
};

function test2() {
    var count = 0;
    phantom.setProxy('112.65.200.211', 80, 'http', '', '');
    var page = webpage.create({
        settings: {
            userAgent: 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36'
        }
    });
    page.captureContent = ['.*'];
    page.onResourceRequested = function(requestData, request) {
        if (/JPG|jpg|png|PNG|\.css|baidu|google|(qq\.com)/.test(requestData['url'])) {
            request.abort();
        } else if (/positionAjax/.test(requestData['url'])) {
            //requestData['postData'] = requestData['postData'].replace('pn=1', 'pn=2');
            console.log(JSON.stringify(page.cookies));
        }
    };
    // page.onResourceReceived = function(resp) {
    //     if (/positionAjax/.test(resp.url)) {
    //         console.log('matched');
    //         if (resp.status === 200 && resp.stage === 'end') {
    //             console.log(JSON.stringify(resp));
    //         } else {
    //             console.log('error status ' + resp.status);
    //         }
    //     }
    // }
    page.open('http://www.lagou.com/zhaopin/Java/?labelWords=label', function (status) {
        if (status !== 'success') {
            console.error('Unable to access network');
            phantom.exit();

        } else {
            // page.evaluate(function() {
            //     document.getElementsByClassName('pager_next')[0].click();
            // });
            setTimeout(function(){
                page.open('http://www.lagou.com/jobs/positionAjax.json?city=%E5%8C%97%E4%BA%AC&needAddtionalResult=false', 'post', 'first=false&pn=100&kd=Java', function (status) {
                    if (status !== 'success') {
                        console.error('Unable to post!');
                    } else {
                        console.log(page.plainText);
                    }
                    phantom.exit();
                });
            }, 2000);
        }
    });
}

function send() {
    var wsocket = new WebSocket('ws://127.0.0.1:8080');
    wsocket.onopen = function() {
        wsocket.send('hello ws');
    };
    wsocket.onmessage = function(data){
        console.log('client:' + data);
    }
    // var isPing;
    // wsocket.on('pong', function(data) {
    //     console.log(data);
    //     if (isPing) {
    //         clearTimeout(isPing);
    //     }
    //     wsocket.ping('ping');
    //     isPing = setTimeout(function(){
    //         wsocket.close();
    //     }, 2000);
    // });
}
test2();
