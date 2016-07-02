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
page.onResourceTimeout = function (request) {
    if (/px=default/.test(request['url'])) {
        send({fail: true, url: request['url']});
    }
};
var queue = [];

function send(data) {
    ws.send(JSON.stringify(data));
}

function open() {
    if (queue.length === 0) {
        setTimeout(function () {
            open();

        }, 100);
        return;
    }

    var data = queue.pop();
    phantom.setProxy(data['proxy']['ip'], parseInt(data['proxy']['port']), data['proxy']['type'], '', '');
    page.settings.userAgent = data['proxy']['useragent'];
    page.settings.loadImages = false;
    page.settings.resourceTimeout = 3000;

    page.open(data['url'], function(status) {
        if (status !== 'success') {
            send({fail: true, url: data['url']});

        } else {
            send({success: true, url: data['url']});
        }
        open();
    });
}

function isValidData(data) {
    if(!data ||
        !data['url'] ||
        !data['proxy'] ||
        !data['proxy']['ip'] ||
        !data['proxy']['port'] ||
        !data['proxy']['type'] ||
        !data['proxy']['useragent']) {
        return false;

    } else {
        var port = parseInt(data['proxy']['port']);
        if (port && port > 0 && port < 65535) {
            return true;

        } else {
            return false;
        }
    }
}

function main() {
    ws = new WebSocket('ws://127.0.0.1:8080');
    setInterval(function () {
        send('h');
    }, 1000);
    ws.onerror = function _onWsError() {
        phantom.exit(1);
    };
    ws.onclose = function _onWsClose() {
        phantom.exit();
    };
    ws.onmessage = function _onWsMsg(event) {
        try {
            var data = event.data;
            data = JSON.parse(data);
            if (data instanceof Array) {
                for (var i=0;i<data.length;i++) {
                    (function (d) {
                        if (isValidData(d)) {
                            queue.push(d);
                        }
                    })(data[i]);
                }

            } else {
                if (isValidData(data)) {
                    queue.push(data);
                }
            }
        } catch (e) {
            send({error: 'invalid data'});
        }
    }
}

main();
open();
