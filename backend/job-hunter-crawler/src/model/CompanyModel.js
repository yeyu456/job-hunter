const mongoose = require('mongoose');

const Logger = require('./../support/log.js');
const DatabaseError = require('./../exception/DatabaseError.js');
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
    },
    field: {
        type: String,
        required: true
    }
}, SCHEMA_OPTIONS);

CompanySchema.statics.insertIfNotExist = function _insertIfNotExist(models) {
    let ps = [];
    for (let m of models) {
        let p = new Promise((resolve) => {
            CompanyModel.findOne({id: m.id}).exec((err, company) => {
                if (err) {
                    throw new DatabaseError(err, `Cannot query company with id ${m.id}`);
                } else if (company !== null){
                    Logger.debug(`Duplicated company with id ${m.id}`);
                    resolve();

                } else {
                    let companyModel = new CompanyModel(m);
                    companyModel.save((err, company) => {
                        if (err) {
                            Logger.error(new DatabaseError(err, `Cannot create company with id ${m.id}`));
                        }
                        resolve();
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

let CompanyModel = mongoose.model('CompanyModel', CompanySchema);
CompanyModel.on('error', function (error) {
    if (error) {
        Logger.error(error);
    }
});
