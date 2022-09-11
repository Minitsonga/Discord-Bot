const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("suggest")
    .setDescription("Suggère des idées pour améliorer le serveur ou pour d'autres sujets")
    .addStringOption(option =>
            option.setName('titre')
                .setDescription("Indique ton titre")
                .setRequired(true))
    .addStringOption((option) =>
      option
        .setName("idée")
        .setDescription("Détaille ton idée")
        .setRequired(true)
    ),

  category: "suggestion",

  async execute(interaction) {
    const channelsPluginsModel = require("../models/channelsPluginsSchema");
    const pluginsSelectedModel = require("../models/pluginsSelectedSchema");

    const plugins = await pluginsSelectedModel.findOne({
      serverID: interaction.guild.id,
    });

    if (!plugins || !plugins.suggestion)
      return interaction.reply({
        content: "Ce plugin n'est pas ativé !",
        ephemeral: true,
      });

    const channelData = await channelsPluginsModel.findOne({
      serverID: interaction.guild.id,
    });

    if (
      !channelData ||
      !channelData.suggestChannelID ||
      channelData.suggestChannelID === "undefined"
    )
      return interaction.reply({
        content: "Oups désolé j'ai fait une erreur ! \nPouvez-vous recommencer",
        ephemeral: true,
      });

    const suggestChannelID = channelData.suggestChannelID;

    const title = interaction.options.getString("titre");
    const suggest = interaction.options.getString("idée");

    if (interaction.channel.id !== suggestChannelID) {
      return interaction.reply({
        content: `Tu n'es pas dans le bon channel. Ressaye dans le channel <#${suggestionChannelID}>`,
        ephemeral: true,
      }); // Tell the user to go in the suggest channel
    } else {
      const embed = new MessageEmbed()
        .setColor("#0099ff")
        .setTitle(suggest)
        .setAuthor(
          `${interaction.user.username} - ${title}`,
          interaction.user.displayAvatarURL()
        )
        .setTimestamp()
        .setFooter(interaction.user.username);

      const message = await interaction.channel.send({ embeds: [embed] });
      message.react("✅");
      message.react("❌");

      interaction.reply({
        content: `<@${interaction.user.id}> Merci pour ta suggestion.`,
        ephemeral: true,
      });
    }
  },
};
