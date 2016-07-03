const mongoose = require('mongoose');

const Logger = require('./../support/log.js');
const SCHEMA_OPTIONS = require('./../config.js').SCHEMA_OPTIONS;

const ProxySchema = new mongoose.Schema({
    ip: {
        type: String,
        required: true
    },
    port: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    useragent: {
        type: String,
        required: true
    },
    updated: {
        type: Date,
        required: true
    },
    used: {
        type: Number,
        required: true
    },
    delay: {
        type: Number,
        required: true
    },
    valid: {
        type:Boolean,
        required: true
    }
}, SCHEMA_OPTIONS);

ProxySchema.index({ip: 1, port: 1, type: 1}, {unique: true, sparse: true});

ProxySchema.pre('validate', function(next) {
    this.updated = Date.now();
    next();
});

ProxySchema.post('init', function(doc) {
    doc.updated = Date.now();
});

ProxySchema.virtual('url').get(function _getUrl() {
    return this.type + '://' + this.ip + (this.port === 80? '': ':' + this.port);
});

let ProxyModel = mongoose.model('ProxyModel', ProxySchema);
ProxyModel.on('error', function (error) {
    if (error) {
        Logger.error(error);
    }
});