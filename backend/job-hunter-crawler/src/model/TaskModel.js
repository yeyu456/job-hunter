const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema({
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
    }
});

const TaskSchema = new mongoose.Schema({
    job: {
        type: String,
        required: true
    },
    location: {
        type: [LocationSchema],
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
    }
});
TaskSchema.index({job : 1, location : 1}, {unique : true});
TaskSchema.pre('validate', function(next) {
    this.updated = Date.now();
    if (this.maxNum < this.startNum) {
        next(Error('invalid max num' + this.maxNum));
    } else {
        next();
    }
});

let TaskModel = mongoose.model('TaskModel', TaskSchema);
TaskModel.on('index', function (error) {
    console.log('on indexing');
    if (error) {
        console.log(error);
    }
});
module.exports = TaskModel;
