const mongoose = require("mongoose");

const messagesPluginsSchema = new mongoose.Schema({
    serverID: { type: String, require: true },
    welcomeMessage: { type: String, require: true },
    birthdayCelebrateMessage: { type: String, require: true },
    temporaryChannelName: { type: String, require: true },
    levelingUpMessage: { type: String, require: true },
    levelingDefaultColor: { type: String, require: true, default: "#0073ff"},
    ticketName: { type: String, require: true },
    ticketEmbedMessage: { type: String, require: true },
})



const model = mongoose.model("messagesPluginsModel", messagesPluginsSchema);

module.exports = model;