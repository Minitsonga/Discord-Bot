const { SlashCommandBuilder } = require("@discordjs/builders");
const { Console } = require("console");
const { Permissions } = require("discord.js");
const wait = require('util').promisify(setTimeout);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription("J'efface des messages")
        .addIntegerOption(option =>
            option.setName('nombres')
                .setDescription("Nombre de message a supprimer")
                .setRequired(true)),

    category: "moderator",
    async execute(interaction) {

        const serverStatsModel = require("../models/serverStatsSchema");

        const guildData = await serverStatsModel.findOne({ serverID: interaction.guild.id });

        let curPerms = { "allowRoles": [], "denyRoles": [] };

        if (guildData && guildData.commandsCategoryPerms) {
            guildData.commandsCategoryPerms.forEach(element => {
                if (element.category === this.category) {

                    if (element.currentPerms.allowRoles) {
                        if (element.currentPerms.allowRoles.length <= 0) {
                            console.log("no role allow take default");
                            curPerms.allowRoles = element.defaultPerms.allowRoles;
                        }
                        else {
                            console.log("role allow find");
                            //curPerms.allowRoles = element.defaultPerms.allowRoles;
                            element.currentPerms.allowRoles.forEach(role => {
                                const { name, id } = role;
                                curPerms.allowRoles.push({ name, id });
                            })


                        }

                    }
                    else {
                        console.log("no role allow element take default");
                        curPerms.allowRoles = element.defaultPerms.allowRoles;
                    }

                    if (element.currentPerms.denyRoles) {
                        if (element.currentPerms.denyRoles.length <= 0) {
                            console.log("no denyRoles take default");
                            curPerms.denyRoles = element.defaultPerms.denyRoles;
                        }
                        else {
                            console.log("denyRoles find");
                           // curPerms.denyRoles = element.defaultPerms.denyRoles;
                            element.currentPerms.denyRoles.forEach(role => {
                                const { name, id } = role;
                                curPerms.denyRoles.push({ name, id });
                            })

                        }

                    }
                    else {
                        console.log("no role deny element take default");
                        curPerms.denyRoles = element.defaultPerms.denyRoles;
                    }
                }
            });
        }
        
        console.log(curPerms.allowRoles);
        console.log(curPerms.denyRoles);

        const nbMessages = interaction.options.getInteger('nombres');


        let isAdministrator = false;
        let userCanUseCommand = false;
        for (let i = 0; i < curPerms.allowRoles.length; i++) {
            if (curPerms.allowRoles[i].name === "administrator") {
                console.log("Cheking if admin");
                interaction.member.roles.cache.forEach(role => {
                    const { permissions } = role;
                    if (permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
                        isAdministrator = true;
                    }
                });
            }

            if (interaction.guild.members.cache.get(interaction.user.id).roles.cache.has(curPerms.allowRoles[i].id)) {
                userCanUseCommand = true;
                break;
            }
        }

        if (userCanUseCommand) console.log("user has a role allow");
        if (isAdministrator) console.log("user is admin");

        if (userCanUseCommand || isAdministrator) {

            if (nbMessages <= 0) interaction.reply({ content: `<@${interaction.user.id}> Ecrivez une valeur positive !`, ephemeral: true });
            else if (nbMessages > 100) interaction.reply({ content: `<@${interaction.user.id}> Vous ne pouvez pas supprimmer plus de 100 messages.`, ephemeral: true });
            else {

                await interaction.channel.messages.fetch({ limit: nbMessages }).then(messages => {
                    if (messages.size === 0) return interaction.reply({ content: `Il n'y a aucun message a supprimer`, ephemeral: true });
                    else {
                        interaction.channel.bulkDelete(messages);
                        interaction.reply({ content: `Message(s) supprimé(s) : ${messages.size}`, ephemeral: true });

                    }
                })
            }
        }
        else {
            return interaction.reply({ content: `<@${interaction.user.id}> Vous n'avez pas les permission pour utiliser cette commande !`, ephemeral: true });
        }

    },
};