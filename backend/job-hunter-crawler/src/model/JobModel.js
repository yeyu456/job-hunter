const mongoose = require('mongoose');

//const LocationSchema = require('./LocationSchema.js');

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
    content: String,
    contentkey: Array,
    location: {
        type: Number,
        required: true
    }
});

mongoose.model('JobModel', JobSchema);
