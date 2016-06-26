//phantomjs don't support let keyword
/*eslint-disable no-var*/

var webpage = require('webpage');

var Config = require('./../config.js');

var page;
var ws;

function send(data) {
    if (data.hasOwnProperty('error')) {
        console.error(new Error(data.error, data));
    }
    ws.send(JSON.stringify(data));
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

function openPage(city, dist, zone, job) {
    var getUrl = Config.GET_URL + job + Config.CITY_GET_URL + encodeURIComponent(city) +
        Config.DISTRICT_GET_URL + encodeURIComponent(dist) +
        Config.ZONE_GET_URL + encodeURIComponent(zone);
    page.open(getUrl, function(status) {
        if (status !== 'success') {
            send({error:'Cannot access url ' + getUrl});
        } else {
            send({msg: 'done'});
            // var url = Config.CITY_URL + Config.CITY_GET_URL + encodeURIComponent(city) +
            //     Config.DISTRICT_GET_URL + encodeURIComponent(dist) +
            //     Config.ZONE_GET_URL + encodeURIComponent(zone) + Config.CITY_URL_POSTFIX;
            // page.open(url, 'post', 'first=true&pn=1&kd=c#', function (status) {
            //     console.log(page.plainText);
            // })
        }
    });
}

function main() {
    ws = new WebSocket('ws://127.0.0.1:8080');
    console.log('connected');
    ws.onerror = function _onWsError() {
        phantom.exit(1);
    };
    ws.onclose = function _onWsClose() {
        phantom.exit();
    };
    ws.onmessage = function _onWsMsg(event) {
        var data = event.data;
        data = JSON.parse(data);
        if(!data ||
            !data['city'] ||
            !data['dist'] ||
            !data['zone'] ||
            !data['job'] ||
            !data['proxyIP'] ||
            !data['proxyPort'] ||
            !data['proxyType'] ||
            !data['useragent']) {
            send({error: 'invalid data'});

        } else {
            var port = parseInt(data['proxyPort']);
            if (port && port > 0 && port < 65535) {
                initPage(data['proxyIP'], data['proxyPort'], data['proxyType'], data['useragent']);
                openPage(data['city'], data['dist'], data['zone'], data['job']);

            } else {
                send({error: 'invalid proxy port'});
            }
        }
    }
}
main();
