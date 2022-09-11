const { Permissions, MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');


let ticketNumber = 0;
let wantToCloseTicket = false // become true when user pressed button close ticket

const ticketHelper = new MessageEmbed()
    .setColor('#0042FF')
    .setTitle(`Un modérateur arrive pour t'aider.\n Pour fermer le ticket tu peux utiliser le bouton juste en dessous`);


const ticketCloseButton = new MessageActionRow()
    .addComponents(
        new MessageButton()
            .setCustomId('closeticket')
            .setLabel('Fermer le ticket')
            .setStyle('PRIMARY')
            .setEmoji('🔒'));

const confirmCloseButton = new MessageActionRow()
    .addComponents(
        new MessageButton()
            .setCustomId('confirmcloseticket')
            .setLabel('Fermer')
            .setStyle('DANGER'),
        new MessageButton()
            .setCustomId('cancel')
            .setLabel('Annuler')
            .setStyle('SECONDARY'));


module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {


        const userTicketsModel = require("../models/userTicketSchema");
        const ticketCountModel = require("../models/ticketCountSchema");

        const serverStatsModel = require("../models/serverStatsSchema");
        const channelsPluginsModel = require("../models/channelsPluginsSchema");
        const messagesPluginsModel = require("../models/messagesPluginsSchema");
        const pluginsModel = require("../models/pluginsSelectedSchema");

        const plugins = await pluginsModel.findOne({ serverID: interaction.guild.id })

        if(!plugins) return
        else if(plugins && !plugins.supportTicket) return;


        const ticketData = await messagesPluginsModel.findOne({ serverID: interaction.guild.id })
        const ticketNameData = (ticketData) ? ticketData.ticketName : ticketData;

        const channelTicketData = await channelsPluginsModel.findOne({ serverID: interaction.guild.id })
        const ticketCategory = channelTicketData.ticketHolderCategoryID; //Category of waiting ticket 

        const serverData = await serverStatsModel.findOne({ serverID: interaction.guild.id })
        const supportRole = (serverData) ? serverData.supportRole : serverData;



        //const ticketName;

        const ticketClosedEmbed = new MessageEmbed()
            .setColor('#FFC300')
            .setDescription(`Ticket fermé par <@${interaction.user.id}>`);

        const deleteChannelEmbed = new MessageEmbed()
            .setColor('#FF0000')
            .setDescription(`Le channel sera supprimé dans quelques secondes`);

        const deleteChannelButton = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('deleteticket')
                    .setLabel('Supprimer')
                    .setStyle('DANGER'));

        let ticketChannel = null;
        let ticketIsClosed = false; // type: Boolean

        let isAdministrator = false;
        interaction.member.roles.cache.forEach(role => {
            const { permissions } = role;
            if (permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
                isAdministrator = true;
            }
        });
        const currentUser = { "username": interaction.user.username, "userID": interaction.user.id, isAdministrator };
        //console.log(currentUser);

        if (interaction.customId === 'openticket') {

            try {

                const guildTicketData = await userTicketsModel.findOne({ serverID: interaction.guild.id });

                if (!guildTicketData || !guildTicketData.userTicketList) {
                    console.log("new guild");
                    let dataGuildTicket = await userTicketsModel.create(
                        {
                            serverID: interaction.guild.id,
                            name: interaction.guild.name,
                            icon: interaction.guild.icon,
                            userTicketList: []
                        })
                    dataGuildTicket.save();

                }
                else if (guildTicketData && guildTicketData.userTicketList.length > 0) {

                    let hasAlreadyOpenedTicket = false;
                    guildTicketData.userTicketList.forEach(element => {
                        if (element.userID === interaction.user.id) {
                            hasAlreadyOpenedTicket = true;
                        }
                    });
                    if (hasAlreadyOpenedTicket) return interaction.reply({ content: "Vous avez déjà ouvert un ticket", ephemeral: true });
                }


                const serverTicketCountData = await ticketCountModel.findOne({ serverID: interaction.guild.id })
                if (!serverTicketCountData) {
                    console.log("creation tiket")
                    let serverTicketCountData = await ticketCountModel.create({
                        serverID: interaction.guild.id,
                        ticketCount: ticketNumber
                    })
                    serverTicketCountData.save();
                }
                else {
                    ticketNumber = serverTicketCountData.ticketCount;
                }


                ticketNumber++;
                await ticketCountModel.findOneAndUpdate({ serverID: interaction.guild.id }, { ticketCount: ticketNumber });

                let ticketName = ticketNameData;

                if (ticketNameData.includes("{index}")) {

                    ticketName = ticketNameData.replace("{index}", `${ticketNumber}`);

                }

                if (ticketNameData.includes("{user}")) {

                    ticketName = ticketNameData.replace("{user}", `${interaction.user.username}`);
                }


                console.log(ticketName);
                interaction.guild.channels.create(ticketName, { // Creation of ticket channel
                    type: "GUILD_TEXT",
                    parent: ticketCategory,
                    permissionOverwrites: [
                        {
                            id: interaction.user.id,
                            allow: [Permissions.FLAGS.VIEW_CHANNEL],
                        },
                        {
                            id: supportRole,
                            allow: [Permissions.FLAGS.VIEW_CHANNEL],
                        },
                        {
                            id: interaction.guild.id,
                            deny: [Permissions.FLAGS.VIEW_CHANNEL],
                        },
                    ],

                }).then(async (channel) => {
                    channel.send({ content: `<@&${supportRole}> ! <@${interaction.user.id}> a besoin de votre aide !`, embeds: [ticketHelper], components: [ticketCloseButton] });

                    const guildTicket = await userTicketsModel.findOne({ serverID: interaction.guild.id });

                    if (guildTicket.userTicketList.length <= 0) {

                        await userTicketsModel.findOneAndUpdate({ serverID: interaction.guild.id },
                            {
                                userTicketList: [{ "userID": interaction.user.id, "userTag": interaction.user.tag, "username": interaction.user.username, "avatar": interaction.user.avatar, "ticketChannelID": channel.id, "ticketNb": ticketNumber, ticketIsClosed }]
                            })
                    }
                    else {
                        let userTicketListData = [];

                        guildTicket.userTicketList.forEach(element => {
                            userTicketListData.push(element);

                        });
                        userTicketListData.push({ "userID": interaction.user.id, "userTag": interaction.user.tag, "username": interaction.user.username, "avatar": interaction.user.avatar, "ticketChannelID": channel.id, "ticketNb": ticketNumber, ticketIsClosed })
                        await userTicketsModel.findOneAndUpdate({ serverID: interaction.guild.id },
                            {
                                userTicketList: userTicketListData
                            })
                    }

                    interaction.reply({ content: `Ticket créé, rejoignez le channel : <#${channel.id}>`, ephemeral: true });

                });

            } catch (err) { console.log(err) };
        }
        else {
            try {
                const guildTicketData = await userTicketsModel.findOne({ serverID: interaction.guild.id });


                if (guildTicketData && interaction.customId === 'closeticket') {

                    if (!wantToCloseTicket) {

                        console.log("closeTicket");
                        let cur_TicketData = {};
                        guildTicketData.userTicketList.forEach(element => {

                            if (element.ticketChannelID === interaction.channel.id) cur_TicketData = element;

                        });

                        if (interaction.member.roles.cache.has(supportRole) || currentUser.isAdministrator) {

                            if (currentUser.isAdministrator) console.log("Closed by admin ");
                            if (interaction.member.roles.cache.has(supportRole)) console.log("Closed by  support ");
                            if (interaction.user.id === cur_TicketData.userID) console.log("Closed by creator ticket")
                            ticketChannel = interaction.channel;

                            wantToCloseTicket = true;
                            interaction.reply({ content: "Voulez-vous vraiment fermer ce ticket ?", components: [confirmCloseButton] });

                        }
                        else {
                            interaction.reply({ content: "Vous n'avez pas le droit de fermer ce ticket", ephemeral: true });
                        }

                    }
                    else {
                        interaction.reply({ content: "Vous avez déjà fermé ce ticket", ephemeral: true });
                    }
                }

                if (interaction.customId === 'confirmcloseticket') {

                    ticketChannel = interaction.channel;

                    const guildTicketData = await userTicketsModel.findOne({ serverID: interaction.guild.id });

                    const dataTicketList = []
                    let curTicketData = {};

                    guildTicketData.userTicketList.forEach(element => {
                        dataTicketList.push(element);

                    });

                    dataTicketList.forEach(element => {
                        if (element.ticketChannelID === interaction.channel.id) {
                            element.ticketIsClosed = true;
                            curTicketData = element;
                        }
                    })
                    console.log("ticket close = ", curTicketData)
                    await userTicketsModel.findOneAndUpdate({ serverID: interaction.guild.id },
                        {
                            userTicketList: dataTicketList
                        })

                    ticketChannel.messages.fetch({ limit: 1 }).then(messages => {
                        ticketChannel.bulkDelete(messages);
                    })

                    await ticketChannel.send({ embeds: [ticketClosedEmbed] });

                    await ticketChannel.permissionOverwrites.set([
                        {
                            id: interaction.guild.id,
                            deny: [Permissions.FLAGS.VIEW_CHANNEL, Permissions.FLAGS.SEND_MESSAGES],
                        },
                        {
                            id: curTicketData.userID,
                            deny: [Permissions.FLAGS.VIEW_CHANNEL],
                        },
                        {
                            id: supportRole,
                            allow: [Permissions.FLAGS.VIEW_CHANNEL],
                        }

                    ]);


                    ticketChannel.setName(`closed-${curTicketData.ticketNb}`); // getting info;

                    await ticketChannel.send({ content: "Voulez vous le supprimer ?", components: [deleteChannelButton] });


                }

                if (interaction.customId === 'cancel') {

                    interaction.channel.messages.fetch({ limit: 1 }).then(messages => {
                        interaction.channel.bulkDelete(messages);
                    })
                    wantToCloseTicket = false;
                }


                if (interaction.customId === 'deleteticket') {

                    interaction.channel.messages.fetch({ limit: 1 }).then(messages => {
                        interaction.channel.bulkDelete(messages);
                    })

                    const wait = require('util').promisify(setTimeout);
                    ticketChannel = interaction.channel;
                    await ticketChannel.send({ embeds: [deleteChannelEmbed] });
                    await wait(3000);

                    const guildTicketData = await userTicketsModel.findOne({ serverID: interaction.guild.id });

                    const dataTicketList = []

                    guildTicketData.userTicketList.forEach(element => {
                        dataTicketList.push(element);

                    });
                    console.log("avant delete", dataTicketList)
                    dataTicketList.forEach((element) => {
                        if (element.ticketChannelID === interaction.channel.id) {
                            dataTicketList.pop(element)
                        }
                    })
                    console.log("apres delete", dataTicketList)
                    await userTicketsModel.findOneAndUpdate({ serverID: interaction.guild.id },
                        {
                            userTicketList: dataTicketList
                        })


                    ticketChannel.delete();
                    wantToCloseTicket = false;

                }

                console.log(`${interaction.user.tag} in #${interaction.channel.name} triggered an interaction.`);
            } catch (err) { console.log(err) };
        }


    },
};