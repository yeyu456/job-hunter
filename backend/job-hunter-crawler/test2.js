const path = require('path');
const childProcess = require('child_process');
const phantomjs = require('phantomjs-prebuilt');
const ws = require('ws');

this.ws = new ws.Server({port : 8080});
this.ws.on('message', function incoming(message) {
    console.log('received: %s', message);
});
this.ws.on('connection', (socket) => {
    socket.send(JSON.stringify({
        city : '%E6%B7%B1%E5%9C%B3',
        job : 'Java',
        proxyIP : '112.65.200.211',
        proxyPort : 80,
        proxyType : 'http',
        useragent : 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.84 Safari/537.36'
    }));
});

// 
// let content = '';
// proc.stdout.on('data', (data) => {
//     console.log('log:' +data);
// });
//
// let error = null;
// proc.stderr.on('data', (data) => {
//     console.log('err:' +data);
// });
//
// proc.on('exit', (code, signal) => {
//     console.log(code + ' ' + signal);
//     if (error) {
//         console.error(error);
//     } else {
//         try {
//             console.log(JSON.parse(content));
//         } catch (e) {
//             console.error(e);
//         }
//     }
// });
