const { SlashCommandBuilder } = require("@discordjs/builders");



module.exports = {
    data: new SlashCommandBuilder()
        .setName('rank')
        .setDescription("J'affiche ton niveau et ton rank dans ce serveur")
        .addUserOption(user =>
            user.setName('user')
                .setDescription('Indique la membre dont tu veux voir le rank')
                .setRequired(false)),

    category: "leveling",
    async execute(interaction) {


    },
};