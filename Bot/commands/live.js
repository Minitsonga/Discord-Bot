const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {

    data:
        new SlashCommandBuilder()
            .setName('live')
            .setDescription("J'envoi une annonce générale ")
            .addSubcommand(subcommand =>
                subcommand.setName('auto')
                    .setDescription("Message pré-enregistré d'annonce de live"))
            .addSubcommand(subcommand =>
                subcommand.setName('personnalisé')
                    .setDescription("Message personnalisé")
                    .addStringOption(option =>
                        option.setName('text')
                            .setDescription("Indique le text de ton annonce")
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName('url')
                            .setDescription("Indique le lien de la chaine")
                            .setRequired(true))),

    category: "stream",

    async execute(interaction) {

      
        const pluginsSelectedModel = require("../models/pluginsSelectedSchema");
        const serverStatsModel = require("../models/serverStatsSchema");
        const channelsPluginsModel = require("../models/channelsPluginsSchema");

        console.log(interaction.commandName);



        const channelsPlugings = await channelsPluginsModel.findOne({ serverID: interaction.guild.id })


            if (interaction.channel.id === channelsPlugings.liveChannelID) {


                if (interaction.options.getSubcommand() === 'auto') {
                    // creation of the auto message
                    interaction.channel.send({ content: `:red_circle: EN LIVE @everyone \n \n https://www.twitch.tv/laexo` });
                }
                else {
                    //Creation of the manual message

                    const text = interaction.options.getString('text');
                    const url = interaction.options.getString('url');

                    interaction.channel.send({ content: `${text} @everyone\n \n ${url}` });
                }
                interaction.reply({ content: "Message envoyé !", ephemeral: true });
            }
            else {
                return interaction.reply({ content: `Tu n'es pas dans le bon channel. Ressaye dans le channel <#${ channelsPlugings.liveChannelID}>`, ephemeral: true });
            }
       

    }
};