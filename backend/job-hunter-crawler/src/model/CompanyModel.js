const mongoose = require('mongoose');

const Logger = require('./../support/log.js');
const SCHEMA_OPTIONS = require('./../config.js').SCHEMA_OPTIONS;

const CompanySchema = new mongoose.Schema({
    id: {
        type: Number,
        min: 1,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    }
}, SCHEMA_OPTIONS);


let CompanyModel = mongoose.model('CompanyModel', CompanySchema);
CompanyModel.on('error', function (error) {
    if (error) {
        Logger.error(error);
    }
});
