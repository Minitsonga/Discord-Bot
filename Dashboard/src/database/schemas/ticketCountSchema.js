const mongoose = require("mongoose");

const ticketCountSchema = new mongoose.Schema({
    serverID: { type: String, require: true, unique: true },
    ticketCount: { type: Number, require: true }

})


const model = mongoose.model("ticketCountModel", ticketCountSchema);

module.exports = model;