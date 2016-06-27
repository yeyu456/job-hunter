const mongoose = require('mongoose');

const Logger = require('./../support/log.js');
const DatabaseError = require('./../exception/DatabaseError.js');
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
    type: {
        type: String,
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

JobSchema.statics.insertIfNotExist = function _insertIfNotExist(models) {
    let ps = [];
    for (let m of models) {
        let p = new Promise((resolve) => {
            JobModel.findOne({id: m.id}).exec((err, job) => {
                if (err) {
                    throw new DatabaseError(err, `Cannot query job with id ${m.id}`);
                } else if (job !== null){
                    Logger.debug(`Duplicated job with id ${m.id}`);
                    resolve();

                } else {
                    let jobModel = new JobModel(m);
                    jobModel.save((err, job) => {
                        if (err) {
                            throw new DatabaseError(err, `Cannot create job with id ${m.id}`);
                        } else {
                            resolve();
                        }
                    });
                }
            });
        }).catch((err) => {
            Logger.error(err);
        });
        ps.push(p);
    }
    return Promise.all(ps);
};

let JobModel = mongoose.model('JobModel', JobSchema);
JobModel.on('error', function (error) {
    if (error) {
        Logger.error(error);
    }
});