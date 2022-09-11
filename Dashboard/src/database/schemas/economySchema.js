const mongoose = require("mongoose");

const economySchema = new mongoose.Schema({
    serverID: { type: String },
    name: { type: String, require: true },
    usersList: { type: Array, require: true }, // UserID, username, userTag, wallet, items, isWorking, lastTimeWorked/ 
    moneyName: { type: String, require: true },
    topRichest: { type: Array, require: true }, // UserID, username, wallet, jobsCount, totalSalary 

})



const model = mongoose.model("economyModel", economySchema);

module.exports = model;