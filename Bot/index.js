const fs = require("fs");
const {
  Client,
  Collection,
  Intents,
  Permissions,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
  MessageAttachment,
} = require("discord.js");
const schedule = require("node-schedule");
const Canvas = require("canvas");
const mongoose = require("mongoose");
require("dotenv").config();
const axios = require("axios").default;

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_VOICE_STATES,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_PRESENCES,
    Intents.FLAGS.GUILD_MEMBERS,
  ],
});

client.commands = new Collection();

let currentXP = 0;
let currentLvl = 0;
let maxXP = 100;
let addingXP = 55;
let totalXP = 0;

const userPreferenceModel = require("./models/UserPreferences");

const birthDateModel = require("./models/birthDateSchema");
const levelingModel = require("./models/levelingSchema");

const serverStatsModel = require("./models/serverStatsSchema");

const pluginsSelectedModel = require("./models/pluginsSelectedSchema");
const channelsPluginsModel = require("./models/channelsPluginsSchema");
const messagesPluginsModel = require("./models/messagesPluginsSchema");

const prevPluginsModel = require("./models/prevPluginsSchema");

const allCommands = [];
const initCommands = [];
const commandsSortedByCategory = [];

const commandFiles = fs
  .readdirSync("./commands")
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  // Set a new item in the Collection
  // With the key as the command name and the value as the exported module
  //client.commands.delete(command);
  client.commands.set(command.data.name, command);
  allCommands.push(command.data.toJSON());

  if (command.category === "global") {
    initCommands.push(command.data.toJSON());
  }

  let count = 0;
  commandsSortedByCategory.forEach((element) => {
    if (element.category !== command.category) {
      count++;
    }
  });

  if (count >= commandsSortedByCategory.length)
    commandsSortedByCategory.push({
      category: command.category,
      commands: [],
      defaultPerms: [],
      currentPerms: [],
    });
}

commandsSortedByCategory.forEach((element, count) => {
  for (const file of commandFiles) {
    const commandBIs = require(`./commands/${file}`);
    if (element.category === commandBIs.category) {
      commandsSortedByCategory[count].commands.push(commandBIs.data.toJSON());
    }
  }
});

const eventFiles = fs
  .readdirSync("./events")
  .filter((file) => file.endsWith(".js"));
for (const file of eventFiles) {
  const event = require(`./events/${file}`);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

const functions = fs
  .readdirSync("./functions")
  .filter((file) => file.endsWith(".js"));

for (file of functions) {
  require(`./functions/${file}`)(client);
}

client.dbLogin();

client.on("ready", async () => {
  console.log("ready");
});

client.on("guildMemberAdd", async (member) => {
  const pluginsData = await pluginsSelectedModel.findOne({
    serverID: member.guild.id,
  });
  if (!pluginsData || !pluginsData.welcome) return;

  const channelData = await channelsPluginsModel.findOne({
    serverID: member.guild.id,
  });
  const messageData = await messagesPluginsModel.findOne({
    serverID: member.guild.id,
  });

  if (channelData && channelData.welcomeChannelID) {
    if (messageData && messageData.welcomeMessage) {
      let welcomeResponse = messageData.welcomeMessage;
      if (welcomeResponse.includes("{user}")) {
        welcomeResponse = welcomeResponse.replace(
          "{user}",
          `<@${member.user.id}>`
        );
      }
      if (welcomeResponse.includes("{username}")) {
        welcomeResponse = welcomeResponse.replace(
          "{username}",
          `${member.user.username}`
        );
      }
      if (welcomeResponse.includes("{server}")) {
        welcomeResponse = welcomeResponse.replace(
          "{server}",
          `${member.guild.name}`
        );
      }

      client.guilds.cache
        .get(member.guild.id)
        .channels.cache.get(channelData.welcomeChannelID)
        .send(welcomeResponse);
    }
  }
});

client.on("guildCreate", async (guild) => {
  //#region SlashCommands Permissions

  const pluginsSelected = await pluginsSelectedModel.findOne({
    serverID: guild.id,
  });

  if (!pluginsSelected) {
    let pluginsDATA = await pluginsSelectedModel.create({
      serverID: guild.id,
    });
    pluginsDATA.save();
  }

  const prevPlugins = await prevPluginsModel.findOne({ serverID: guild.id });

  if (!prevPlugins) {
    let prevPlugins = await prevPluginsModel.create({
      serverID: guild.id,
    });

    prevPlugins.save();
  }

  const commandList = [];

  guild.commands.set(initCommands).then(async (cmd) => {
    cmd.forEach((element) => {
      const { name, id } = element;
      commandList.push({ name, id });
    });
    console.log("List", commandList);

    const channelList = [];
    guild.channels.cache.forEach((channel) => {
      const { name, id, type } = channel;
      channelList.push({ name, id, type });
    });

    //console.log("guild channels", channelList)

    const allGuildRoles = [];
    const rolesAdmin = [];

    guild.roles.cache.forEach((role) => {
      let { color } = role;
      const { name, id, permissions, tags } = role;

      if (tags.length >= 1) return;
      //let permissions = role.permissions.bitfield;
      color = color !== 0 ? "#" + Number(color).toString(16) : "#979C9F";

      allGuildRoles.push({ name, id, color });

      if (permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
        rolesAdmin.push({ name, id });
      }
    });

    const adminAndOwnerRoles = rolesAdmin;
    adminAndOwnerRoles.push({ name: "owner", id: `${guild.ownerId}` });

    const adminAndEveryoneRoles = adminAndOwnerRoles;
    adminAndEveryoneRoles.push({ name: "everyone", id: `${guild.id}` });

    console.log("guild role", allGuildRoles);

    commandsSortedByCategory.forEach((element, count) => {
      switch (element.category) {
        case "moderator":
          element.defaultPerms = {
            allowRoles: adminAndOwnerRoles,
            denyRoles: [{ name: "everyone", id: `${guild.id}` }],
          };
          break;

        case "stream":
          element.defaultPerms = {
            allowRoles: [{ name: "owner", id: `${guild.ownerId}` }],
            denyRoles: [{ name: "everyone", id: `${guild.id}` }],
          };
          break;

        default:
          element.defaultPerms = {
            allowRoles: adminAndEveryoneRoles,
            denyRoles: [],
          };
          break;
      }
      console.log(commandsSortedByCategory[count]);
    });

    const guildStats = await serverStatsModel.findOne({ serverID: guild.id });

    if (!guildStats) {
      let guildData = await serverStatsModel.create({
        serverID: guild.id,
        current_commands: commandList,
        channels: channelList,
        guildRoles: allGuildRoles,
        commandsCategoryPerms: commandsSortedByCategory,
        prevCommandsCategoryPerms: commandsSortedByCategory,
        timeLastUpdate: new Date().getTime(),
      });
      guildData.save();
    } else {
      await serverStatsModel.findOneAndUpdate(
        { serverID: guild.id },
        {
          current_commands: commandList,
          channels: channelList,
          guildRoles: allGuildRoles,
          commandsCategoryPerms: commandsSortedByCategory,
          prevCommandsCategoryPerms: commandsSortedByCategory,
          timeLastUpdate: new Date().getTime(),
        }
      );
    }

    const guildStatsData = await serverStatsModel.findOne({
      serverID: guild.id,
    });

    console.log("updated", guildStatsData.current_commands);

    // foreach des roles dans le serveur
    // check les allow roles et ajouter leur id et inversement pour les deny

    const plugins = await pluginsSelectedModel.findOne({ serverID: guild.id });
    let curPerms = { allowRoles: [], denyRoles: [] };
    for (const file of commandFiles) {
      const cmd = require(`./commands/${file}`);

      if (plugins[`${cmd.category}`]) {
        initCommands.forEach(async (command) => {
          if (cmd.data.name === command.name) {
            //get the default perms

            guildStatsData.commandsCategoryPerms.forEach((element) => {
              if (element.category === cmd.category) {
                curPerms.allowRoles = element.defaultPerms.allowRoles;
                curPerms.denyRoles = element.defaultPerms.denyRoles;
              }
            });

            console.log(cmd.category);

            let permsRoleSchema = [];
            curPerms.allowRoles.forEach((cmd) => {
              const type = cmd.name === "owner" ? "USER" : "ROLE";
              permsRoleSchema.push({
                id: cmd.id,
                type,
                permission: true,
              });
            });

            curPerms.denyRoles.forEach((cmd) => {
              const type = cmd.name === "owner" ? "USER" : "ROLE";
              permsRoleSchema.push({
                id: cmd.id,
                type,
                permission: false,
              });
            });

            guildStatsData.current_commands.forEach(async (cmd) => {
              const curCmd = await client.guilds.cache
                .get(guild.id)
                ?.commands.fetch(cmd.id);
              console.log(curCmd.name, permsRoleSchema);
              await curCmd.permissions.set({ permissions: permsRoleSchema });
            });
          }
        });
      }
    }
  });

  //#endregion
});

let isUpdating = false;
setInterval(async () => {
  if (isUpdating) return;
  const serverStatsData = await serverStatsModel.find({});

  serverStatsData.forEach(async (cur_guild) => {
    if (cur_guild.needUpdate) {
      let timer = new Date().getTime();
      let difTimer = timer - cur_guild.timeLastUpdate;
      console.log(
        "time update :",
        cur_guild.timeLastUpdate,
        ", current time: ",
        timer
      );
      console.log("difference :", difTimer);

      const plugins = await pluginsSelectedModel.findOne({
        serverID: cur_guild.serverID,
      });
      const previousPlugins = await prevPluginsModel.findOne({
        serverID: cur_guild.serverID,
      });
      const channelsData = await channelsPluginsModel.findOne({
        serverID: cur_guild.serverID,
      });

      if (difTimer >= 12000) {
        const guild = client.guilds.cache.get(cur_guild.serverID);
        isUpdating = true;

        const rolesAdmin = [];

        guild.roles.cache.forEach((role) => {
          const { name, id, permissions, tags } = role;
          if (tags) return;
          if (permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
            rolesAdmin.push({ name, id });
          }
        });

        if (cur_guild.reasonUpdate === "plugin") {
          console.log("plugin");

          const { REST } = require("@discordjs/rest");
          const { Routes } = require("discord-api-types/v9");
          const rest = new REST({ version: "9" }).setToken(process.env.token);

          const commandsDelete = [];
          const sortCommands = [];

          for (const file of commandFiles) {
            const command = require(`./commands/${file}`);
            // Set a new item in the Collection
            // With the key as the command name and the value as the exported module

            if (
              plugins[`${command.category}`] ||
              command.category === "global"
            ) {
              sortCommands.push(command.data.toJSON());
            }
          }

          try {
            await rest.put(
              Routes.applicationGuildCommands(process.env.clientId, guild.id),
              { body: commandsDelete }
            );

            console.log("Successfully deleted application commands.");

            const commandList = [];

            await guild.commands.set(sortCommands).then(async (cmd) => {
              cmd.forEach((element) => {
                const { name, id } = element;

                commandList.push({ name, id });
              });

              console.log("List", commandList);

              await serverStatsModel.findOneAndUpdate(
                { serverID: guild.id },
                {
                  serverID: guild.id,
                  current_commands: commandList,
                  timeLastUpdate: new Date().getTime(),
                  needUpdate: false,
                }
              );
            });

            await prevPluginsModel.findOneAndUpdate(
              { serverID: guild.id },
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
              }
            );

            const guildStatsData = await serverStatsModel.findOne({
              serverID: guild.id,
            });

            console.log("updated", guildStatsData.current_commands);

            // foreach des roles dans le serveur
            // check les allow roles et ajouter leur id et inversement pour les deny

            for (const file of commandFiles) {
              const cmd = require(`./commands/${file}`);

              if (
                plugins[`${cmd.category}`] &&
                (cmd.category === "stream" || cmd.category === "moderator")
              ) {
                sortCommands.forEach(async (command) => {
                  if (cmd.data.name === command.name) {
                    //get the default perms
                    let curPerms = { allowRoles: [], denyRoles: [] };
                    guildStatsData.commandsCategoryPerms.forEach((element) => {
                      if (element.category === cmd.category) {
                        if (element.currentPerms.allowRoles) {
                          if (element.currentPerms.allowRoles.length <= 0) {
                            // console.log("no role allow take default");

                            curPerms.allowRoles =
                              element.defaultPerms.allowRoles;
                          } else {
                            //console.log("role allow find");
                            curPerms.allowRoles =
                              element.defaultPerms.allowRoles;
                            //curPerms.allowRoles = rolesAdmin;
                            element.currentPerms.allowRoles.forEach((role) => {
                              let count = 0;

                              for (
                                let i = 0;
                                i < curPerms.allowRoles.length;
                                i++
                              ) {
                                if (role.id !== curPerms.allowRoles[i].id) {
                                  count++;
                                }
                              }
                              if (count >= curPerms.allowRoles.length) {
                                curPerms.allowRoles;
                                const { name, id } = role;
                                curPerms.allowRoles.push({ name, id });
                              }
                            });
                          }
                        } else {
                          //console.log("no role allow element take default");
                          curPerms.allowRoles = element.defaultPerms.allowRoles;
                        }

                        if (element.currentPerms.denyRoles) {
                          if (element.currentPerms.denyRoles.length <= 0) {
                            //console.log("no denyRoles take default");
                            curPerms.denyRoles = element.defaultPerms.denyRoles;
                          } else {
                            //console.log("denyRoles find");
                            // curPerms.denyRoles = element.defaultPerms.denyRoles;

                            element.currentPerms.denyRoles.forEach((role) => {
                              const { name, id } = role;
                              curPerms.denyRoles.push({ name, id });
                            });
                          }
                        } else {
                          //console.log("no role deny element take default");
                          curPerms.denyRoles = element.defaultPerms.denyRoles;
                        }
                      }
                    });

                    console.log(cmd.category);

                    let permsRoleSchema = [];
                    curPerms.allowRoles.forEach((cmd) => {
                      const type = cmd.name === "owner" ? "USER" : "ROLE";
                      permsRoleSchema.push({
                        id: cmd.id,
                        type,
                        permission: true,
                      });
                    });

                    curPerms.denyRoles.forEach((cmd) => {
                      const type = cmd.name === "owner" ? "USER" : "ROLE";
                      permsRoleSchema.push({
                        id: cmd.id,
                        type,
                        permission: false,
                      });
                    });
                    console.log("curPerms allow", curPerms.allowRoles);
                    console.log("curPerms deny", curPerms.denyRoles);

                    commandList.forEach(async (cmdFromList) => {
                      if (cmd.data.name === cmdFromList.name) {
                        const curCmd = await client.guilds.cache
                          .get(guild.id)
                          ?.commands.fetch(cmdFromList.id);
                        console.log(curCmd.name, permsRoleSchema);
                        await curCmd.permissions.set({
                          permissions: permsRoleSchema,
                        });
                      }
                    });

                    console.log("Commands updated");
                  }
                });
              }
            }
          } catch (error) {
            console.error(error);
          }
        } else if (cur_guild.reasonUpdate === "permission") {
          console.log("permission");

          const guildStatsData = await serverStatsModel.findOne({
            serverID: guild.id,
          });

          const { name, id } = guild.commands;
          console.log(name, id);

          console.log("updated", guildStatsData.current_commands);

          // foreach des roles dans le serveur
          // check les allow roles et ajouter leur id et inversement pour les deny
          try {
            for (const file of commandFiles) {
              const cmd = require(`./commands/${file}`);

              if (plugins[`${cmd.category}`]) {
                guildStatsData.current_commands.forEach(async (command) => {
                  if (cmd.data.name === command.name) {
                    //get the default perms
                    let curPerms = { allowRoles: [], denyRoles: [] };
                    guildStatsData.commandsCategoryPerms.forEach((element) => {
                      if (element.category === cmd.category) {
                        if (element.currentPerms.allowRoles) {
                          if (element.currentPerms.allowRoles.length <= 0) {
                            // console.log("no role allow take default");
                            curPerms.allowRoles =
                              element.defaultPerms.allowRoles;
                          } else {
                            //console.log("role allow find");
                            curPerms.allowRoles =
                              element.defaultPerms.allowRoles;
                            element.currentPerms.allowRoles.forEach((role) => {
                              let count = 0;

                              for (
                                let i = 0;
                                i < curPerms.allowRoles.length;
                                i++
                              ) {
                                if (role.id !== curPerms.allowRoles[i].id) {
                                  count++;
                                }
                              }
                              if (count >= curPerms.allowRoles.length) {
                                const { name, id } = role;
                                curPerms.allowRoles.push({ name, id });
                              }
                            });
                          }
                        } else {
                          //console.log("no role allow element take default");
                          curPerms.allowRoles = element.defaultPerms.allowRoles;
                        }

                        if (element.currentPerms.denyRoles) {
                          if (element.currentPerms.denyRoles.length <= 0) {
                            //console.log("no denyRoles take default");
                            curPerms.denyRoles = element.defaultPerms.denyRoles;
                          } else {
                            //console.log("denyRoles find");
                            // curPerms.denyRoles = element.defaultPerms.denyRoles;
                            element.currentPerms.denyRoles.forEach((role) => {
                              const { name, id } = role;
                              curPerms.denyRoles.push({ name, id });
                            });
                          }
                        } else {
                          //console.log("no role deny element take default");
                          curPerms.denyRoles = element.defaultPerms.denyRoles;
                        }
                      }
                    });

                    console.log(cmd.category);

                    let permsRoleSchema = [];
                    curPerms.allowRoles.forEach((cmd) => {
                      const type = cmd.name === "owner" ? "USER" : "ROLE";
                      permsRoleSchema.push({
                        id: cmd.id,
                        type,
                        permission: true,
                      });
                    });

                    curPerms.denyRoles.forEach((cmd) => {
                      const type = cmd.name === "owner" ? "USER" : "ROLE";
                      permsRoleSchema.push({
                        id: cmd.id,
                        type,
                        permission: false,
                      });
                    });

                    console.log("curPerms allow", curPerms.allowRoles);
                    console.log("curPerms deny", curPerms.denyRoles);

                    const curCmd = await client.guilds.cache
                      .get(guild.id)
                      ?.commands.fetch(command.id);
                    console.log(curCmd.name, permsRoleSchema);
                    await curCmd.permissions.set({
                      permissions: permsRoleSchema,
                    });
                  }
                });
                console.log("Commands updated");
              }
            }
          } catch (error) {
            console.log(error);
          }
          const serverStats = await serverStatsModel.findOne({
            serverID: guild.id,
          });
          const curPerms = serverStats.commandsCategoryPerms;

          await serverStatsModel.findOneAndUpdate(
            { serverID: guild.id },
            {
              serverID: guild.id,
              prevCommandsCategoryPerms: curPerms,
              timeLastUpdate: new Date().getTime(),
              needUpdate: false,
              reasonUpdate: "undefined",
            }
          );
        }
      } else if (difTimer >= 1000) {
        //console.log(sortCommands)
        if (plugins.supportTicket && !previousPlugins.supportTicket) {
          //#region Ticket Manager

          const ticketAnnonce = new MessageEmbed()
            .setColor("#0099FF")
            .setTitle("❓ Contacter un Moderateur ou membre du staff")
            .setDescription(
              "Un probleme sur le serveur ? \n Section reservee aux demandes qui necessitent un Moderateur.\n\n :warning: Tout ticket inutile sera sanctionne."
            );

          const ticketCreator = new MessageActionRow().addComponents(
            new MessageButton()
              .setCustomId("openticket")
              .setLabel("Ouvrir un ticket")
              .setStyle("PRIMARY")
              .setEmoji("📩")
          );

          //console.log(client.guilds.cache.get(cur_guild.serverID));

          const supportChannel = client.channels.cache.get(
            channelsData.supportTicketChannelID
          ); // get support channel

          supportChannel.messages
            .fetch()
            .then((messages) => {
              supportChannel.bulkDelete(messages);
            })
            .then(
              supportChannel.send({
                embeds: [ticketAnnonce],
                components: [ticketCreator],
              })
            );

          await prevPluginsModel.findOneAndUpdate(
            { serverID: cur_guild.serverID },
            { supportTicket: plugins.supportTicket }
          );
        }

        //#endregion
      }
      isUpdating = false;
    }
  });

  //console.log("updating cmd", timer, "date :", new Date(timer).toString());
}, 5000);

//#region  hall of fame

var optionsWatchtimeWeek = {
  method: "GET",
  url: "https://wapi.wizebot.tv/api/ranking/79cad2c8fc43cce0593864a8519c31f5/top/uptime/week/100",
};

var optionsWatchtimeMonth = {
  method: "GET",
  url: "https://wapi.wizebot.tv/api/ranking/79cad2c8fc43cce0593864a8519c31f5/top/uptime/month/100",
};

var optionsRank = {
  method: "GET",
  url: "https://api.wizebot.tv:8030/v2/laexo/channel_rank.json?include_keys=1",
};

function getFirstDayOfNextMonth() {
  const date = new Date();

  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

function getFirstDayCurrentMonth() {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getNextMonday() {
  var d = new Date();
  var time =
    d.getHours() * 3600000 +
    d.getMinutes() * 60000 +
    d.getSeconds() * 1000 +
    d.getMilliseconds();

  d.setDate(d.getDate() + ((1 + 7 - d.getDay()) % 7 || 7));
  var timestamp = d.getTime() - time;

  return new Date(timestamp);
}

let dataRankWeek = [];
let dataRankMonth = [];

let dataMonth = [];
let dataWeek = [];
let banList = [];

const hallOfFameChannelID = "959159650266271765"; //953776683436105798
const hallOfRankID = "981597070244851722"; //970740255516930108
const historyChannelID = "981597433702268938"; //970740487575203962

const ruleHall = new schedule.RecurrenceRule();
ruleHall.minute = 59;
ruleHall.second = 59;

schedule.scheduleJob(ruleHall, async () => {
  fs.readFile("blacklist.json", (err, data) => {
    if (err) throw err;
    banList = JSON.parse(data);
    console.log("blacklist loaded.");
  });

  if (dataRankWeek.length <= 0) {
    fs.readFile("xpWeek.json", (err, data) => {
      if (err) throw err;
      dataRankWeek = JSON.parse(data);
      console.log("JSON data of Month is loaded.");
    });
  }

  if (dataRankMonth.length <= 0) {
    fs.readFile("xpMonth.json", (err, data) => {
      if (err) throw err;
      dataRankMonth = JSON.parse(data);
      console.log("JSON data is loaded.");
    });
  }

  const currentDate = new Date();
  const timestamp = currentDate.getTime();

  console.log("month : ", getFirstDayOfNextMonth());
  console.log("month : ", getFirstDayOfNextMonth().getTime() - timestamp);

  console.log("week : ", getNextMonday());

  console.log("week : ", getNextMonday().getTime() - timestamp);

  if (getFirstDayOfNextMonth().getTime() - timestamp <= 5000) {
    await axios
      .request(optionsRank)
      .then(function (response) {
        dataRankApi = response.data.datas;
      })
      .catch(function (error) {
        console.error(error);
      });

    const dataRankJson = JSON.stringify(dataRankApi);

    // write JSON string to a file
    fs.writeFile("xpMonth.json", dataRankJson, (err) => {
      if (err) throw err;
      console.log("JSON data Month Rank is saved.");
    });
    dataRankMonth = dataRankApi;
  }

  if (getNextMonday().getTime() - timestamp <= 5000) {
    await axios
      .request(optionsRank)
      .then(function (response) {
        dataRankApi = response.data.datas;
      })
      .catch(function (error) {
        console.error(error);
      });

    const dataRankJson = JSON.stringify(dataRankApi);

    // write JSON string to a file
    fs.writeFile("xpWeek.json", dataRankJson, (err) => {
      if (err) throw err;
      console.log("JSON data Week rank is saved.");
    });
    dataRankWeek = dataRankApi;
  }

  await axios
    .request(optionsWatchtimeWeek)
    .then(function (response) {
      dataWeek = response.data.list;
      console.log("api watchtime Week loaded");
    })
    .catch(function (error) {
      console.error(error);
    });

  await axios
    .request(optionsWatchtimeMonth)
    .then(function (response) {
      dataMonth = response.data.list;
      console.log("api watchtime Month loaded");
    })
    .catch(function (error) {
      console.error(error);
    });

  let dataRankApiWeek = [];
  let dataRankApiMonth = [];
  await axios
    .request(optionsRank)
    .then(function (response) {
      dataRankApiMonth = response.data.datas;
      console.log("Api Rank Month loaded");
    })
    .catch(function (error) {
      console.error(error);
    });

  await axios
    .request(optionsRank)
    .then(function (response) {
      dataRankApiWeek = response.data.datas;
      console.log("Api Rank Week loaded");
    })
    .catch(function (error) {
      console.error(error);
    });

  for (let i = 0; i < dataRankApiWeek.length; i++) {
    banList.forEach((banUser) => {
      if (banUser.username === dataRankApiWeek[i].viewer_name) {
        dataRankApiWeek.splice(i, 1);
      }
    });
  }

  for (let i = 0; i < dataWeek.length; i++) {
    banList.forEach((banUser) => {
      if (banUser.username === dataWeek[i].user_name) {
        dataWeek.splice(i, 1);
      }
    });
  }
  for (let i = 0; i < dataMonth.length; i++) {
    banList.forEach((banUser) => {
      if (banUser.username === dataMonth[i].user_name) {
        dataMonth.splice(i, 1);
      }
    });
  }

  //WEEK

  let limitWeek = dataWeek.length <= 25 ? dataWeek.length : 25;
  let listLeaderboardWeek = [];

  let hour = 0;
  let min = 0;
  let sec = 0;

  for (let i = 0; i < limitWeek; i++) {
    sec = dataWeek[i].value / 3600;
    hour = Math.trunc(sec);

    sec -= hour;
    sec *= 60;

    min = Math.trunc(sec);
    sec -= min;

    sec = Math.round(sec * 60);

    let time = `${hour}h ${min}m ${sec}s`;

    listLeaderboardWeek.push(
      `#${i + 1} : **${dataWeek[i].user_name}** - ${time}\n`
    );
  }

  let weekList =
    limitWeek > 0 ? listLeaderboardWeek.join("") : "Aucune Donnees";

  //MONTH
  let limitMonth = dataMonth.length <= 25 ? dataMonth.length : 25;
  let listLeaderboardMonth = [];

  for (let i = 0; i < limitMonth; i++) {
    sec = dataMonth[i].value / 3600;
    hour = Math.trunc(sec);

    sec -= hour;
    sec *= 60;

    min = Math.trunc(sec);
    sec -= min;

    sec = Math.round(sec * 60);

    let time = `${hour}h ${min}m ${sec}s`;

    listLeaderboardMonth.push(
      `#${i + 1} : **${dataMonth[i].user_name}** - ${time}\n`
    );
  }

  let monthList =
    limitMonth > 0 ? listLeaderboardMonth.join("") : "Aucune Donnees";

  // RANK

  let currentRankMonthTOP = [];
  let currentRankWeekTOP = [];

  let counter = 0;

  dataRankApiMonth.forEach((user) => {
    dataRankMonth.forEach((userJson) => {
      if (user.viewer_uid == userJson.viewer_uid) {
        if (user.exp > userJson.exp) {
          let newUser = user;
          newUser.exp -= userJson.exp;
          if (newUser.viewer_name.length >= 23) {
            newUser.viewer_name = newUser.viewer_name.substring(0, 20) + "...";
          }
          currentRankMonthTOP.push(newUser);
        }
      } else {
        counter++;
      }
    });

    if (counter >= dataRankMonth.length) {
      currentRankMonthTOP.push(user);
    }
    counter = 0;
  });

  dataRankApiWeek.forEach((user) => {
    dataRankWeek.forEach((userJson) => {
      if (user.viewer_uid == userJson.viewer_uid) {
        if (user.exp > userJson.exp) {
          let newUser = user;
          newUser.exp -= userJson.exp;
          if (newUser.viewer_name.length >= 23) {
            newUser.viewer_name = newUser.viewer_name.substring(0, 20) + "...";
          }
          currentRankWeekTOP.push(newUser);
        }
      } else {
        counter++;
      }
    });

    if (counter >= dataRankWeek.length) {
      if (user.viewer_name.length >= 23) {
        user.viewer_name = user.viewer_name.substring(0, 20) + "...";
      }
      currentRankWeekTOP.push(user);
    }
    counter = 0;
  });

  let limitRankWeek =
    currentRankWeekTOP.length <= 25 ? currentRankWeekTOP.length : 25;

  let limitRankMonth =
    currentRankMonthTOP.length <= 25 ? currentRankMonthTOP.length : 25;

  let listLeaderboardWeekRank = [];
  let listLeaderboardMonthRank = [];

  currentRankWeekTOP.sort((a, b) => b.exp - a.exp);
  currentRankMonthTOP.sort((a, b) => b.exp - a.exp);

  for (let i = 0; i < limitRankWeek; i++) {
    listLeaderboardWeekRank.push(
      `#${i + 1} : **${currentRankWeekTOP[i].viewer_name}** - EXP : ${
        currentRankWeekTOP[i].exp
      } \n`
    );
  }
  for (let i = 0; i < limitRankMonth; i++) {
    listLeaderboardMonthRank.push(
      `#${i + 1} : **${currentRankMonthTOP[i].viewer_name}** - EXP : ${
        currentRankMonthTOP[i].exp
      } \n`
    );
  }

  let rankListWeek =
    limitRankWeek > 0 ? listLeaderboardWeekRank.join("") : "Aucune Donnees";

  let rankListMonth =
    limitRankMonth > 0 ? listLeaderboardMonthRank.join("") : "Aucune Donnees";

  const embed = new MessageEmbed()
    .setColor("WHITE")
    .setTitle(`HALL OF WATCHTIME`)
    .setDescription(
      "Les classement ci-dessous sont etablis en fonction de votre temps de visionnage sur les streams de Laexo !"
    )
    .addFields(
      {
        name: `TOP ${limitWeek} de la  Semaine`,
        value: weekList,
        inline: true,
      },
      { name: "\u200B", value: "\u200B", inline: true },
      { name: `TOP ${limitMonth} du  Mois`, value: monthList, inline: true },
      { name: "\u200B", value: "\u200B", inline: true }
    )
    .setThumbnail()
    .setTimestamp()
    .setFooter("Mise a jour automatique toutes les heures");

  const embedRank = new MessageEmbed()
    .setColor("WHITE")
    .setTitle(`HALL OF RANKS`)
    .setDescription(
      "Les classements ci-dessous sont etablis en fonction de l'XP que vous gagnez dans le chat Twitch de Laexo, cet XP vous est attribue en fonction de votre activite sur les streams (messages, temps de visionnage)"
    )
    .addFields(
      {
        name: `TOP ${limitRankWeek} de la  Semaine`,
        value: rankListWeek,
        inline: true,
      },
      { name: "\u200B", value: "\u200B", inline: true },
      {
        name: `TOP ${limitRankMonth} du  Mois`,
        value: rankListMonth,
        inline: true,
      },
      { name: "\u200B", value: "\u200B", inline: true }
    )
    .setThumbnail()
    .setTimestamp()
    .setFooter("Mise a jour automatique toutes les heures");

  const hallOfFameChannel = client.channels.cache.get(hallOfFameChannelID);
  const hallOfRankChannel = client.channels.cache.get(hallOfRankID);

  hallOfFameChannel.messages
    .fetch()
    .then((messages) => {
      hallOfFameChannel.bulkDelete(messages);
    })
    .then(
      hallOfFameChannel.send({
        embeds: [embed],
      })
    );

  hallOfRankChannel.messages
    .fetch()
    .then((messages) => {
      hallOfRankChannel.bulkDelete(messages);
    })
    .then(
      hallOfRankChannel.send({
        embeds: [embedRank],
      })
    );

  console.log("update Hall of fame");
});

const ruleHistory = new schedule.RecurrenceRule();
ruleHistory.minute = 59;
ruleHistory.second = 58;

schedule.scheduleJob(ruleHistory, async () => {
  fs.readFile("blacklist.json", (err, data) => {
    if (err) throw err;
    banList = JSON.parse(data);
    console.log("blacklist loaded History.");
  });

  if (dataRankWeek.length <= 0) {
    fs.readFile("xpWeek.json", (err, data) => {
      if (err) throw err;
      dataRankWeek = JSON.parse(data);
      console.log("JSON data of Month History is loaded.");
    });
  }

  if (dataRankMonth.length <= 0) {
    fs.readFile("xpMonth.json", (err, data) => {
      if (err) throw err;
      dataRankMonth = JSON.parse(data);
      console.log("JSON data is loaded History.");
    });
  }

  var dataMonth = [];

  await axios
    .request(optionsWatchtimeMonth)
    .then(function (response) {
      dataMonth = response.data.list;
      console.log("api watchtime Month History loaded");
    })
    .catch(function (error) {
      console.error(error);
    });

  await axios
    .request(optionsRank)
    .then(function (response) {
      dataRankApiWeek = response.data.datas;
      console.log("Api History Rank Week loaded");
    })
    .catch(function (error) {
      console.error(error);
    });

  await axios
    .request(optionsRank)
    .then(function (response) {
      dataRankApiMonth = response.data.datas;
      console.log("Api History Rank Month loaded");
    })
    .catch(function (error) {
      console.error(error);
    });

  for (let i = 0; i < dataRankApiWeek.length; i++) {
    banList.forEach((banUser) => {
      if (banUser.username === dataRankApiWeek[i].viewer_name) {
        dataRankApiWeek.splice(i, 1);
      }
    });
  }

  for (let i = 0; i < dataMonth.length; i++) {
    banList.forEach((banUser) => {
      if (banUser.username === dataMonth[i].user_name) {
        dataMonth.splice(i, 1);
      }
    });
  }

  //MONTH
  let limitMonth = dataMonth.length <= 25 ? dataMonth.length : 25;
  let listLeaderboardMonth = [];

  for (let i = 0; i < limitMonth; i++) {
    sec = dataMonth[i].value / 3600;
    hour = Math.trunc(sec);

    sec -= hour;
    sec *= 60;

    min = Math.trunc(sec);
    sec -= min;

    sec = Math.round(sec * 60);

    let time = `${hour}h ${min}m ${sec}s`;

    listLeaderboardMonth.push(
      `#${i + 1} : **${dataMonth[i].user_name}** - ${time}\n`
    );
  }

  let monthList =
    limitMonth > 0 ? listLeaderboardMonth.join("") : "Aucune Donnees";

  // RANK

  let currentRankMonthTOP = [];
  let currentRankWeekTOP = [];

  let counter = 0;

  dataRankApiMonth.forEach((user) => {
    dataRankMonth.forEach((userJson) => {
      if (user.viewer_uid == userJson.viewer_uid) {
        if (user.exp > userJson.exp) {
          let newUser = user;
          newUser.exp -= userJson.exp;
          if (newUser.viewer_name.length >= 23) {
            newUser.viewer_name = newUser.viewer_name.substring(0, 20) + "...";
          }
          currentRankMonthTOP.push(newUser);
        }
      } else {
        counter++;
      }
    });

    if (counter >= dataRankMonth.length) {
      currentRankMonthTOP.push(user);
    }
    counter = 0;
  });

  dataRankApiWeek.forEach((user) => {
    dataRankWeek.forEach((userJson) => {
      if (user.viewer_uid == userJson.viewer_uid) {
        if (user.exp > userJson.exp) {
          let newUser = user;
          newUser.exp -= userJson.exp;
          if (newUser.viewer_name.length >= 23) {
            newUser.viewer_name = newUser.viewer_name.substring(0, 20) + "...";
          }
          currentRankWeekTOP.push(newUser);
        }
      } else {
        counter++;
      }
    });

    if (counter >= dataRankWeek.length) {
      if (user.viewer_name.length >= 23) {
        user.viewer_name = user.viewer_name.substring(0, 20) + "...";
      }
      currentRankWeekTOP.push(user);
    }
    counter = 0;
  });

  let limitRankWeek =
    currentRankWeekTOP.length <= 25 ? currentRankWeekTOP.length : 25;

  let limitRankMonth =
    currentRankMonthTOP.length <= 25 ? currentRankMonthTOP.length : 25;

  let listLeaderboardWeekRank = [];
  let listLeaderboardMonthRank = [];

  currentRankWeekTOP.sort((a, b) => b.exp - a.exp);
  currentRankMonthTOP.sort((a, b) => b.exp - a.exp);

  for (let i = 0; i < limitRankWeek; i++) {
    listLeaderboardWeekRank.push(
      `#${i + 1} : **${currentRankWeekTOP[i].viewer_name}** - EXP : ${
        currentRankWeekTOP[i].exp
      } \n`
    );
  }
  for (let i = 0; i < limitRankMonth; i++) {
    listLeaderboardMonthRank.push(
      `#${i + 1} : **${currentRankMonthTOP[i].viewer_name}** - EXP : ${
        currentRankMonthTOP[i].exp
      } \n`
    );
  }

  let rankListWeek =
    limitRankWeek > 0 ? listLeaderboardWeekRank.join("") : "Aucune Donnees";

  let rankListMonth =
    limitRankMonth > 0 ? listLeaderboardMonthRank.join("") : "Aucune Donnees";

  var prevMonday = new Date();
  prevMonday.setDate(prevMonday.getDate() - ((prevMonday.getDay() + 6) % 7));

  const embedWatchtimeMonth = new MessageEmbed()
    .setColor("WHITE")
    .setTitle(`HALL OF WATCHTIME`)
    .setDescription(
      `Classement du Watctime du mois (du ${getFirstDayCurrentMonth().toLocaleDateString(
        "fr"
      )} au ${new Date().toLocaleDateString("fr")})`
    )
    .addFields({
      name: `TOP ${limitMonth} du  Mois`,
      value: monthList,
      inline: true,
    })
    .setThumbnail()
    .setTimestamp();

  const embedRankWeek = new MessageEmbed()
    .setColor("WHITE")
    .setTitle(`HALL OF RANKS`)
    .setDescription(
      `Liste des ranks de la semaine (de ${prevMonday.toLocaleDateString(
        "fr"
      )} au ${new Date().toLocaleDateString("fr")})`
    )
    .addFields({
      name: `TOP ${limitRankWeek} de la  Semaine`,
      value: rankListWeek,
      inline: true,
    })
    .setThumbnail()
    .setTimestamp();

  const embedRankMonth = new MessageEmbed()
    .setColor("WHITE")
    .setTitle(`HALL OF RANKS`)
    .setDescription(
      `Liste des ranks du mois (du ${getFirstDayCurrentMonth().toLocaleDateString(
        "fr"
      )} au ${new Date().toLocaleDateString("fr")})`
    )
    .addFields({
      name: `TOP ${limitRankMonth} du  Mois`,
      value: rankListMonth,
      inline: true,
    })
    .setThumbnail()
    .setTimestamp();

  const historyChannel = client.channels.cache.get(historyChannelID);

  const currentDate = new Date();
  const timestamp = currentDate.getTime();

  if (getFirstDayOfNextMonth().getTime() - timestamp <= 5000) {
    //Week

    historyChannel.send({
      embeds: [embedRankMonth, embedWatchtimeMonth],
    });

    console.log("update history hall for Month");
  }

  if (getNextMonday().getTime() - timestamp <= 5000) {
    // Month
    historyChannel.send({
      embeds: [embedRankWeek],
    });

    console.log("update history hall for Week");
  }
});

//#endregion

//#region  Schedule Function
const rule = new schedule.RecurrenceRule();
rule.second = 35;

const job = schedule.scheduleJob(rule, async () => {
  const pluginsSelected = await pluginsSelectedModel.find({});

  pluginsSelected.forEach(async (guildPlugins) => {
    if (guildPlugins.birthday) {
      const channelsPlugings = await channelsPluginsModel.findOne({
        serverID: guildPlugins.serverID,
      });
      const messagesPlugings = await messagesPluginsModel.findOne({
        serverID: guildPlugins.serverID,
      });

      if (channelsPlugings && channelsPlugings.birthDateChannelID) {
        const channel = client.channels.cache.get(
          channelsPlugings.birthDateChannelID
        ); // get birth day channel

        let userDateslist = [];
        let birthdateData = await birthDateModel.find({});

        birthdateData.forEach((guild) => {
          guild.userBirthDates.forEach((user) => {
            if (
              user.dayDate === new Date().getDate() &&
              user.monthDate === new Date().getMonth() + 1
            ) {
              userDateslist.push(user);
            }
          });
        });

        for (let i = 0; i < userDateslist.length; i++) {
          let response = messagesPlugings.birthdayCelebrateMessage;

          if (response.includes("{user}")) {
            //console.log("has {user}");

            response = response.replace(
              "{user}",
              `<@${userDateslist[i].userID}>`
            );
          }

          if (response.includes("{username}")) {
            //console.log("has {user}");

            response = response.replace(
              "{username}",
              `${userDateslist[i].username}`
            );
          }

          if (response.includes("{server}")) {
            const curGuildName = client.guilds.cache.get(guild.serverID).name;

            response = response.replace("{server}", `${curGuildName}`);
          }

          if (response.includes("{age}")) {
            response = response.replace(
              "{age}",
              `${new Date().getUTCFullYear() - userDateslist[i].yearDate}`
            );
          }

          channel.send(`${response}`);
        }
      }
    }
  });
});

//#endregion

let needUpdate = false;

client.on("messageCreate", async (msg) => {
  if (msg.author.bot || msg.type === "GUILD_MEMBER_JOIN") return; // if the message if from a bot we return
  const userId = msg.author.id;

  let userData = [];

  let isAdministrator = false;

  msg.member.roles.cache.forEach((role) => {
    const { permissions } = role;

    if (permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
      isAdministrator = true;
    }
  });

  const plugins = await pluginsSelectedModel.findOne({
    serverID: msg.guild.id,
  });
  if (plugins && !plugins.leveling) return;

  const channelsData = await channelsPluginsModel.findOne({
    serverID: msg.guild.id,
  });
  let userCanXP = true;

  if (channelsData && channelsData.levelingDeniedChannels) {
    if (channelsData.levelingDeniedChannels.length > 0) {
      channelsData.levelingDeniedChannels.forEach((channel) => {
        if (msg.channel.id === channel.id) userCanXP = false;
      });
    }
  }

  if (channelsData && channelsData.levelingDeniedRoles && !isAdministrator) {
    if (channelsData.levelingDeniedRoles.length > 0) {
      channelsData.levelingDeniedRoles.forEach((role) => {
        if (msg.guild.members.cache.get(msg.author.id).roles.cache.has(role.id))
          userCanXP = false;
      });
    }
  }

  if (!userCanXP) return;

  userData.push({
    userID: userId,
    username: msg.author.username,
    serverID: msg.guild.id,
    avatar: msg.author.avatar,
    cur_Level: currentLvl,
    cur_XP: currentXP,
    max_XP: maxXP,
    next_add_max_XP: addingXP,
    total_XP: totalXP,
  });

  let levelingData = await levelingModel.findOne({ userID: userId });

  if (!levelingData) {
    let user_levels = await levelingModel.create({
      serverList: userData,
      userID: userId,
      username: msg.author.username,
    });

    //console.log("premier msg");
    needUpdate = true;
    update(userId, msg.guild.id, msg.channelId); // update the user xp
  } else {
    userData =
      levelingData.serverList.length > 0 ? levelingData.serverList : [];
    let count = 0;

    if (levelingData.serverList.length <= 0) {
      userData.push({
        userID: userId,
        username: msg.author.username,
        serverID: msg.guild.id,
        avatar: msg.author.avatar,
        cur_Level: currentLvl,
        cur_XP: currentXP,
        max_XP: maxXP,
        next_add_max_XP: addingXP,
        total_XP: totalXP,
      });
      await levelingModel.findOneAndUpdate(
        { userID: userId },
        {
          serverList: userData,
        }
      );
    } else {
      //console.log("deja ecrit dans un serrv");
      levelingData.serverList.forEach(async (guild) => {
        if (guild.serverID !== msg.guild.id) {
          count++;
        }
      });
      if (count >= levelingData.serverList.length) {
        userData.push({
          userID: userId,
          username: msg.author.username,
          serverID: msg.guild.id,
          avatar: msg.author.avatar,
          cur_Level: currentLvl,
          cur_XP: currentXP,
          max_XP: maxXP,
          next_add_max_XP: addingXP,
          total_XP: totalXP,
        });
        await levelingModel.findOneAndUpdate(
          { userID: userId },
          {
            serverList: userData,
          }
        );
        // console.log("n ieme msg");
      }
    }

    needUpdate = true;
    update(userId, msg.guild.id, msg.channelId); // update the user xp
  }
});

const listIDs = [];
const update_userData = [];

function update(userId, guildID, msgChannelID) {
  if (
    !listIDs.some(
      (element) => element.userId === userId && element.guildID === guildID
    )
  ) {
    listIDs.push({ userId, guildID, msgChannelID });
    console.log(listIDs);
  }
  const rule = new schedule.RecurrenceRule();
  rule.second = 0;

  schedule.scheduleJob(rule, async () => {
    if (needUpdate) {
      needUpdate = false;

      for (let i = 0; i < listIDs.length; i++) {
        let updated = false;
        let levelingData = await levelingModel.findOne({
          userID: listIDs[i].userId,
        });

        const current_user = client.users.cache.get(listIDs[i].userId);
        //console.log(listIDs[i].userId, "from", listIDs[i].guildID, i);

        await levelingData.serverList.forEach(async (guild) => {
          if (listIDs[i].guildID === guild.serverID) {
            currentXP += Math.floor(Math.random() * 10) + 15;
            console.log(
              "Xp en + :",
              currentXP,
              "id :",
              listIDs[i].userId,
              "from",
              listIDs[i].guildID
            );

            if (totalXP === 0) totalXP = guild.total_XP; // Get in data the XP of the user.

            totalXP += currentXP; // Adding xp earned;

            currentXP += guild.cur_XP;
            let tmpMaxXP = guild.max_XP;

            currentLvl = guild.cur_Level;

            let addingNextXP = guild.next_add_max_XP;

            if (currentXP >= guild.max_XP) {
              //console.log("level up")

              addingNextXP = guild.next_add_max_XP;

              tmpMaxXP = guild.max_XP;

              currentXP -= tmpMaxXP;

              if (guild.cur_Level === 0) tmpMaxXP += addingNextXP;
              else {
                tmpMaxXP += addingNextXP + 15;
              }
              addingNextXP += 15;

              currentLvl += +1;

              const channelsData = await channelsPluginsModel.findOne({
                serverID: listIDs[i].guildID,
              });
              const messageData = await messagesPluginsModel.findOne({
                serverID: listIDs[i].guildID,
              });

              let levelUpMsg = messageData.levelingUpMessage;

              if (levelUpMsg.includes("{level}")) {
                //console.log("has {level}", currentLvl);
                levelUpMsg = levelUpMsg.replace("{level}", currentLvl);
              }

              if (levelUpMsg.includes("{user}")) {
                //console.log("has {user}");

                levelUpMsg = levelUpMsg.replace(
                  "{user}",
                  `<@${current_user.id}>`
                );
              }
              if (levelUpMsg.includes("{username}")) {
                //console.log("has {user}");

                levelUpMsg = levelUpMsg.replace(
                  "{username}",
                  `${current_user.username}`
                );
              }
              if (levelUpMsg.includes("{server}")) {
                const curGuildName = client.guilds.cache.get(
                  guild.serverID
                ).name;

                levelUpMsg = levelUpMsg.replace("{server}", `${curGuildName}`);
              }

              //console.log(levelUpMsg);

              if (
                channelsData &&
                channelsData.levelingUpChannelID != "undefined"
              ) {
                client.channels.cache
                  .get(channelsData.levelingUpChannelID)
                  .send({ content: levelUpMsg });
              } else
                client.channels.cache
                  .get(listIDs[i].msgChannelID)
                  .send({ content: levelUpMsg });
            }

            update_userData.push({
              userID: current_user.id,
              username: current_user.username,
              serverID: listIDs[i].guildID,
              avatar: current_user.avatar,
              cur_Level: currentLvl,
              cur_XP: currentXP,
              max_XP: tmpMaxXP,
              next_add_max_XP: addingNextXP,
              total_XP: totalXP,
            });
            currentXP = 0;
            currentLvl = 0;
            totalXP = 0;
            //console.log("adding to data");
            updated = true;
            //console.log("uy")
            if (updated) {
              console.log("updating");

              let tempList = [];
              update_userData.forEach((user) => {
                if (user.userID === listIDs[i].userId) {
                  tempList.push(user);
                }
              });

              let leveldata = await levelingModel.findOne({
                userID: listIDs[i].userId,
              });
              let count = 0;

              for (let y = 0; y < leveldata.serverList.length; y++) {
                tempList.forEach((list) => {
                  if (list.serverID !== leveldata.serverList[y].serverID) {
                    count++;
                  }

                  if (count === tempList.length) {
                    tempList.push(leveldata.serverList[y]);
                  }
                });

                count = 0;
              }

              //console.log("tempList", tempList);
              await levelingModel.findOneAndUpdate(
                { userID: listIDs[i].userId },
                {
                  serverList: tempList,
                }
              );

              update_userData.length = 0;
              if (i === listIDs.length - 1) {
                console.log("updated");
                listIDs.length = 0;
                updated = false;
              }
            }
          }
        });
      }
    }
  });
}

//#region Voice Channel Listener

// A set that will contain the IDs of the temporary channels created.
/** @type {Set<import('discord.js').Snowflake>} */
const temporaryChannels = new Set();

const tempChannelsOwnerData = [];

client.on("voiceStateUpdate", async (oldVoiceState, newVoiceState) => {
  try {
    const channelData = await channelsPluginsModel.findOne({
      serverID: newVoiceState.guild.id,
    });
    const mainChannel = channelData.creatorVoiceChannelID; // creater of voice channel

    const oldChannel = oldVoiceState.channel;
    const oldChannelId = oldVoiceState.channelId;
    const newChannelId = newVoiceState.channelId;

    const user = await client.users.fetch(newVoiceState.id);
    const member = newVoiceState.guild.members.cache.get(user.id);

    const parent = client.channels.cache.get(mainChannel).parent.id;

    const messageData = await messagesPluginsModel.findOne({
      serverID: newVoiceState.guild.id,
    });

    let voiceChannelName = messageData.temporaryChannelName;

    if (voiceChannelName.includes("{user}")) {
      voiceChannelName = voiceChannelName.replace("{user}", `<@${member.id}>`);
    }

    if (voiceChannelName.includes("{username}")) {
      //console.log("has {user}");

      voiceChannelName = voiceChannelName.replace(
        "{username}",
        `${member.displayName}`
      );
    }
    if (voiceChannelName.includes("{server}")) {
      const curGuildName = client.guilds.cache.get(newVoiceState.guild.id).name;

      voiceChannelName = voiceChannelName.replace(
        "{server}",
        `${curGuildName}`
      );
    }

    // Create the temporary channel
    if (newChannelId === mainChannel) {
      // Create the temporary voice channel.
      // Note that you can set the parent of the channel in the
      // createChannel call, without having to set the parent in a
      // separate request to Discord's API.
      const channel = await newVoiceState.guild.channels.create(
        voiceChannelName,
        {
          type: "GUILD_VOICE",
          parent: parent,
          permissionOverwrites: [
            {
              id: user.id,
              allow: [
                Permissions.FLAGS.CONNECT,
                Permissions.FLAGS.MANAGE_CHANNELS,
              ],
            },
          ],
        }
      );
      // Add the channel id to the array of temporary channel ids.
      temporaryChannels.add(channel.id);

      tempChannelsOwnerData.push({
        owner: user.id,
        voiceChannel_ID: channel.id,
        guild_ID: newVoiceState.guild.id,
      });
      // Move the member to the new channel.
      await newVoiceState.setChannel(channel);
    }
    if (!oldChannel) return;
    // Remove empty temporary channels
    if (
      // Is the channel empty? (thanks to Rakshith B S for pointing this out)
      !oldChannel.members.size &&
      // Did the user come from a temporary channel?
      temporaryChannels.has(oldChannelId) &&
      // Did the user change channels or leave the temporary channel?
      oldChannelId !== newChannelId
    ) {
      // Delete the channel
      await oldChannel.delete();
      // Remove the channel id from the temporary channels set
      temporaryChannels.delete(oldChannelId);
    }
  } catch (error) {
    // Handle any errors
    console.error(error);
  }
});

//#endregion

//#region Interaction Listener

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);

  const currentVoiceChannel = interaction.guild.members.cache.get(
    interaction.user.id
  ).voice.channel;

  const pluginsSelected = await pluginsSelectedModel.findOne({
    serverID: interaction.guild.id,
  });

  if (!pluginsSelected) return;
  /*if(client.guilds.member.roles.cache.has(command.permissions.id))
    {
        console.log('Next fdp');
    }*/

  if (!command) return;

  try {
    await command.execute(interaction, client);

    if (pluginsSelected.channelManager) {
      const guild = interaction.guild;

      const rolesAdmin = [];

      guild.roles.cache.forEach((role) => {
        const { name, id, permissions, tags } = role;
        if (tags) return;
        if (permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
          rolesAdmin.push({ name, id });
        }
      });

      if (interaction.commandName === "voice") {
        if (
          !currentVoiceChannel ||
          !temporaryChannels.has(currentVoiceChannel.id)
        )
          return interaction.reply({
            content:
              "Vous devez être connecte à un salon temporaire. Cette commande ne peut pas marcher",
            ephemeral: true,
          });

        let isOwnerGuild = false;
        let isAdministrator = false;

        interaction.member.roles.cache.forEach((role) => {
          const { permissions } = role;
          if (permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
            isAdministrator = true;
          }
        });

        if (interaction.guild.ownerId === interaction.user.id) {
          isOwnerGuild = true;
        }

        console.log(
          "isAdministrator",
          isAdministrator,
          "isOwnerGuild",
          isOwnerGuild
        );

        if (interaction.options.getSubcommand() === "rename") {
          // if |A| user use the rename command

          if (!isOwnerGuild && !isAdministrator) {
            if (
              !currentVoiceChannel.permissionOverwrites.cache.has(
                interaction.user.id
              )
            )
              return interaction.reply({
                content: "Ce channel ne t'appartient pas ! ",
                ephemeral: true,
              });
          }

          const newNameChannel = interaction.options.getString("new-name");
          // The user who made the command is the owner so he can Change the name of the channel

          const voiceChannel = interaction.guild.channels.resolve(
            currentVoiceChannel.id
          );
          voiceChannel.setName(`${newNameChannel}`);
          await interaction.reply({
            content: "Le channel a bien ete modifie ! ",
            ephemeral: true,
          });
        }

        if (interaction.options.getSubcommand() === "lock") {
          if (!isOwnerGuild && !isAdministrator) {
            if (
              !currentVoiceChannel.permissionOverwrites.cache.has(
                interaction.user.id
              )
            )
              return interaction.reply({
                content: "Ce channel ne t'appartient pas ! ",
                ephemeral: true,
              });
          }

          let owner_ID;
          console.log(tempChannelsOwnerData);

          tempChannelsOwnerData.forEach((tempChannel) => {
            if (
              interaction.member.voice.channel.id ===
              tempChannel.voiceChannel_ID
            )
              owner_ID = tempChannel.owner;
          });
          const permsVoiceChannel = [
            {
              id: guild.id,
              deny: [Permissions.FLAGS.CONNECT],
            },
            {
              id: owner_ID,
              allow: [
                Permissions.FLAGS.CONNECT,
                Permissions.FLAGS.MANAGE_CHANNELS,
              ],
            },
          ];

          rolesAdmin.forEach((role) => {
            permsVoiceChannel.push({
              id: role.id,
              allow: [
                Permissions.FLAGS.CONNECT,
                Permissions.FLAGS.MANAGE_CHANNELS,
              ],
            });
          });

          // The user who made the command is the owner so he can block this acess of his channel
          currentVoiceChannel.permissionOverwrites
            .set(permsVoiceChannel)
            .catch(console.error);

          await interaction.reply({
            content: "Le channel est maintenant prive ! ",
            ephemeral: true,
          });
        }

        if (interaction.options.getSubcommand() === "unlock") {
          if (!isOwnerGuild && !isAdministrator) {
            if (
              !currentVoiceChannel.permissionOverwrites.cache.has(
                interaction.user.id
              )
            )
              return interaction.reply({
                content: "Ce channel ne t'appartient pas ! ",
                ephemeral: true,
              });
          }

          let owner_ID;
          console.log(tempChannelsOwnerData);

          tempChannelsOwnerData.forEach((tempChannel) => {
            if (
              interaction.member.voice.channel.id ===
              tempChannel.voiceChannel_ID
            )
              owner_ID = tempChannel.owner;
          });

          const permsVoiceChannel = [
            {
              id: guild.id,
              allow: [Permissions.FLAGS.CONNECT],
            },
            {
              id: owner_ID,
              allow: [
                Permissions.FLAGS.CONNECT,
                Permissions.FLAGS.MANAGE_CHANNELS,
              ],
            },
          ];
          // The user who made the command is the owner so he can block this acess of his channel
          currentVoiceChannel.permissionOverwrites
            .set(permsVoiceChannel)
            .catch(console.error);

          await interaction.reply({
            content: "Le channel n'est plus prive ! ",
            ephemeral: true,
          });
        }

        if (interaction.options.getSubcommand() === "user-limit") {
          if (!isOwnerGuild && !isAdministrator) {
            if (
              !currentVoiceChannel.permissionOverwrites.cache.has(
                interaction.user.id
              )
            )
              return interaction.reply({
                content: "Ce channel ne t'appartient pas ! ",
                ephemeral: true,
              });
          }
          const maxUser = interaction.options.getInteger("number");

          if (maxUser > 99)
            return interaction.reply({
              content: "Vous ne pouvez pas mettre une limite superieure a 99",
              ephemeral: true,
            });

          console.log(
            interaction.guild.channels.cache.get(currentVoiceChannel.id)
              .userLimit
          );

          currentVoiceChannel.setUserLimit(maxUser);

          //interaction.guild.channels.cache.get(currentVoiceChannel.id).userLimit = maxUser;

          await interaction.reply({
            content: `Le channel est maintenant limite à ${maxUser} membres ! `,
            ephemeral: true,
          });
        }

        if (interaction.options.getSubcommand() === "owner") {
          let owner_ID;
          console.log(tempChannelsOwnerData);

          tempChannelsOwnerData.forEach((tempChannel) => {
            if (
              interaction.member.voice.channel.id ===
              tempChannel.voiceChannel_ID
            )
              owner_ID = tempChannel.owner;
          });

          await interaction.reply({
            content: `Le proprietaire du salon est <@${owner_ID}>`,
            ephemeral: true,
          });
        }

        if (interaction.options.getSubcommand() === "kick") {
          if (!isOwnerGuild && !isAdministrator) {
            if (
              !currentVoiceChannel.permissionOverwrites.cache.has(
                interaction.user.id
              )
            )
              return interaction.reply({
                content: "Ce channel ne t'appartient pas ! ",
                ephemeral: true,
              });
          }
          const userToKick = interaction.options.getMember("member");

          const member = interaction.guild.members.cache.get(userToKick.id);

          if (member.voice.channel.id !== currentVoiceChannel.id)
            return interaction.reply({
              content: "Cet utilisateur n'est pas dans votre salon",
              ephemeral: true,
            });

          let memberIsOwnerGuild = false;
          let memberIsAdministrator = false;

          member.roles.cache.forEach((role) => {
            const { permissions } = role;
            if (permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
              memberIsAdministrator = true;
            }
          });

          if (interaction.guild.ownerId === member.id) {
            memberIsOwnerGuild = true;
          }

          if (memberIsAdministrator || memberIsOwnerGuild)
            return interaction.reply({
              content: "Vous ne pouvez pas deconnecte un administrateur",
              ephemeral: true,
            });

          member.voice.disconnect();

          interaction.reply({
            content: `<@${member.id}> a bien ete deconnecte du salon`,
            ephemeral: true,
          });
        }

        if (interaction.options.getSubcommand() === "help") {
          const description = `- Les salons temporaires sont crees automatiquement lorsqu'un utilisateur se connecte au salon createur.
                    
                    Cet utilisateur reçoit alors toutes les permissions par rapport a ce salon.Il peut modifier le nom, le rendre prive, deconnecter des utilisateurs ou encore limiter l'acces a son vocal.
                    
                    Une fois que plus aucun utilisateur est connecte au salon, ce dernier se supprimera automatiquement.
                    
                    **Toutes le commandes sont accessible seulement quand vous êtes connecte à un salon temporaire.**
                    
                    
                    **Les Commandes**

                        - **\` voice rename : \`**  
                        Renomer le nom du vocal.

                        - **\` voice lock : \`** 
                        Bloquer l'acces a tous les utilisateurs.

                        - **\` voice unlock : \`** 
                        Debloquer l'acces a tous les utilisateurs.
                    
                        - **\` voice user-limit : \`** 
                        Limiter le nombre d'utilisateurs pouvant se connecter au salon. Si la valeur est de **0**, l'acces est ilimite. La valeur maximal est de 99.
                        
                        -**\` voice owner : \`**
                        Afficher le proprietaire du vocal dans lequel vous êtes connecte.
                       
                        - **\` voice kick : \`** 
                        Expulser un utilisateur de votre vocal.
                        
                    
                    **ATTENTION** Les utilisateurs aillant les permissions administrateurs ont les mêmes permissions que le proprietaire de salon.`;

          const embedHelp = new MessageEmbed()
            .setColor("#0099ff")
            .setAuthor(
              "Toutes les informations a savoir sur les salons temporaires et les commandes"
            )
            .setDescription(description);

          await interaction.reply({ embeds: [embedHelp] });
        }
      }
    }

    if (pluginsSelected.leveling) {
      try {
        if (interaction.commandName === "rank") {
          console.log("rank");
          let currentUser;
          if (interaction.options.data.length <= 0) {
            currentUser = interaction.user;
          } else {
            if (!interaction.options.data[0].user.bot) {
              currentUser = interaction.options.data[0].user;
            } else
              return interaction.reply({
                content: `<@${interaction.options.data[0].user.id}> est un bot ! Les bots n'ont pas de rank.`,
                ephemeral: true,
              });
          }

          const userData = await userPreferenceModel.findOne({
            discordId: currentUser.id,
          });
          const levelingTxtData = await messagesPluginsModel.findOne({
            serverID: interaction.guild.id,
          });

          const userCardColor = userData
            ? userData.levelingCardColor
            : levelingTxtData.levelingDefaultColor;
          const userCardBackground = userData
            ? userData.levelingCardBackground
            : undefined;

          let guildLevelingData = await levelingModel.find({});

          let usersListGuilds = [];
          let Users_Guilds_List = []; // list with all the users guilds
          const curGuildLeaderboard = []; // list with all the current guild users

          guildLevelingData.forEach((user) => {
            usersListGuilds.push(user.serverList);
          });

          usersListGuilds.forEach((user) => {
            for (let i = 0; i < user.length; i++) {
              const element = user[i];
              Users_Guilds_List.push(element);
            }
          });

          Users_Guilds_List.forEach((user) => {
            if (user.serverID === interaction.guild.id) {
              curGuildLeaderboard.push(user);
            }
          });

          curGuildLeaderboard.sort(function (x, y) {
            return y.total_XP - x.total_XP;
          });

          console.log("Data Sorted");
          console.table(curGuildLeaderboard);

          if (curGuildLeaderboard.length <= 0)
            return interaction.reply({
              content: "Personne n'a ecrit encore dans ce serveur !",
              ephemeral: true,
            });

          let curUserStats = [];
          let currentUserRank = 0;

          for (let i = 0; i < curGuildLeaderboard.length; i++) {
            if (curGuildLeaderboard[i].userID === currentUser.id) {
              currentUserRank = i + 1;
              curUserStats = curGuildLeaderboard[i];
            }
          }

          if (curUserStats.length <= 0)
            return interaction.reply({
              content:
                "Tu dois ecrire dans un salon textuel avant de voir ton rank !",
              ephemeral: true,
            });

          console.log(
            "User :",
            currentUser.username,
            "\nRank :#",
            currentUserRank
          );

          // The userID in data base is not in de json file

          // Pass the entire Canvas object because you'll need access to its width and context
          const applyText = (canvas, text) => {
            const context = canvas.getContext("2d");

            // Declare a base size of the font
            let fontSize = 60;

            do {
              // Assign the font to the context and decrement it so it can be measured again
              context.font = `sans bold ${(fontSize -= 10)}px `;
              // Compare pixel width of the text to the canvas minus the approximate avatar size
            } while (context.measureText(text).width > canvas.width / 4);

            // Return the result to use in the actual canvas
            return context.font;
          };

          // Create a 935x280 pixel canvas and get its context
          // The context will be used to modify the canvas

          const canvas = Canvas.createCanvas(935, 280);
          const context = canvas.getContext("2d");

          const background = userCardBackground
            ? await Canvas.loadImage(`./img/${userCardBackground}.jpg`)
            : userCardBackground;
          context.globalAlpha = 1;
          // This uses the canvas dimensions to stretch the image onto the entire canvas

          if (!background) {
            context.fillStyle = "#23272A";
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.globalAlpha = 1;
            context.fillStyle = "black";
            context.globalAlpha = 0.75;
            context.fillRect(20, 20, canvas.width - 40, canvas.height - 40);
            context.globalAlpha = 1;
          } else {
            context.drawImage(background, 0, 0, canvas.width, canvas.height);
            context.fillStyle = "black";
            context.globalAlpha = 0.25;
            context.fillRect(20, 20, canvas.width - 40, canvas.height - 40);
            context.globalAlpha = 1;
          }

          //#region XP Bar

          let maxSize_XPBar = 860; //AXE X end
          let minSize_XPBar = 245; //AXE X start

          let curXPBar =
            (curUserStats.cur_XP / curUserStats.max_XP) *
              (maxSize_XPBar - minSize_XPBar) +
            minSize_XPBar;

          // shadow bar XP
          context.beginPath();
          context.moveTo(minSize_XPBar, 225);
          context.lineTo(maxSize_XPBar, 225);
          context.lineWidth = 45;
          context.lineCap = "round";
          context.strokeStyle = "black";
          context.stroke();

          // background bar XP
          context.beginPath();
          context.moveTo(minSize_XPBar, 225);
          context.lineTo(maxSize_XPBar, 225);
          context.lineWidth = 35;
          context.lineCap = "round";
          context.strokeStyle = "#424242";
          context.stroke();

          //first ground bar XP
          context.beginPath();
          context.moveTo(minSize_XPBar, 225);
          context.lineTo(curXPBar, 225);
          context.lineWidth = 35;
          context.lineCap = "round";
          context.strokeStyle = userCardColor;
          context.stroke();

          context.textAlign = "center";
          //setup xp info txt
          context.font = `sans bold 25px `;
          context.fillStyle = "#ffffff";
          context.fillText(
            `${curUserStats.cur_XP} / ${curUserStats.max_XP} XP`,
            (maxSize_XPBar - minSize_XPBar) / 2 + minSize_XPBar,
            235
          );

          //#endregion

          //#region User info (RANK + LVL)

          context.textAlign = "center";

          // LEVEL
          context.font = `sans 30px `;
          context.fillStyle = "#ffffff";
          context.fillText("LEVEL", canvas.width - 100, 55);

          context.font = `sans bold 45px `;
          context.fillStyle = userCardColor;

          context.fillText(curUserStats.cur_Level, canvas.width - 100, 110);

          //RANK
          context.font = `sans 30px `;
          context.fillStyle = "#ffffff";
          context.fillText("RANK", canvas.width - 230, 55);

          context.font = `sans bold 40px `;
          context.fillStyle = "#ffffff";
          context.fillText(`#${currentUserRank}`, canvas.width - 230, 110);

          //#endregion

          //#region User name and Logos

          context.font = applyText(canvas, curUserStats.username);
          context.fillStyle = "#ffffff";
          context.fillText(
            curUserStats.username,
            canvas.width / 2 - 115,
            canvas.height - 100
          );

          // -------- User LOGO -------- //

          // Pick up the pen
          context.beginPath();

          // Start the arc to form a circle
          context.arc(120, 135, 80, 0, Math.PI * 2, true);

          context.lineWidth = 3;
          context.strokeStyle = "#dbdbdb";

          // -------- Guild LOGO -------- //

          // Start the arc to form a circle
          context.arc(canvas.width / 2 + 10, 60, 30, 0, Math.PI * 2, true);
          context.lineWidth = 3;
          context.strokeStyle = "#dbdbdb";
          //context.stroke();

          context.clip();

          // -------- Images USER + LOGO -------- //

          const guildIcon = await Canvas.loadImage(
            interaction.guild.iconURL({ format: "jpg" })
          );

          // Draw a shape onto the main canvas
          context.drawImage(guildIcon, canvas.width / 2 - 21, 29, 62, 62);

          const avatar = await Canvas.loadImage(
            currentUser.displayAvatarURL({ format: "jpg" })
          );

          // Draw a shape onto the main canvas
          context.drawImage(avatar, 40, 55, 160, 160);

          context.closePath();

          // -------- Circle around user image -------- //

          context.beginPath();

          // Start the arc to form a circle
          context.arc(120, 135, 80, 0, Math.PI * 2, true);
          context.lineWidth = 8;
          context.strokeStyle = "white";
          context.stroke();

          //#endregion

          // Use the helpful Attachment class structure to process the file for you
          const attachment = new MessageAttachment(
            canvas.toBuffer(),
            "rank.png"
          );

          interaction.reply({ files: [attachment] });
        }
      } catch (error) {
        console.log(error);
        await interaction.reply({
          content: "Oups desole j'ai fait une erreur ! Peux-tu recommencer",
          ephemeral: true,
        });
      }
    }
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: "Oups desole j'ai fait une erreur ! Peux-tu recommencer",
      ephemeral: true,
    });
  }
});

//#endregion

client.login(process.env.token);
