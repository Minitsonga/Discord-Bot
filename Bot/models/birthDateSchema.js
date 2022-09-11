const mongoose = require("mongoose");

const birthDateSchema = new mongoose.Schema({
    serverID: { type: String, require: true},
    name: { type: String, require: true},
    userBirthDates: { type: Array, require: true},
    /*username: { type: String, require: true},
    dayDate: { type: Number, require: true},
    monthDate: { type: Number, require: true},
    yearDate: { type: Number, require: true},
    userID: { type: String, require: true, unique: true },*/
})

const model = mongoose.model("BirthDateModels", birthDateSchema);

module.exports = model;