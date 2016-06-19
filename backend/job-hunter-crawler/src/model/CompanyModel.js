const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({
    id: {
        type: Number,
        min: 1,
        required: true
    },
    name: {
        type: String,
        required: true
    }
});

mongoose.model('CompanyModel', CompanySchema);
