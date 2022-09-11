const mongoose = require("mongoose");

const userTicketSchema = new mongoose.Schema({
    serverID: { type: String},
    name: { type: String, require: true },
    icon: { type: String, require: true },
    userTicketList: { type: Array, require: true},


})

const model = mongoose.model("userTicketsModel", userTicketSchema);

module.exports = model;