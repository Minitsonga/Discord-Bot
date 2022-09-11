const mongoose = require("mongoose");

const prevPluginsSchema = new mongoose.Schema({
    serverID: { type: String, require: true },
    welcome: { type: Boolean, require: true, default: false },
    birthday: { type: Boolean, require: true, default: false },
    moderator: { type: Boolean, require: true, default: false },
    suggestion: { type: Boolean, require: true, default: false },
    channelManager: { type: Boolean, require: true, default: false },
    leveling: { type: Boolean, require: true, default: false },
    supportTicket: { type: Boolean, require: true, default: false },
    stream: { type: Boolean, require: true, default: false },
    economy: { type: Boolean, require: true, default: false },
})



const model = mongoose.model("prevPluginsModel", prevPluginsSchema);

module.exports = model;