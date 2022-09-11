const mongoose = require('mongoose');

const userPreferenceSchema = new mongoose.Schema({
    discordId: { type: String, require: true, unique: true },
    discordTag: { type: String, require: true },
    username: { type: String, require: true},
    avatar: { type: String, require: true },
    guilds: { type: Array, required: true },
    levelingCardBackground: { type: String, require: true},
    levelingCardColor: { type: String, require: true, default: "#0073ff" }
})

const model = mongoose.model("userPreferenceModel", userPreferenceSchema);

module.exports = model;
