const childProcess = require('child_process');
const path = require('path');

const phantomjs = require('phantomjs-prebuilt');
const ws = require('ws');

const Config = require('./../config.js');
const Logger = require('./../support/Log.js');
const PhantomError = require('./../exception/PhantomError.js');

module.exports = class Bridge {

    start() {
        this.queue = [];
        this._initBridge();
    }

    push(task, proxy) {
        this.queue.push({
            city: task.city,
            dist: task.dist,
            zone: task.zone,
            job: task.job,
            proxyIP: proxy.ip,
            proxyPort: proxy.port,
            proxyType: proxy.type,
            useragent: proxy.useragent
        });
        if (this.ws.clients.length > 0) {
            let data = this.queue.shift();
            try {
                this.ws.clients[0].send(JSON.stringify(data));
            } catch (e) {
                Logger.error(new PhantomError(e, 'Error occurred when push new bridge task.'));
                this.queue.push(data);
            }
        }
    }

    _initBridge() {
        this.phantomP = null;
        this.ws = new ws.Server({port : 8080});
        this.ws.on('connection', (client) => {
            client.on('error', this._onClientError.bind(this));
        });
        this.ws.on('error', this._onServerError.bind(this));
        this._initPhantom();
    }

    _initPhantom() {
        let args = [path.join(__dirname, 'LagouJob.js')];
        this.phantomP = childProcess.execFile(phantomjs.path, args, (err) => {
            if (err) {
                this._onClientError(err);
            }
        });
    }

    _onClientError(error) {
        Logger.error(new PhantomError(error, 'phantom client error'));
        if (this.phantomP) {
            this.phantomP.kill();
        }
        setTimeout(this._initPhantom.bind(this), Config.TASK_INTERVAL);
    }

    _onServerError(error) {
        Logger.error(new PhantomError(error));
        this.ws.close();
        setTimeout(this._initBridge.bind(this), Config.TASK_INTERVAL);
    }
};