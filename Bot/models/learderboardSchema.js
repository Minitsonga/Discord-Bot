const mongoose = require("mongoose");

const leaderboardSchema = new mongoose.Schema({
    serverID: { type: String, require: true },
    leaderList: { type: Array, require: true },
   

})



const model = mongoose.model("leaderboardModel", leaderboardSchema);

module.exports = model;