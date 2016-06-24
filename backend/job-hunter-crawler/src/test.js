const mongoose = require('mongoose');
require('./model/TaskModel.js');
const Database = require('./db/Database.js');

Database.connect().then(() => {
    mongoose.model('TaskModel').findOne({city: '上海'}).exec((err, doc) => {
        console.log(err);
        console.log(doc);
        doc.maxNum = 1;
        doc.startNum = 1;
        mongoose.model('TaskModel').update({_id:doc._id}, doc, (err) => {
            console.log(err);
        })
    });
});
