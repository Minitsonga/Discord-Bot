const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed, Client, Intents, Collection } = require("discord.js");
const fs = require('fs');

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.GUILD_MESSAGES] });




module.exports = {
    data: new SlashCommandBuilder()
        .setName('top')
        .setDescription("J'affiche le top 10 du serveur"),

    category: "leveling",

    async execute(interaction) {


        const levelingModel = require("../models/levelingSchema");
        const leaderboardModel = require("../models/learderboardSchema");

        const channelsPluginsModel = require("../models/channelsPluginsSchema");


        const channelsPlugings = await channelsPluginsModel.findOne({ serverID: interaction.guild.id })


        if (!channelsPlugings || !channelsPlugings.cmdLevelingChannelID) return interaction.reply({ content: `Tu ne peux pas utiliser cette commande ici ! Ressaye dans le channel <#${channelsPlugings.cmdLevelingChannelID}> `, ephemeral: true });
        else if (channelsPlugings && channelsPlugings.cmdLevelingChannelID) {

            if (interaction.channel.id === channelsPlugings.cmdLevelingChannelID) {



                const guildLevelingData = await levelingModel.find({});


                let usersListGuilds = [];
                let Users_Guilds_List = []; // list with all the users guilds
                const curGuildLeaderboard = []; // list with all the current guild users

                guildLevelingData.forEach(user => {

                    usersListGuilds.push(user.serverList);

                })

                usersListGuilds.forEach(user => {

                    for (let i = 0; i < user.length; i++) {
                        const element = user[i];
                        Users_Guilds_List.push(element);
                    }


                })

                Users_Guilds_List.forEach(user => {

                    if (user.serverID === interaction.guild.id) {
                        curGuildLeaderboard.push(user);
                    }
                })

                curGuildLeaderboard.sort(function (x, y) {
                    return y.total_XP - x.total_XP;
                });

                console.log("Data Sorted");
                console.table(curGuildLeaderboard);

                if (curGuildLeaderboard.length <= 0) return interaction.reply({ content: "Personne n'a écrit encore dans ce serveur !", ephemeral: true });

                const leaderboardData = await leaderboardModel.findOne({ serverID: interaction.guild.id });

                if (!leaderboardData) {
                    let leaderboard = await leaderboardModel.create({
                        serverID: interaction.guild.id,
                        leaderList: curGuildLeaderboard,
                    })
                    leaderboard.save();

                    console.log("Creation leaderboard");
                }
                else {

                    await leaderboardModel.findOneAndUpdate({ serverID: interaction.guild.id },
                        {
                            leaderList: curGuildLeaderboard,
                        });
                    console.log("Update leaderboard");
                }

                let listLeaderboard = [];

                for (let i = 0; i < curGuildLeaderboard.length; i++) {
                    listLeaderboard.push(`#${i + 1} : <@${curGuildLeaderboard[i].userID}>  XP : ${curGuildLeaderboard[i].total_XP}\n`)
                }

                let data = listLeaderboard.join("");
                const embed = new MessageEmbed()
                    .setColor('GREEN')
                    .setTitle(`TOP ${curGuildLeaderboard.length}`)
                    .setAuthor(`Leaderboard de  ${interaction.guild.name}`, interaction.guild.iconURL())
                    .setDescription(data)
                    .setTimestamp()
                    .setFooter(interaction.user.username, interaction.user.displayAvatarURL());



                interaction.reply({ embeds: [embed] });
            }
            else{
                return interaction.reply({ content: `Tu ne peux pas utiliser cette commande ici ! Ressaye dans le channel <#${channelsPlugings.cmdLevelingChannelID}> `, ephemeral: true });
            }
        }
        else
        {
            return interaction.reply({ content: `Tu ne peux pas utiliser cette commande ici ! Ressaye dans le channel <#${channelsPlugings.cmdLevelingChannelID}> `, ephemeral: true });
        }

    },
};