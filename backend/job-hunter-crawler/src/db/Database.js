const fs = require('fs');
const path = require('path');

const mongoose = require('mongoose');

const Config = require('./../config.js');

module.exports = class Database {

    static registModels() {
        let dir = path.join(__dirname, '..', 'model');
        let models = fs.readdirSync(dir);
        for (let model of models) {
            require(path.join(dir, model));
        }
    }

    static connect() {
        //regist all models
        Database.registModels();

        //use native Promise
        mongoose.Promise = global.Promise;

        //get db url
        let url = 'mongodb://';
        if (Config.DATABASE_USERNAME &&
            Config.DATABASE_USERNAME !== '' &&
            Config.DATABASE_PASSWORD &&
            Config.DATABASE_PASSWORD !==  '') {
            url += Config.DATABASE_USERNAME + ':' + Config.DATABASE_PASSWORD + '@';
        }
        url += Config.DATABASE_HOST;
        if (Config.DATABASE_PORT && Config.DATABASE_PORT !== '') {
            url += ':' + Config.DATABASE_PORT;
        }
        url += '/' + Config.DATABASE_NAME;

        //do connect
        return mongoose.connect(url, Config.DATABASE_OPTIONS);
    }
}