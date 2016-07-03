const childProcess = require('child_process');
const path = require('path');
const EventEmitter = require('events');

const phantomjs = require('phantomjs-prebuilt');
const ws = require('ws');

const Utils = require('./../support/Utils.js');
const Config = require('./../config.js');
const CrawlConfig = require('./../crawl.config.js');
const Logger = require('./../support/Log.js');
const PhantomError = require('./../exception/PhantomError.js');

module.exports = class Bridge {

    init() {
        this.phantom = null;
        this.ws = null;
        this.isConnected = false;
        this.runningTaskData = [];
        this.event = new EventEmitter();
        this._startServer();
        this._startClient();
    }

    regist(successCB, failCB) {
        this.event.on('success', successCB);
        this.event.on('fail', failCB);
    }

    emulate(task, proxy) {
        Logger.debug('bridge', JSON.stringify(task));
        let url = CrawlConfig.GET_URL + task.job + CrawlConfig.CITY_GET_URL + encodeURIComponent(task.city) +
        CrawlConfig.DISTRICT_GET_URL + encodeURIComponent(task.dist) +
        CrawlConfig.ZONE_GET_URL + encodeURIComponent(task.zone);
        if (this.runningTaskData[url]) {
            setTimeout(() => {
                this.event.emit('fail', task, proxy, true);
            }, Utils.getRandomInt(1, 15) * 1000);
        }
        let data = {
            url: url,
            proxy: proxy
        };
        this._sendData(data);
        data.task = task;
        this.runningTaskData[url] = data;
    }

    _startServer() {
        this.ws = new ws.Server({port : 8080});
        this.ws.on('connection', (client) => {
            Logger.debug('phantom client connected');
            this.isConnected = true;
            Logger.debug('data len ' + Object.keys(this.runningTaskData).length);
            if (Object.keys(this.runningTaskData).length !== 0) {
                this._sendData();
            }
            client.on('error', this._onClientError.bind(this));
            client.on('message', (msg) => {
                try {
                    msg = JSON.parse(msg);
                    if (msg.error) {
                        let proxyIP = 'None';
                        if (this.runningTaskData[msg.url]) {
                            proxyIP = this.runningTaskData[msg.url].proxy.ip;
                        }
                        Logger.error(new PhantomError(`Phantom fail url:${msg.url} error:${msg.error} proxy ip:${proxyIP}`));

                    } else if (msg.success) {
                        this._finishData(msg.url);

                    } else if (msg.fail) {
                        let proxyIP = 'None';
                        if (this.runningTaskData[msg.url]) {
                            proxyIP = this.runningTaskData[msg.url].proxy.ip;
                        }
                        Logger.error(new PhantomError(`Phantom fail url:${msg.url} reason:${msg.reason} proxy ip:${proxyIP}`));
                        this._failData(msg.url);

                    }
                } catch (e) {
                    Logger.error(new PhantomError(e, 'on message'));
                }
            });
            client.on('close', () => {
                Logger.debug('phantom client closed');
                this.isConnected = false;
            });
        });
        this.ws.on('error', this._onServerError.bind(this));
    }

    _startClient() {
        let args = [path.join(__dirname, 'LagouJob.js')];
        this.phantom = childProcess.execFile(phantomjs.path, args, (err) => {
            if (err) {
                this._onClientError(err);
            }
        });
    }

    _startMonitor() {
        if (this.monitor) {
            clearTimeout(this.monitor);
        }
        this.monitor = setTimeout(() => {
            this._onClientError('Monitor detect');

        }, Config.PHANTOM_MONITOR_INTERVAL);
    }

    _sendData(data) {
        if (!this.isConnected) {
            return;
        }
        //retry sending running task datas
        if (!data) {
            data = [];
            for (let key of Object.keys(this.runningTaskData)) {
                let d = this.runningTaskData[key];
                data.push({
                    url: d.url,
                    proxy: d.proxy
                });
                // setTimeout(() => {
                //     Logger.error(new PhantomError(`Monitor ${d.url} timeout`));
                //     this._failData(d.url);
                //
                // }, Config.PHANTOM_TASK_TIMEOUT);
            }
        } /*else {
            setTimeout(() => {
                Logger.error(new PhantomError(`Monitor ${data.url} timeout`));
                this._failData(data.url);

            }, Config.PHANTOM_TASK_TIMEOUT);
        }*/
        Logger.debug('sending ' + JSON.stringify(data));
        this.ws.clients[0].send(JSON.stringify(data));
    }

    _finishData(url) {
        if (this.runningTaskData[url]) {
            this.event.emit('success', this.runningTaskData[url].task, this.runningTaskData[url].proxy);
            delete this.runningTaskData[url];
        }
    }

    _failData(url) {
        if (this.runningTaskData[url]) {
            this.event.emit('fail', this.runningTaskData[url].task, this.runningTaskData[url].proxy);
            delete this.runningTaskData[url];
        }
    }

    _onClientError(msgOrError) {
        this.isConnected = false;
        Logger.error(new PhantomError(msgOrError, 'phantom client error'));
        if (this.phantom) {
            this.phantom.kill();
            this.phantom = null;
            this._startClient();
            //wait for the client boot up
            setTimeout(() => {
                this._sendData();
            }, 2000);
        }
    }

    _onServerError(error) {
        this.isConnected = false;
        Logger.error(new PhantomError(error, 'phantom server error'));
        this.ws.close();
        this.ws = null;
        this._startServer();
        //reset client
        this._onClientError('Server error.');
    }
};