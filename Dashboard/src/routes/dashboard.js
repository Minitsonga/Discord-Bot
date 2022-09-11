const router = require('express').Router();

const { getBotGuilds } = require("../utils/api");
const { getMutualGuilds } = require("../utils/utils");
const User = require("../database/schemas/UserPreferences");
const leaderboardModel = require("../database/schemas/learderboardSchema");

const pluginsSelectedModel = require("../../src/database/schemas/pluginsSelectedSchema");
const serverStatsModel = require("../../src/database/schemas/serverStatsSchema");
const channelPluginsModel = require("../../src/database/schemas/channelsPluginsSchema");
const messagesPluginsModel = require("../../src/database/schemas/messagesPluginsSchema");

const prevPluginsModel = require("../database/schemas/prevPluginsSchema");

const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.GUILD_MESSAGES] });


client.login(process.env.DISCORD_BOT_TOKEN);



router.get('/', async (req, res) => {
    if (req.user) {

        const botGuilds = await getBotGuilds();
        const user = await User.findOne({ discordId: req.user.discordId });
        let url = req.originalUrl;
        if (user) {
            const userGuilds = user.get('guilds');
            const mutualGuilds = getMutualGuilds(userGuilds, botGuilds)
            res.render('mainDashboard/dashboard', { url, user: req.user, includedGuilds: mutualGuilds.included, excludedGuilds: mutualGuilds.excluded });
        }
        else {
            res.redirect('/auth/discord/redirect');
        }


    }
    else {
        res.redirect('/auth/discord/redirect');
    }

});


router.get('/:id', async (req, res) => {
    if (req.user) {
        const cur_guild_ID = req.params.id;

        let url = req.originalUrl;

        if (!client.guilds.cache.get(cur_guild_ID)) res.redirect('/dashboard');


        const leaderboardData = await leaderboardModel.findOne({ serverID: cur_guild_ID });
        let leaderboardList;
        if (!leaderboardData) leaderboardList = null;
        else leaderboardList = leaderboardData.leaderList;

        const pluginsData = await pluginsSelectedModel.findOne({ serverID: cur_guild_ID });

        if (!pluginsData) {
            let newPlugins = await pluginsSelectedModel.create({
                serverID: cur_guild_ID,
            })

            newPlugins.save();
        }

        const channelsPluginsData = await channelPluginsModel.findOne({ serverID: cur_guild_ID });

        if (!channelsPluginsData) {
            let newChannels = await channelPluginsModel.create({
                serverID: cur_guild_ID,
            })

            newChannels.save();
        }

        const messagesPluginsData = await messagesPluginsModel.findOne({ serverID: cur_guild_ID });

        if (!messagesPluginsData) {
            let newMSGPlugins = await messagesPluginsModel.create({
                serverID: cur_guild_ID,
                welcomeMessage: "Hey {user}, welcome to **{server}**!",
                birthdayCelebrateMessage: "{user} 🎉 Joyeux Anniversaire 🎉 !!  🎊  {age} ans ❤️ 🎊  \n C'est ton jour ! Profite un max et n'hésite pas a partager ta journée avec nous",

            })

            newMSGPlugins.save();
        }

        const prevPlugins = await prevPluginsModel.findOne({ serverID: cur_guild_ID });

        if (!prevPlugins) {
            let prevPlugins = await prevPluginsModel.create({
                serverID: cur_guild_ID,
            })

            prevPlugins.save();
        }
        const serverStats = await serverStatsModel.findOne({ serverID: cur_guild_ID });

        req.user.guilds.forEach(guild => {

            if (guild.id === cur_guild_ID) {
                res.render('guildDashboard/guildSettings', { url, guild, user: req.user, leaderList: leaderboardList, pluginsData, prevPlugins, serverStats });
            }

        });



    }
    else {
        res.redirect('/auth/discord/redirect');
    }
});

router.get('/:id/plugins', (req, res) => {

    res.redirect(`/dashboard`);
});

router.post('/:id', async (req, res) => {
    const cur_guild_ID = req.params.id;
    const reasonUpdate = req.body.reasonUpdate;
    if (!client.guilds.cache.get(cur_guild_ID)) res.redirect('/dashboard');
    console.log("updated apllied");


    await serverStatsModel.findOneAndUpdate({ serverID: cur_guild_ID }, { needUpdate: true, reasonUpdate });
});



router.get('/:id/plugins/welcome', (req, res) => {
    if (req.user) {

        const cur_guild_ID = req.params.id;
        let url = req.originalUrl;

        if (!client.guilds.cache.get(cur_guild_ID)) res.redirect('/dashboard');

        req.user.guilds.forEach(async (guild) => {

            if (guild.id === cur_guild_ID) {


                const pluginsData = await pluginsSelectedModel.findOne({ serverID: guild.id });
                const guildStats = await serverStatsModel.findOne({ serverID: guild.id });

                if (!guildStats) res.redirect('/dashboard');


                const messagesPlugins = await messagesPluginsModel.findOne({ serverID: cur_guild_ID });
                let welcomeMessage = (messagesPlugins) ? messagesPlugins.welcomeMessage : messagesPlugins;

                const channelsPluginsData = await channelPluginsModel.findOne({ serverID: cur_guild_ID });
                let welcomeChannelID = (channelsPluginsData) ? channelsPluginsData.welcomeChannelID : channelsPluginsData;

                res.render('plugins/welcome', { url, guild, user: req.user, pluginsData, guildStats, welcomeMessage, welcomeChannelID });
            }
        });
    }
    else {
        res.redirect('/auth/discord/redirect');
    }
});

router.get('/:id/plugins/birthday', (req, res) => {
    if (req.user) {

        const cur_guild_ID = req.params.id;
        let url = req.originalUrl;

        if (!client.guilds.cache.get(cur_guild_ID)) res.redirect('/dashboard');

        req.user.guilds.forEach(async (guild) => {

            if (guild.id === cur_guild_ID) {

                const pluginsData = await pluginsSelectedModel.findOne({ serverID: guild.id });
                const guildStats = await serverStatsModel.findOne({ serverID: guild.id });
                if (!guildStats) res.redirect('/dashboard');

                const messagesPlugins = await messagesPluginsModel.findOne({ serverID: cur_guild_ID });
                let autoBirthdayMessage = (messagesPlugins) ? messagesPlugins.birthdayCelebrateMessage : messagesPlugins;

                const channelsPluginsData = await channelPluginsModel.findOne({ serverID: cur_guild_ID });
                let autoBirthdayChannelID = (channelsPluginsData) ? channelsPluginsData.birthDateChannelID : channelsPluginsData;
                let cmdBirthdayChannelID = (channelsPluginsData) ? channelsPluginsData.cmdBirthDateChannelID : channelsPluginsData;


                let curDenyRoles = {};

                guildStats.commandsCategoryPerms.forEach(element => {
                    if (element.category === "birthday") {

                        if (!element.currentPerms.denyRoles || element.currentPerms.denyRoles.length <= 0) {
                            curDenyRoles = element.defaultPerms.denyRoles;
                        }
                        else curDenyRoles = element.currentPerms.denyRoles;


                    }
                })

                console.log("curDenyRoles", curDenyRoles)

                res.render('plugins/birthday', { url, guild, user: req.user, pluginsData, guildStats, autoBirthdayChannelID, cmdBirthdayChannelID, autoBirthdayMessage, curDenyRoles });
            }
        });
    }
    else {
        res.redirect('/auth/discord/redirect');
    }
});

router.get('/:id/plugins/moderator', (req, res) => {
    if (req.user) {

        const cur_guild_ID = req.params.id;
        let url = req.originalUrl;

        if (!client.guilds.cache.get(cur_guild_ID)) res.redirect('/dashboard');

        req.user.guilds.forEach(async (guild) => {

            if (guild.id === cur_guild_ID) {


                const pluginsData = await pluginsSelectedModel.findOne({ serverID: guild.id });
                const guildStats = await serverStatsModel.findOne({ serverID: guild.id });
                if (!guildStats) res.redirect('/dashboard');

                let curPerms = {};

                guildStats.commandsCategoryPerms.forEach(element => {
                    if (element.category === "moderator") {
                        if (!element.currentPerms.allowRoles || element.currentPerms.allowRoles.length <= 0) {
                            curPerms = element.defaultPerms.allowRoles;
                        }
                        else curPerms = element.currentPerms.allowRoles;

                    }
                })
                console.log("curPerms", curPerms)

                res.render('plugins/moderator', { url, guild, user: req.user, pluginsData, guildStats, curPerms });
            }
        });

    }
    else {
        res.redirect('/auth/discord/redirect');
    }
});

router.get('/:id/plugins/suggest', (req, res) => {
    if (req.user) {

        const cur_guild_ID = req.params.id;
        let url = req.originalUrl;

        if (!client.guilds.cache.get(cur_guild_ID)) res.redirect('/dashboard');

        req.user.guilds.forEach(async (guild) => {

            if (guild.id === cur_guild_ID) {


                const pluginsData = await pluginsSelectedModel.findOne({ serverID: guild.id });
                const guildStats = await serverStatsModel.findOne({ serverID: guild.id });


                const channelsPluginsData = await channelPluginsModel.findOne({ serverID: cur_guild_ID });
                let suggestChannelID = (channelsPluginsData) ? channelsPluginsData.suggestChannelID : channelsPluginsData;
                res.render('plugins/suggestion', { url, guild, user: req.user, pluginsData, guildStats, suggestChannelID });
            }
        });
    }
    else {
        res.redirect('/auth/discord/redirect');
    }
});

router.get('/:id/plugins/temporaryChannel', (req, res) => {
    if (req.user) {

        const cur_guild_ID = req.params.id;
        let url = req.originalUrl;

        if (!client.guilds.cache.get(cur_guild_ID)) res.redirect('/dashboard');

        req.user.guilds.forEach(async (guild) => {

            if (guild.id === cur_guild_ID) {


                const pluginsData = await pluginsSelectedModel.findOne({ serverID: guild.id });
                const guildStats = await serverStatsModel.findOne({ serverID: guild.id });


                const messagesPlugins = await messagesPluginsModel.findOne({ serverID: cur_guild_ID });
                let temporaryChannelName = (messagesPlugins) ? messagesPlugins.temporaryChannelName : messagesPlugins;

                const channelsPluginsData = await channelPluginsModel.findOne({ serverID: cur_guild_ID });
                let createrVoiceChannel = (channelsPluginsData) ? channelsPluginsData.creatorVoiceChannelID : channelsPluginsData;

                res.render('plugins/temporaryChannels', { url, guild, user: req.user, pluginsData, guildStats, createrVoiceChannel, temporaryChannelName });
            }
        });
    }
    else {
        res.redirect('/auth/discord/redirect');
    }
});

router.get('/:id/plugins/leveling', (req, res) => {
    if (req.user) {

        const cur_guild_ID = req.params.id;
        let url = req.originalUrl;

        if (!client.guilds.cache.get(cur_guild_ID)) res.redirect('/dashboard');

        req.user.guilds.forEach(async (guild) => {

            if (guild.id === cur_guild_ID) {


                const pluginsData = await pluginsSelectedModel.findOne({ serverID: guild.id });
                const guildStats = await serverStatsModel.findOne({ serverID: guild.id });


                const messagesPlugins = await messagesPluginsModel.findOne({ serverID: cur_guild_ID });
                let levelingUpMessage = (messagesPlugins) ? messagesPlugins.levelingUpMessage : messagesPlugins;
                let levelingDefaultColor = (messagesPlugins) ? messagesPlugins.levelingDefaultColor : messagesPlugins;

                const channelsPluginsData = await channelPluginsModel.findOne({ serverID: cur_guild_ID });
                let levelingUpChannelID = (channelsPluginsData) ? channelsPluginsData.levelingUpChannelID : channelsPluginsData;
                let cmdLevelingChannelID = (channelsPluginsData) ? channelsPluginsData.cmdLevelingChannelID : channelsPluginsData;

                /*const userData = await User.findOne({ discordId: req.user.discordId });
                let userColor = (userData) ? userData.user_color_Pref : userData;*/

                res.render('plugins/leveling', { url, guild, user: req.user, pluginsData, guildStats, levelingUpMessage, levelingUpChannelID, cmdLevelingChannelID, levelingDefaultColor });
            }
        });
    }
    else {
        res.redirect('/auth/discord/redirect');
    }
});

router.get('/:id/plugins/supportTicket', (req, res) => {
    if (req.user) {

        const cur_guild_ID = req.params.id;

        if (!client.guilds.cache.get(cur_guild_ID)) res.redirect('/dashboard');

        let url = req.originalUrl;
        req.user.guilds.forEach(async (guild) => {

            if (guild.id === cur_guild_ID) {


                const pluginsData = await pluginsSelectedModel.findOne({ serverID: guild.id });
                const guildStats = await serverStatsModel.findOne({ serverID: guild.id });

                const { supportRole } = guildStats;

                const messagesPlugins = await messagesPluginsModel.findOne({ serverID: cur_guild_ID });
                const ticketName = (messagesPlugins) ? messagesPlugins.ticketName : messagesPlugins;


                const channelsPluginsData = await channelPluginsModel.findOne({ serverID: cur_guild_ID });
                const supportTicketChannelID = (channelsPluginsData) ? channelsPluginsData.supportTicketChannelID : channelsPluginsData;
                const categoryTicket = (channelsPluginsData) ? channelsPluginsData.ticketHolderCategoryID : channelsPluginsData;

                res.render('plugins/supportTicket', { url, guild, user: req.user, pluginsData, guildStats, ticketName, categoryTicket, supportTicketChannelID, supportRole });
            }
        });
    }
    else {
        res.redirect('/auth/discord/redirect');
    }
});

router.get('/:id/plugins/stream', (req, res) => {
    if (req.user) {

        const cur_guild_ID = req.params.id;
        let url = req.originalUrl;

        if (!client.guilds.cache.get(cur_guild_ID)) res.redirect('/dashboard');

        req.user.guilds.forEach(async (guild) => {

            if (guild.id === cur_guild_ID) {


                const pluginsData = await pluginsSelectedModel.findOne({ serverID: guild.id });
                const guildStats = await serverStatsModel.findOne({ serverID: guild.id });
                if (!guildStats) res.redirect('/dashboard');

                let curPerms = {};

                guildStats.commandsCategoryPerms.forEach(element => {
                    if (element.category === "stream") {
                        if (!element.currentPerms.allowRoles || element.currentPerms.allowRoles.length <= 0) {
                            curPerms = element.defaultPerms.allowRoles;
                        }
                        else curPerms = element.currentPerms.allowRoles;

                    }
                })
                console.log("curPerms", curPerms)

                const channelsPluginsData = await channelPluginsModel.findOne({ serverID: cur_guild_ID });
                let liveChannelID = (channelsPluginsData) ? channelsPluginsData.liveChannelID : channelsPluginsData;

                res.render('plugins/stream', { url, guild, user: req.user, pluginsData, guildStats, curPerms, liveChannelID });
            }
        });

    }
    else {
        res.redirect('/auth/discord/redirect');
    }
});

router.get('/:id/plugins/economy', (req, res) => {
    if (req.user) {

        const cur_guild_ID = req.params.id;
        let url = req.originalUrl;

        if (!client.guilds.cache.get(cur_guild_ID)) res.redirect('/dashboard');

        req.user.guilds.forEach(async (guild) => {

            if (guild.id === cur_guild_ID) {


                const pluginsData = await pluginsSelectedModel.findOne({ serverID: guild.id });
                const guildStats = await serverStatsModel.findOne({ serverID: guild.id });


                const channelsPluginsData = await channelPluginsModel.findOne({ serverID: cur_guild_ID });
                let economyChannelID = (channelsPluginsData) ? channelsPluginsData.economyChannelID : channelsPluginsData;
                let gamblingGamesChannelID = (channelsPluginsData) ? channelsPluginsData.gamblingGamesChannelID : channelsPluginsData;

                let curDenyRoles = {};

                guildStats.commandsCategoryPerms.forEach(element => {
                    if (element.category === "birthday") {

                        if (!element.currentPerms.denyRoles || element.currentPerms.denyRoles.length <= 0) {
                            curDenyRoles = element.defaultPerms.denyRoles;
                        }
                        else curDenyRoles = element.currentPerms.denyRoles;


                    }
                })

                console.log("curDenyRoles", curDenyRoles)

                res.render('plugins/economy', { url, guild, user: req.user, pluginsData, guildStats, economyChannelID, gamblingGamesChannelID, curDenyRoles });
            }
        });
    }
    else {
        res.redirect('/auth/discord/redirect');
    }
});


router.post('/:id/plugins/welcome', async (req, res) => {

    if (req.user) {
        const cur_guild_ID = req.params.id;
        let pluginIsActivated = req.body.plugin;
        let channelChosen = req.body.channel_ID;
        let message = req.body.message;

        if (!client.guilds.cache.get(cur_guild_ID)) res.redirect('/dashboard');

        if (pluginIsActivated) {

            console.log(pluginIsActivated, message, channelChosen);

            await pluginsSelectedModel.findOneAndUpdate({ serverID: cur_guild_ID }, { welcome: pluginIsActivated });

            const channelsPluginsData = await channelPluginsModel.findOne({ serverID: cur_guild_ID });

            if (channelChosen) {
                console.log(channelChosen);
                if (!channelsPluginsData) {
                    let newChannelsPlugins = await channelPluginsModel.create({
                        serverID: cur_guild_ID,
                        welcomeChannelID: channelChosen
                    });
                    newChannelsPlugins.save();
                }
                else {
                    await channelPluginsModel.findOneAndUpdate({ serverID: cur_guild_ID }, {
                        welcomeChannelID: channelChosen,
                    });

                }
            }


            const messagesPluginsData = await messagesPluginsModel.findOne({ serverID: cur_guild_ID });

            if (!messagesPluginsData) {
                let newMessagesPlugins = await messagesPluginsModel.create({
                    serverID: cur_guild_ID,
                    welcomeMessage: message,
                });
                newMessagesPlugins.save();
            }
            else {
                await messagesPluginsModel.findOneAndUpdate({ serverID: cur_guild_ID }, {
                    welcomeMessage: message,
                });

            }

        } else {
            await pluginsSelectedModel.findOneAndUpdate({ serverID: cur_guild_ID }, { welcome: pluginIsActivated });
        }


        res.send("Updated");
    }
    else {
        res.redirect('/auth/discord/redirect');
    }

});

router.post('/:id/plugins/birthday', async (req, res) => {

    if (req.user) {
        const cur_guild_ID = req.params.id;

        if (!client.guilds.cache.get(cur_guild_ID)) res.redirect('/dashboard');

        let pluginIsActivated = req.body.plugin;
        let autoChannelChosen = req.body.auto_channel_ID;
        let cmdChannelChosen = req.body.cmd_channel_ID;
        let message = req.body.message;
        let rolesDeny = req.body.rolesDeny;

        if (pluginIsActivated) {
            console.log("plugins", pluginIsActivated, "msg", message, "autochan,el", autoChannelChosen,
                "cmd Channel", cmdChannelChosen, "rolesDeny", rolesDeny);

            let currentPermsBirthday = { denyRoles: rolesDeny };

            console.log(currentPermsBirthday);

            await pluginsSelectedModel.findOneAndUpdate({ serverID: cur_guild_ID }, { birthday: pluginIsActivated });




            if (autoChannelChosen !== 'undefined') {


                const channelsPluginsData = await channelPluginsModel.findOne({ serverID: cur_guild_ID });

                console.log("updated channels");

                if (!channelsPluginsData) {
                    let newChannelsPlugins = await channelPluginsModel.create({
                        serverID: cur_guild_ID,
                        birthDateChannelID: autoChannelChosen,
                        cmdBirthDateChannelID: cmdChannelChosen,
                    });
                    newChannelsPlugins.save();
                }
                else {
                    await channelPluginsModel.findOneAndUpdate({ serverID: cur_guild_ID }, {
                        birthDateChannelID: autoChannelChosen,
                        cmdBirthDateChannelID: cmdChannelChosen
                    });

                }
            }

            if (message !== 'undefined') {

                console.log("updated message");


                const messagesPluginsData = await messagesPluginsModel.findOne({ serverID: cur_guild_ID });

                if (!messagesPluginsData) {
                    let newMessagesPlugins = await messagesPluginsModel.create({
                        serverID: cur_guild_ID,
                        birthdayCelebrateMessage: message,
                    });
                    newMessagesPlugins.save();
                }
                else {
                    await messagesPluginsModel.findOneAndUpdate({ serverID: cur_guild_ID }, {
                        birthdayCelebrateMessage: message,
                    });

                }
            }

            const serverStats = await serverStatsModel.findOne({ serverID: cur_guild_ID });
            const newPerms = serverStats.commandsCategoryPerms;

            newPerms.forEach(element => {
                if (element.category === "birthday") {
                    element.currentPerms = currentPermsBirthday;
                    console.log("cur", element.currentPerms);
                }
            })
            await serverStatsModel.findOneAndUpdate({ serverID: cur_guild_ID }, { commandsCategoryPerms: newPerms });


        } else {
            await pluginsSelectedModel.findOneAndUpdate({ serverID: cur_guild_ID }, { birthday: pluginIsActivated });
        }

        res.send("Updated");

    }
    else {
        res.redirect('/auth/discord/redirect');
    }

});

router.post('/:id/plugins/moderator', async (req, res) => {
    if (req.user) {
        const cur_guild_ID = req.params.id;
        let pluginIsActivated = req.body.plugin;
        let rolesChosen = req.body.rolesChosen;
        //let rolesDeny = req.body.rolesDeny;

        if (!client.guilds.cache.get(cur_guild_ID)) res.redirect('/dashboard');

        if (pluginIsActivated) {

            console.log("plugin", pluginIsActivated, "allowRoles", rolesChosen);

            let moderatorCurrentPerms = { allowRoles: rolesChosen, denyRoles: [] };

            console.log(moderatorCurrentPerms);

            await pluginsSelectedModel.findOneAndUpdate({ serverID: cur_guild_ID }, { moderator: pluginIsActivated });

            const serverStats = await serverStatsModel.findOne({ serverID: cur_guild_ID });
            const newPerms = serverStats.commandsCategoryPerms;

            newPerms.forEach(element => {
                if (element.category === "moderator") {
                    element.currentPerms = moderatorCurrentPerms;
                    console.log("cur", element.currentPerms);
                }
            })
            //console.log("new", newPerms[1].currentPerms);

            const serverStatsData = await serverStatsModel.findOne({ serverID: cur_guild_ID });
            const prevPerms = serverStatsData.commandsCategoryPerms;
            //console.log("prev", prevPerms[1].currentPerms);

            let changeMade = false;
            loop1:
            for (let index = 0; index < prevPerms.length; index++) {


                if (newPerms[index].category === "moderator" && prevPerms[index].category === "moderator") {

                    if (prevPerms[index].currentPerms.allowRoles && newPerms[index].currentPerms.allowRoles) {
                        console.log("les deux existe");
                        if (prevPerms[index].currentPerms.allowRoles.length !== newPerms[index].currentPerms.allowRoles.length) {
                            console.log("pas la meme taile");
                            changeMade = true;
                            break loop1;
                        }
                        else {
                            /*console.log("prev order", prevPerms[index].currentPerms.allowRoles)
                            console.log("cur order",newPerms[index].currentPerms.allowRoles)*/
                            prevPerms[index].currentPerms.allowRoles.sort((a, b) => a.name.localeCompare(b.name))
                            newPerms[index].currentPerms.allowRoles.sort((a, b) => a.name.localeCompare(b.name))

                            /*console.log("after prev order", prevPerms[index].currentPerms.allowRoles)
                            console.log("after cur order",newPerms[index].currentPerms.allowRoles)*/

                            for (let i = 0; i < prevPerms[index].currentPerms.allowRoles.length; i++) {
                                const curRole = newPerms[index].currentPerms.allowRoles[i];
                                const prevRole = prevPerms[index].currentPerms.allowRoles[i];
                                //console.log("current no loop", curRole)
                                //console.log("prev no loop", prevRole)
                                if (prevRole.id !== curRole.id) {
                                    console.log("\nDIFFERENCE :")
                                    console.log("current", curRole)
                                    console.log("prev", prevRole)
                                    changeMade = true;
                                    break loop1;

                                }

                            }

                        }

                    }

                }
            }
            console.log(changeMade)
            let reasonUpdate = "undefined";
            let needUpdate = false;
            if (changeMade) {
                reasonUpdate = "permission";
                needUpdate = true;
            }
            await serverStatsModel.findOneAndUpdate({ serverID: cur_guild_ID }, { commandsCategoryPerms: newPerms, reasonUpdate, needUpdate });


        } else {

            await pluginsSelectedModel.findOneAndUpdate({ serverID: cur_guild_ID }, { moderator: pluginIsActivated });
        }

        res.send("Updated");
    }
    else {
        res.redirect('/auth/discord/redirect');
    }

});

router.post('/:id/plugins/suggest', async (req, res) => {

    if (req.user) {
        const cur_guild_ID = req.params.id;
        let pluginIsActivated = req.body.plugin;
        let channelChosen = req.body.channel_ID;

        if (!client.guilds.cache.get(cur_guild_ID)) res.redirect('/dashboard');

        if (pluginIsActivated) {

            console.log(pluginIsActivated, channelChosen);

            await pluginsSelectedModel.findOneAndUpdate({ serverID: cur_guild_ID }, { suggestion: pluginIsActivated });

            const channelsPluginsData = await channelPluginsModel.findOne({ serverID: cur_guild_ID });

            if (channelChosen) {
                if (!channelsPluginsData) {
                    let newChannelsPlugins = await channelPluginsModel.create({
                        serverID: cur_guild_ID,
                        suggestChannelID: channelChosen
                    });
                    newChannelsPlugins.save();
                }
                else {
                    await channelPluginsModel.findOneAndUpdate({ serverID: cur_guild_ID }, {
                        suggestChannelID: channelChosen,
                    });

                }
            }

        } else {
            await pluginsSelectedModel.findOneAndUpdate({ serverID: cur_guild_ID }, { suggestion: pluginIsActivated });
        }
        res.send("Updated");
    }
    else {
        res.redirect('/auth/discord/redirect');
    }

});

router.post('/:id/plugins/temporaryChannel', async (req, res) => {

    if (req.user) {
        const cur_guild_ID = req.params.id;
        let pluginIsActivated = req.body.plugin;
        let channelChosen = req.body.channel_ID;
        let tempChannelsName = req.body.nameChannels;

        if (!client.guilds.cache.get(cur_guild_ID)) res.redirect('/dashboard');

        if (pluginIsActivated) {
            console.log(pluginIsActivated, tempChannelsName, channelChosen);

            await pluginsSelectedModel.findOneAndUpdate({ serverID: cur_guild_ID }, { channelManager: pluginIsActivated });

            const channelsPluginsData = await channelPluginsModel.findOne({ serverID: cur_guild_ID });

            if (channelChosen) {
                console.log(channelChosen);
                if (!channelsPluginsData) {
                    let newChannelsPlugins = await channelPluginsModel.create({
                        serverID: cur_guild_ID,
                        creatorVoiceChannelID: channelChosen
                    });
                    newChannelsPlugins.save();
                }
                else {
                    await channelPluginsModel.findOneAndUpdate({ serverID: cur_guild_ID }, {
                        creatorVoiceChannelID: channelChosen,
                    });

                }
            }


            const messagesPluginsData = await messagesPluginsModel.findOne({ serverID: cur_guild_ID });

            if (!messagesPluginsData) {
                let newMessagesPlugins = await messagesPluginsModel.create({
                    serverID: cur_guild_ID,
                    temporaryChannelName: tempChannelsName,
                });
                newMessagesPlugins.save();
            }
            else {
                await messagesPluginsModel.findOneAndUpdate({ serverID: cur_guild_ID }, {
                    temporaryChannelName: tempChannelsName,
                });

            }

        } else {
            await pluginsSelectedModel.findOneAndUpdate({ serverID: cur_guild_ID }, { channelManager: pluginIsActivated });
        }
        res.send("Updated");
    }
    else {
        res.redirect('/auth/discord/redirect');
    }

});

router.post('/:id/plugins/leveling', async (req, res) => {

    if (req.user) {
        const cur_guild_ID = req.params.id;
        let pluginIsActivated = req.body.plugin;
        let autoMsgChannelChosen = req.body.autoChannel;
        let cmdChannelChosen = req.body.cmd_channel_ID;
        let lvlUp_message = req.body.message;
        let salonsIgnored = req.body.salonsIgnored;
        let rolesIgnored = req.body.rolesIgnored;
        let isChannelCustom = req.body.isChannelCustom;
        let defaultColor = req.body.defaultColor;
        if (!client.guilds.cache.get(cur_guild_ID)) res.redirect('/dashboard');
        if (pluginIsActivated) {

            console.log(pluginIsActivated, lvlUp_message, cmdChannelChosen, autoMsgChannelChosen, salonsIgnored, rolesIgnored, "custom", isChannelCustom, defaultColor);

            await pluginsSelectedModel.findOneAndUpdate({ serverID: cur_guild_ID }, { leveling: pluginIsActivated });

            const channelsPluginsData = await channelPluginsModel.findOne({ serverID: cur_guild_ID });

            if (!isChannelCustom) {
                autoMsgChannelChosen = "undefined"
                console.log("current", autoMsgChannelChosen);
                if (!channelsPluginsData) {
                    let newChannelsPlugins = await channelPluginsModel.create({
                        serverID: cur_guild_ID,
                        cmdLevelingChannelID: cmdChannelChosen,
                        levelingUpChannelID: autoMsgChannelChosen,
                        levelingDeniedChannels: salonsIgnored,
                        levelingDeniedRoles: rolesIgnored
                    });
                    newChannelsPlugins.save();
                }
                else {
                    await channelPluginsModel.findOneAndUpdate({ serverID: cur_guild_ID }, {
                        cmdLevelingChannelID: cmdChannelChosen,
                        levelingUpChannelID: autoMsgChannelChosen,
                        levelingDeniedChannels: salonsIgnored,
                        levelingDeniedRoles: rolesIgnored
                    });

                }
            }
            if (isChannelCustom) {
                console.log("custom", "channelannonce", autoMsgChannelChosen, "channelCMD", cmdChannelChosen);
                if (!channelsPluginsData) {
                    let newChannelsPlugins = await channelPluginsModel.create({
                        serverID: cur_guild_ID,
                        cmdLevelingChannelID: cmdChannelChosen,
                        levelingUpChannelID: autoMsgChannelChosen,
                        levelingDeniedChannels: salonsIgnored,
                        levelingDeniedRoles: rolesIgnored
                    });
                    newChannelsPlugins.save();
                }
                else {
                    await channelPluginsModel.findOneAndUpdate({ serverID: cur_guild_ID }, {
                        cmdLevelingChannelID: cmdChannelChosen,
                        levelingUpChannelID: autoMsgChannelChosen,
                        levelingDeniedChannels: salonsIgnored,
                        levelingDeniedRoles: rolesIgnored
                    });

                }
            }


            const messagesPluginsData = await messagesPluginsModel.findOne({ serverID: cur_guild_ID });

            if (!messagesPluginsData) {
                let newMessagesPlugins = await messagesPluginsModel.create({
                    serverID: cur_guild_ID,
                    levelingUpMessage: lvlUp_message,
                    levelingDefaultColor: defaultColor
                });
                newMessagesPlugins.save();
            }
            else {
                await messagesPluginsModel.findOneAndUpdate({ serverID: cur_guild_ID }, {
                    levelingUpMessage: lvlUp_message,
                    levelingDefaultColor: defaultColor
                });

            }

        } else {
            await pluginsSelectedModel.findOneAndUpdate({ serverID: cur_guild_ID }, { leveling: pluginIsActivated });
        }

        res.send("Updated");
    }
    else {
        res.redirect('/auth/discord/redirect');
    }

});

router.post('/:id/plugins/supportTicket', async (req, res) => {

    if (req.user) {
        const cur_guild_ID = req.params.id;
        let pluginIsActivated = req.body.plugin;
        let channelChosen = req.body.channel_ID;
        let categoryTicket = req.body.categoryTicket;
        let nameTicketChannel = req.body.nameTicketChannel;
        let supportRole = req.body.supportRole;

        if (!client.guilds.cache.get(cur_guild_ID)) res.redirect('/dashboard');

        if (pluginIsActivated) {

            console.log(pluginIsActivated, nameTicketChannel, channelChosen, "role", supportRole, categoryTicket);

            /*const plugins = await pluginsSelectedModel.findOne({ serverID: cur_guild_ID });

            await prevPluginsModel.findOneAndUpdate({ serverID: cur_guild_ID },
                {
                    welcome: plugins.welcome,
                    birthday: plugins.birthday,
                    moderator: plugins.moderator,
                    suggestion: plugins.suggestion,
                    channelManager: plugins.channelManager,
                    leveling: plugins.leveling,
                    supportTicket: plugins.supportTicket,
                    stream: plugins.stream,
                    economy: plugins.economy,
                });*/


            await pluginsSelectedModel.findOneAndUpdate({ serverID: cur_guild_ID }, { supportTicket: pluginIsActivated });

            const channelsPluginsData = await channelPluginsModel.findOne({ serverID: cur_guild_ID });

            if (channelChosen) {
                if (!channelsPluginsData) {
                    let newChannelsPlugins = await channelPluginsModel.create({
                        serverID: cur_guild_ID,
                        supportTicketChannelID: channelChosen,
                        ticketHolderCategoryID: categoryTicket
                    });
                    newChannelsPlugins.save();
                }
                else {
                    await channelPluginsModel.findOneAndUpdate({ serverID: cur_guild_ID }, {
                        supportTicketChannelID: channelChosen,
                        ticketHolderCategoryID: categoryTicket
                    });

                }
            }


            const messagesPluginsData = await messagesPluginsModel.findOne({ serverID: cur_guild_ID });

            if (!messagesPluginsData) {
                let newMessagesPlugins = await messagesPluginsModel.create({
                    serverID: cur_guild_ID,
                    ticketName: nameTicketChannel,

                });
                newMessagesPlugins.save();


            }
            else {
                await messagesPluginsModel.findOneAndUpdate({ serverID: cur_guild_ID }, {
                    ticketName: nameTicketChannel,

                });

            }

            await serverStatsModel.findOneAndUpdate({ serverID: cur_guild_ID }, { supportRole });

        } else {
            await pluginsSelectedModel.findOneAndUpdate({ serverID: cur_guild_ID }, { supportTicket: pluginIsActivated });
        }

        res.send("Updated");
    }
    else {
        res.redirect('/auth/discord/redirect');
    }

});

router.post('/:id/plugins/stream', async (req, res) => {
    if (req.user) {
        const cur_guild_ID = req.params.id;
        let pluginIsActivated = req.body.plugin;
        let rolesChosen = req.body.rolesChosen;
        let channelChosen = req.body.channel_ID;

        if (!client.guilds.cache.get(cur_guild_ID)) res.redirect('/dashboard');

        if (pluginIsActivated) {

            console.log("plugin", pluginIsActivated, "allowRoles", rolesChosen, channelChosen);

            const channelsPluginsData = await channelPluginsModel.findOne({ serverID: cur_guild_ID });

            if (channelChosen) {
                if (!channelsPluginsData) {
                    let newChannelsPlugins = await channelPluginsModel.create({
                        serverID: cur_guild_ID,
                        liveChannelID: channelChosen
                    });
                    newChannelsPlugins.save();
                }
                else {
                    await channelPluginsModel.findOneAndUpdate({ serverID: cur_guild_ID }, {
                        liveChannelID: channelChosen,
                    });

                }
            }



            let streamCurrentPerms = { allowRoles: rolesChosen, denyRoles: [] };

            console.log(streamCurrentPerms);

            await pluginsSelectedModel.findOneAndUpdate({ serverID: cur_guild_ID }, { stream: pluginIsActivated });

            const serverStats = await serverStatsModel.findOne({ serverID: cur_guild_ID });
            const newPerms = serverStats.commandsCategoryPerms;

            newPerms.forEach(element => {
                if (element.category === "stream") {
                    element.currentPerms = streamCurrentPerms;
                    console.log("cur", element.currentPerms);
                }
            })
            //console.log("new", newPerms[1].currentPerms);

            const serverStatsData = await serverStatsModel.findOne({ serverID: cur_guild_ID });
            const prevPerms = serverStatsData.commandsCategoryPerms;
            //console.log("prev", prevPerms[1].currentPerms);

            let changeMade = false;
            loop1:
            for (let index = 0; index < prevPerms.length; index++) {


                if (newPerms[index].category === "stream" && prevPerms[index].category === "stream") {

                    if (prevPerms[index].currentPerms.allowRoles && newPerms[index].currentPerms.allowRoles) {
                        console.log("les deux existe");
                        if (prevPerms[index].currentPerms.allowRoles.length !== newPerms[index].currentPerms.allowRoles.length) {
                            console.log("pas la meme taile");
                            changeMade = true;
                            break loop1;
                        }
                        else {
                            /*console.log("prev order", prevPerms[index].currentPerms.allowRoles)
                            console.log("cur order",newPerms[index].currentPerms.allowRoles)*/
                            prevPerms[index].currentPerms.allowRoles.sort((a, b) => a.name.localeCompare(b.name))
                            newPerms[index].currentPerms.allowRoles.sort((a, b) => a.name.localeCompare(b.name))

                            /*console.log("after prev order", prevPerms[index].currentPerms.allowRoles)
                            console.log("after cur order",newPerms[index].currentPerms.allowRoles)*/

                            for (let i = 0; i < prevPerms[index].currentPerms.allowRoles.length; i++) {
                                const curRole = newPerms[index].currentPerms.allowRoles[i];
                                const prevRole = prevPerms[index].currentPerms.allowRoles[i];
                                //console.log("current no loop", curRole)
                                //console.log("prev no loop", prevRole)
                                if (prevRole.id !== curRole.id) {
                                    console.log("\nDIFFERENCE :")
                                    console.log("current", curRole)
                                    console.log("prev", prevRole)
                                    changeMade = true;
                                    break loop1;

                                }

                            }

                        }

                    }

                }
            }
            console.log(changeMade)
            let reasonUpdate = "undefined";
            let needUpdate = false;
            if (changeMade) {
                reasonUpdate = "permission";
                needUpdate = true;
            }
            await serverStatsModel.findOneAndUpdate({ serverID: cur_guild_ID }, { commandsCategoryPerms: newPerms, reasonUpdate, needUpdate });


        } else {

            await pluginsSelectedModel.findOneAndUpdate({ serverID: cur_guild_ID }, { stream: pluginIsActivated });
        }

        res.send("Updated");
    }
    else {
        res.redirect('/auth/discord/redirect');
    }

});

router.post('/:id/plugins/economy', async (req, res) => {

    if (req.user) {
        const cur_guild_ID = req.params.id;
        let pluginIsActivated = req.body.plugin;
        let channelChosenEco = req.body.channel_ID;
        let channelChosenGames = req.body.channelGames_ID;

        let rolesDeny = req.body.rolesDeny;

        if (!client.guilds.cache.get(cur_guild_ID)) res.redirect('/dashboard');

        if (pluginIsActivated) {

            let currentPermsEconomy = { denyRoles: rolesDeny };

            console.log(currentPermsEconomy);

            console.log(pluginIsActivated, channelChosenEco, channelChosenGames, "roles deny", rolesDeny);

            await pluginsSelectedModel.findOneAndUpdate({ serverID: cur_guild_ID }, { economy: pluginIsActivated });

            const channelsPluginsData = await channelPluginsModel.findOne({ serverID: cur_guild_ID });

            if (channelChosenEco && channelChosenGames) {
                if (!channelsPluginsData) {
                    let newChannelsPlugins = await channelPluginsModel.create({
                        serverID: cur_guild_ID,
                        economyChannelID: channelChosenEco,
                        gamblingGamesChannelID: channelChosenGames
                    });
                    newChannelsPlugins.save();
                }
                else {
                    await channelPluginsModel.findOneAndUpdate({ serverID: cur_guild_ID }, {
                        economyChannelID: channelChosenEco,
                        gamblingGamesChannelID: channelChosenGames
                    });

                }
            }

            const serverStats = await serverStatsModel.findOne({ serverID: cur_guild_ID });
            const newPerms = serverStats.commandsCategoryPerms;
            newPerms.forEach(element => {
                if (element.category === "economy") {
                    element.currentPerms = currentPermsEconomy;
                    console.log("cur", element.currentPerms);
                }
            })
            await serverStatsModel.findOneAndUpdate({ serverID: cur_guild_ID }, { commandsCategoryPerms: newPerms });

        } else {
            await pluginsSelectedModel.findOneAndUpdate({ serverID: cur_guild_ID }, { economy: pluginIsActivated });
        }
        res.send("Updated");
    }
    else {
        res.redirect('/auth/discord/redirect');
    }

});


module.exports = router;