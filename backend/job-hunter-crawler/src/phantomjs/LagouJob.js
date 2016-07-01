//phantomjs don't support let keyword
/*eslint-disable no-var*/
var webpage = require('webpage');

var ws;
var page = webpage.create();
page.onResourceRequested = function(requestData, request) {
    //abort unnecessary resources request
    if (/JPG|jpg|png|PNG|\.css|baidu|google|(qq\.com)/.test(requestData['url'])) {
        request.abort();
    }
};
var queue = [];

function send(data) {
    if (data.hasOwnProperty('error')) {
        console.error(new Error(data.error, data));
    }
    ws.send(JSON.stringify(data));
}

function open() {
    if (queue.length === 0) {
        setTimeout(function () {
            open();
        }.bind(this), 500);
        return;
    }
    var data = queue.pop();
    phantom.setProxy(data['proxyIP'], data['proxyPort'], data['proxyType'], '', '');
    page.settings.userAgent = data['useragent'];
    page.open(data['url'], function(status) {
        if (status !== 'success') {
            send({error:'Cannot access url ' + data['url']});
        } else {
            send({msg: 'done'});
        }
        open();
    });
}

function main() {
    ws = new WebSocket('ws://127.0.0.1:8080');
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
            !data['url'] ||
            !data['proxyIP'] ||
            !data['proxyPort'] ||
            !data['proxyType'] ||
            !data['useragent']) {
            send({error: 'invalid data'});

        } else {
            var port = parseInt(data['proxyPort']);
            if (port && port > 0 && port < 65535) {
                queue.push(data);

            } else {
                send({error: 'invalid proxy port'});
            }
        }
    }
}

main();
open();
