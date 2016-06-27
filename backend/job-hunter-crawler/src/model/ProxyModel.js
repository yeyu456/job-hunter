const mongoose = require('mongoose');

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
    updated: {
        type: Date,
        required: true
    },
    delay: {
        type: Number,
        required: true
    }
}, SCHEMA_OPTIONS);

ProxySchema.index({ip: 1, port: 1, type: 1}, {unique: true, sparse: true});