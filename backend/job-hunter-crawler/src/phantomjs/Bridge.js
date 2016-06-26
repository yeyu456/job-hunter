const childProcess = require('child_process');
const path = require('path');

const phantomjs = require('phantomjs-prebuilt');
const ws = require('ws');

const Config = require('./../config.js');
const Logger = require('./../support/Log.js');
const PhantomError = require('./../exception/PhantomError.js');

module.exports = class Bridge {

    start() {
        this._initBridge();
    }

    push(task, proxy) {
        Logger.debug('bridge', JSON.stringify(task));
        if (this.ws.clients.length > 0) {
            let data = {
                city: task.city,
                dist: task.dist,
                zone: task.zone,
                job: task.job,
                proxyIP: proxy.ip,
                proxyPort: proxy.port,
                proxyType: proxy.type,
                useragent: proxy.useragent
            };
            try {
                this.ws.clients[0].send(JSON.stringify(data));
            } catch (e) {
                Logger.error(new PhantomError(e, 'Error occurred when push new bridge task.'));
            }
        }
    }

    _initBridge() {
        this.phantomP = null;
        this.ws = new ws.Server({port : 8080});
        this.ws.on('connection', (client) => {
            client.on('error', this._onClientError.bind(this));
            client.on('message', (msg) => {
                try {
                    msg = JSON.parse(msg);
                    if (msg.error) {
                        Logger.error(new PhantomError(msg.error));
                    }
                } catch (e) {
                    Logger.error(new PhantomError(e));
                }
            });
        });
        this.ws.on('error', this._onServerError.bind(this));
        //this._initPhantom();
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