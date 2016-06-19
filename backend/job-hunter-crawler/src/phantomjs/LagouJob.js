//phantomjs don't support let keyword
/*eslint-disable no-var*/
var webpage = require('webpage');
var Config = require('./../config.js');

var page;
var ws;

function send(data) {
    ws.send(JSON.stringify(data));
    if (data.hasOwnProperty('error')) {
        console.log(data.error);
        setTimeout(function(){
            ws.close();
        }, 100);
    }
}

function initPage(proxyIP, proxyPort, proxyType, useragent) {
    phantom.setProxy(proxyIP, proxyPort, proxyType, '', '');
    page = webpage.create({
        settings: {
            userAgent: useragent
        }
    });
    page.onResourceRequested = function(requestData, request) {
        //abort unnecessary resources request
        if (/JPG|jpg|png|PNG|\.css|baidu|google|(qq\.com)/.test(requestData['url'])) {
            request.abort();
        }
    };
}

function openPage(city, job, ws) {
    var getUrl = Config.CITY_REF + job + Config.CITY_REF_POSTFIX;
    // page.onResourceReceived = function(response) {
    //     if (/positionAjax\.json/.test(response.url)) {
    //         if (response.status === 200) {
    //
    //         } else {
    //
    //         }
    //     }
    // };
    page.open(getUrl, function(status) {
        if (status !== 'success') {
            send({
                error:'Cannot access url ' + getUrl,
                city:city,
                job:job
            });
        } else {
            send({
                msg: 'done'
            });
        }
    });
}

function main() {
    ws = new WebSocket('ws://127.0.0.1:8080');
    ws.onerror = function _onWsError() {
        phantom.exit(1);
    }
    ws.onclose = function _onWsClose() {
        phantom.exit();
    }
    ws.onmessage = function _onWsMsg(event) {
        console.log(JSON.stringify(event));
        var data = event.data;
        data = JSON.parse(data);
        if (data &&
            data.hasOwnProperty('city') &&
            data.hasOwnProperty('job') &&
            data.hasOwnProperty('proxyIP') &&
            data.hasOwnProperty('proxyPort') &&
            data.hasOwnProperty('proxyType') &&
            data.hasOwnProperty('useragent')) {
            var port = parseInt(data['proxyPort']);
            if (port && port > 0) {
                initPage(data['proxyIP'], data['proxyPort'], data['proxyType'], data['useragent']);
                openPage(data['city'], data['job'], ws);

            } else {
                send({error : 'invalid proxy port'});
            }
        } else {
            send({error : 'invalid data'});
        }
    }
}
main();
