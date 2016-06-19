const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({
    id : {
        type : Number,
        min : 1,
        required : true
    },
    name : {
        type : String,
        required : true
    }
});

const LocationSchema = new mongoose.Schema({
    city : {
        type : String,
        required : true
    },
    dist : {
        type : String,
        required : true
    },
    zone : {
        type : String,
        required : true
    }
});

const JobSchema = new mongoose.Schema({
    id : {
        type : Number,
        min : 1,
        required : true
    },
    company : {
        type : [CompanySchema],
        required : true
    },
    name : {
        type : String,
        required : true
    },
    salary : {
        type : String,
        required : true
    },
    education : {
        type : String,
        required : true
    },
    year : {
        type : String,
        required : true
    },
    createTime : {
        type : Number,
        min : 1,
        required : true
    },
    content : String,
    contentkey : Array,
    location : {
        type : [LocationSchema],
        required : true
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
let TaskModel = mongoose.model('TaskModel', TaskSchema);

module.exports = {
    CompanyModel: CompanyModel,
    LocationModel: LocationModel,
    JobModel: JobModel,
    TaskModel: TaskModel
}
