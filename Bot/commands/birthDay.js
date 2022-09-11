const { SlashCommandBuilder } = require("@discordjs/builders");
const { Permissions } = require("discord.js");

const birthDateModel = require("../models/birthDateSchema");
const channelsPluginsModel = require("../models/channelsPluginsSchema");
const serverStatsModel = require("../models/serverStatsSchema");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('birthday')
        .setDescription("Gestion des anniversaires")
        .addSubcommand(subcommand =>
            subcommand.setName('register')
                .setDescription("Enregistre votre date de naissance")
                .addIntegerOption(option =>
                    option.setName('jour')
                        .setDescription("Votre jour de naissance EN CHIFFRE")
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('mois')
                        .setDescription("Votre mois de naissance EN CHIFFRE")
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('année')
                        .setDescription("Votre année de naissance EN CHIFFRE")
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand.setName('preview')
                .setDescription("Affiche votre date de naissance si vous êtes déjà enregistré"))
        .addSubcommand(subcommand =>
            subcommand.setName('modify')
                .setDescription("Modifie votre date de naissance")
                .addIntegerOption(option =>
                    option.setName('jour')
                        .setDescription("Votre jour de naissance EN CHIFFRE")
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('mois')
                        .setDescription("Votre mois de naissance EN CHIFFRE")
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('année')
                        .setDescription("Votre année de naissance EN CHIFFRE")
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand.setName('delete')
                .setDescription("Supprime votre date de naissance")),

    category: "birthday",

    async execute(interaction) {


        const channelsPlugings = await channelsPluginsModel.findOne({ serverID: interaction.guild.id })

        const serverDataBirthday = await serverStatsModel.findOne({ serverID: interaction.guild.id })


        let isAdministrator = false;

        interaction.member.roles.cache.forEach(role => {
            const { permissions } = role;

            if (permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
                isAdministrator = true;
            }
        });


        let denyRolesList = [];
        serverDataBirthday.commandsCategoryPerms.forEach(element => {
            if (element.category === this.category) {
                denyRolesList = element.currentPerms.denyRoles;
            }
        })

        let userCanUseCommand = true;

        denyRolesList.forEach(role => {

            if (interaction.guild.members.cache.get(interaction.user.id).roles.cache.has(role.id)) {
                userCanUseCommand = false

            }
        })


        if (!userCanUseCommand && !isAdministrator) return interaction.reply({ content: "Vous n'avez pas le droit d'utiliser cette commande ! Désolé", ephemeral: true })

        if (!channelsPlugings || !channelsPlugings.cmdBirthDateChannelID || channelsPlugings.cmdBirthDateChannelID === 'undefined') return interaction.reply({ content: "Oups désolé j'ai fait une erreur ! \nPouvez-vous recommencer", ephemeral: true });

        if (interaction.channel.id !== channelsPlugings.cmdBirthDateChannelID) return interaction.reply({ content: `Vous ne pouvez pas utiliser cette commande ici ! Ressayez dans le channel <#${channelsPlugings.cmdBirthDateChannelID}> `, ephemeral: true });

        if (interaction.options.getSubcommand() === 'register') { // if |A| user use the birthday command 


            const day = interaction.options.getString("jour");
            const month = interaction.options.getString("mois");
            const year = interaction.options.getString("année");

            if (day <= 0 || day > 31 || month <= 0 || month > 12 || year <= 1960) {
                return interaction.reply({ content: "Votre date n'est pas bonne !", ephemeral: true });
            }
            else {
                const dateString = `${day}/${month}/${year}`;

                let dejaLa = false;
                try {
                    const birthData = await birthDateModel.findOne({ serverID: interaction.guild.id });

                    if (!birthData) {
                        let birthDate = await birthDateModel.create({

                            serverID: interaction.guild.id,
                            name: interaction.guild.name,
                            userBirthDates: [{
                                "userID": interaction.user.id,
                                "username": interaction.user.username,
                                "dayDate": day,
                                "monthDate": month,
                                "yearDate": year,
                            }]

                        })
                        birthDate.save();
                        console.log("Je cree");
                        return interaction.reply({ content: `<@${interaction.user.id}> vous êtes née le : ${dateString} \nVotre date est bien enregistré`, ephemeral: true });

                    }
                    else if (birthData && birthData.userBirthDates.length > 0) {

                        let countG = 0;
                        birthData.userBirthDates.forEach(user => {
                            if (user.userID !== interaction.user.id) countG++;
                            else dejaLa = true;
                        })

                        if (dejaLa) return interaction.reply({ content: `Vous êtes déjà enregistré.`, ephemeral: true });
                        else {

                            if (countG >= birthData.userBirthDates.length) {
                                birthData.userBirthDates.push({
                                    "userID": interaction.user.id,
                                    "username": interaction.user.username,
                                    "dayDate": day,
                                    "monthDate": month,
                                    "yearDate": year,
                                })

                            }

                            console.log("nouvel user");
                            interaction.reply({ content: `<@${interaction.user.id}> vous êtes née le : ${dateString} \nVotre date est bien enregistré`, ephemeral: true });

                        }

                        await birthDateModel.findOneAndUpdate({ serverID: interaction.guild.id },
                            {
                                userBirthDates: birthData.userBirthDates
                            }
                        );
                    }

                }
                catch (err) {
                    console.log(err);
                }

            }

        }

        if (interaction.options.getSubcommand() === 'modify') {

            
            const day = interaction.options.getString("jour");
            const month = interaction.options.getString("mois");
            const year = interaction.options.getString("année");


            if (day > 29 && month == 2) {
                return interaction.reply({ content: "Votre date n'est pas bonne !", ephemeral: true });
            }

            if (day <= 0 || day > 31 || month <= 0 || month > 12 || year <= 1960) {
                return interaction.reply({ content: "Votre date n'est pas bonne !", ephemeral: true });
            }
            else {
                const birthData = await birthDateModel.findOne({ serverID: interaction.guild.id });

                let count = 0;
                birthData.userBirthDates.forEach(user => {
                    if (user.userID === interaction.user.id) {
                        user.dayDate = day;
                        user.monthDate = month;
                        user.yearDate = year;
                    }
                    else count++;

                })
                await birthDateModel.findOneAndUpdate({ serverID: interaction.guild.id },
                    {
                        userBirthDates: birthData.userBirthDates
                    }
                );

                if (count >= birthData.userBirthDates.length) return interaction.reply({ content: "Vous n'êtes pas enregistré !", ephemeral: true });

            }
            console.log("Je modifie");
        }


        if (interaction.options.getSubcommand() === "preview") {


            let birthData = await birthDateModel.findOne({ serverID: interaction.guild.id, });

            if (!birthData) {
                interaction.reply({ content: "Vous n'êtes pas enregistré !", ephemeral: true });
                return;
            }
            else {
                let dateString;
                birthData.userBirthDates.forEach(user => {
                    if (user.userID === interaction.user.id) {
                        dateString = `${user.dayDate}/${user.monthDate}/${user.yearDate}`
                    }
                })

                interaction.reply({ content: `Votre date d'anniversaire est le : ${dateString}`, ephemeral: true });
            }
        }


        if (interaction.options.getSubcommand() === "delete") {
            const birthData = await birthDateModel.findOne({ serverID: interaction.guild.id });

            let count = 0;
            birthData.userBirthDates.forEach((user, count) => {
                if (user.userID === interaction.user.id) {
                    birthData.userBirthDates.slice(count, 1);
                }
                else count++;

            })
            await birthDateModel.findOneAndUpdate({ serverID: interaction.guild.id },
                {
                    userBirthDates: birthData.userBirthDates
                }
            );

            if (count >= birthData.userBirthDates.length) return interaction.reply({ content: "Vous n'êtes pas enregistré !", ephemeral: true });

        }

    },

};