const mongoose = require("mongoose");

const serverStatsSchema = new mongoose.Schema({
    serverID: { type: String, require: true },
    onlineMembers: { type: String, require: true },
    totalMembers: { type: String, require: true },
    avatar: { type: String, require: true },
    current_commands: { type: Array, require: true },
    channels: { type: Array, require: true },
    guildRoles: { type: Array, require: true },
    commandsCategoryPerms: { type: Array, require: true }, // category, commands [], defaultPerms [], currentPerms[],
    prevCommandsCategoryPerms: { type: Array, require: true },
    supportRole: { type: String, require: true },
    reasonUpdate:  { type: String, require: true },
    needUpdate: { type: Boolean, require: true, default: false },
    timeLastUpdate: { type: Number, require: true },

})

const model = mongoose.model("serverStatsModel", serverStatsSchema);

module.exports = model;