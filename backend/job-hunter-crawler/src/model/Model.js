const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({
    id : Number,
    name : String
});

const LocationSchema = new mongoose.Schema({
    city : String,
    dist : String,
    zone : String
});

const JobSchema = new mongoose.Schema({
    id : {
        type : Number,
        min : 1,
        required: true
    },
    company : {
        type : [CompanySchema],
        required: true
    },
    name : String,
    salary : String,
    education : String,
    year : String,
    createTime : Number,
    content : String,
    contentkey : Array,
    location : {
        type : [LocationSchema],
        required: true
    }
});

const TaskSchema = new mongoose.Schema({
    job : {
        type : String,
        required: true
    },
    location : {
        type : [LocationSchema],
        required: true
    },
    startNum : {
        type : Number,
        min : 1,
        required: true
    },
    maxNum : {
        type : Number,
        validate : function _valid(v) {
            return v.startNum <= v.maxNum;
        },
        required: true
    }
});

let CompanyModel = mongoose.model('CompanyModel', CompanySchema);
let LocationModel = mongoose.model('LocationModel', LocationSchema);
let JobModel = mongoose.model('JobModel', JobSchema);
let TaskSchema =
