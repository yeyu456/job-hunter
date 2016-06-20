const mongoose = require('mongoose');

const Logger = require('./../support/log.js');
const SCHEMA_OPTIONS = require('./../config.js').SCHEMA_OPTIONS;

const JobSchema = new mongoose.Schema({
    id: {
        type: Number,
        min: 1,
        required: true
    },
    companyId: {
        type: Number,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    salary: {
        type: String,
        required: true
    },
    education: {
        type: String,
        required: true
    },
    year: {
        type: String,
        required: true
    },
    created: {
        type: Number,
        min: 1,
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
    content: String,
    contentkey: [String]
}, SCHEMA_OPTIONS);

JobSchema.index({id: 1, companyId: 1}, {unique: true});

let JobModel = mongoose.model('JobModel', JobSchema);
JobModel.on('error', function (error) {
    if (error) {
        Logger.error(error);
    }
});
