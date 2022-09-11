const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageActionRow, MessageButton } = require("discord.js");

const button = new MessageActionRow()
  .addComponents(
    new MessageButton()
      .setURL("https://www.youtube.com/channel/UCCGVj8MHW-2cn8tYJJ-0AdA")
      .setLabel("Youtube")
      .setStyle("LINK")
  )
  .addComponents(
    new MessageButton()
      .setURL("https://www.twitch.tv/laexo")
      .setLabel("Twitch")
      .setStyle("LINK")
  )
  .addComponents(
    new MessageButton()
      .setURL("https://www.instagram.com/laexo18")
      .setLabel("Instagram ")
      .setStyle("LINK")
  )
  .addComponents(
    new MessageButton()
      .setURL("https://twitter.com/laexo18")
      .setLabel("Twitter")
      .setStyle("LINK")
  )
  .addComponents(
    new MessageButton()
      .setURL("https://www.tiktok.com/@laexo18")
      .setLabel("TikTok")
      .setStyle("LINK")
  );

module.exports = {
  data: new SlashCommandBuilder()
    .setName("liens")
    .setDescription("Les liens de tous les réseaux de Laexo"),

  category: "global",
  async execute(interaction) {
    return interaction.reply({
      content: "Les réseaux de **Laexo**:",
      components: [button],
    });
  },
};
