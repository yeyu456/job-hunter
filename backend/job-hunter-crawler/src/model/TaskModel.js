const mongoose = require('mongoose');

const Logger = require('./../support/log.js');
const SCHEMA_OPTIONS = require('./../config.js').SCHEMA_OPTIONS;

const TaskSchema = new mongoose.Schema({
    job: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    dist: {
        type: String,
        required: true
    },
    zone: {
        type: String,
        required: true
    },
    startNum: {
        type: Number,
        min: 1,
        required: true
    },
    maxNum: {
        type: Number,
        required: true
    },
    updated: {
        type: Date,
        required: true
    },
    updateTime: {
        type: Number
    }
}, SCHEMA_OPTIONS);

TaskSchema.index({job: 1, city: 1, dist: 1, zone: 1}, {unique: true, sparse: true});

TaskSchema.pre('validate', function(next) {
    this.updated = Date.now();
    if (this.maxNum < this.startNum) {
        next(Error('invalid max num' + this.maxNum));
    } else {
        next();
    }
});

TaskSchema.post('init', function(doc) {
    doc.updated = Date.now();
});

let TaskModel = mongoose.model('TaskModel', TaskSchema);
TaskModel.on('error', function (error) {
    if (error) {
        Logger.error(error);
    }
});
