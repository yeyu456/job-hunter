const path = require('path');
const childProcess = require('child_process');
const phantomjs = require('phantomjs-prebuilt');

// Arguments for child process of node
var childArgs = [
    path.join(__dirname, 'test.js')
];

// Run the child process
var proc = childProcess.execFile(phantomjs.path, childArgs, function (err, stdout, stderr) {});

let content = '';
proc.stdout.on('data', (data) => {
    content += data;
});

let error = null;
proc.stderr.on('data', (data) => {
    error = data;
});

proc.on('exit', (code, signal) => {
    console.log(code + ' ' + signal);
    if (error) {
        console.error(error);
    } else {
        try {
            console.log(JSON.parse(content));
        } catch (e) {
            console.error(e);
        }
    }
});
