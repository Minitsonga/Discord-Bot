const mongoose = require("mongoose");

const channelsPluginsSchema = new mongoose.Schema({
    serverID: { type: String, require: true },
    welcomeChannelID: { type: String, require: true },

    birthDateChannelID: { type: String, require: true },
    cmdBirthDateChannelID: { type: String, require: true },

    levelingUpChannelID: { type: String, require: true },
    cmdLevelingChannelID: { type: String, require: true },
    levelingDeniedChannels:  { type: Array, require: true },
    levelingDeniedRoles:  { type: Array, require: true },
    
    suggestChannelID: { type: String, require: true },

    supportTicketChannelID: { type: String, require: true },
    ticketHolderCategoryID: { type: String, require: true },
    
    creatorVoiceChannelID: { type: String, require: true },
    liveChannelID: { type: String },

    economyChannelID: { type: String, require: true },
    gamblingGamesChannelID: { type: String, require: true },

    hallOfFameChannelID: { type: String, require: true },

    defaultChannelID: { type: String, require: true },
   // default channel will be the one that the user is on (current channel)


})



const model = mongoose.model("channelsPluginsModel", channelsPluginsSchema);

module.exports = model;