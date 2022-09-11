const mongoose = require("mongoose");

const levelingSchema = new mongoose.Schema({
    userID: { type: String},
    username: { type: String, require: true },
    serverList: { type: Array, require: true },

})



const model = mongoose.model("levelingModel", levelingSchema);

module.exports = model;