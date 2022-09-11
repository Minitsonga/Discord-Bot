const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed, Permissions } = require("discord.js");

const { timeConversion } = require("../timeConversion");

const wait = require('util').promisify(setTimeout);


const economyModel = require("../models/economySchema");
const channelsPluginsModel = require("../models/channelsPluginsSchema");
const serverStatsModel = require("../models/serverStatsSchema");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('eco')
        .setDescription("Economie du serveur")
        .addSubcommandGroup(subGroup =>
            subGroup.setName("-")
                .setDescription("User utils")
                .addSubcommand(subcommand =>
                    subcommand.setName('shop')
                        .setDescription("Accèdez au shop"))
                .addSubcommand(subcommand =>
                    subcommand.setName('work')
                        .setDescription("Travaillez et recevez votre argent")
                        .addStringOption(option =>
                            option.setName("request")
                                .setDescription('Reccupérez votre argent ou commencez à travailler ')
                                .addChoice("Status", "state")
                                .addChoice("Start Working", "start")
                                .addChoice("Claim Salary", "claim")
                                .setRequired(true)))
                .addSubcommand(subcommand =>
                    subcommand.setName('daily-gift')
                        .setDescription("Recevez un petit cadeau chaque jour"))
                .addSubcommand(subcommand =>
                    subcommand.setName('wallet')
                        .setDescription("Accèdez à votre argent"))
                .addSubcommand(subcommand =>
                    subcommand.setName('top')
                        .setDescription("Affichez les plus riches du serveur")))
        .addSubcommandGroup(subGroup =>
            subGroup.setName("--")
                .setDescription("gambling games")
                .addSubcommand(subcommand =>
                    subcommand.setName('dice')
                        .setDescription("Choisissez un chiffre et lancez les dés")
                        .addIntegerOption(option =>
                            option.setName('number')
                                .setDescription("Choisissez un nombre entre 1 et 12")
                                .setRequired(true))
                        .addIntegerOption(option =>
                            option.setName('amount')
                                .setDescription("Misez votre argent. 0 pour tout miser")
                                .setRequired(true)))
                .addSubcommand(subcommand =>
                    subcommand.setName('secret-number')
                        .setDescription("Trouvez le nombre secret")
                        .addIntegerOption(option =>
                            option.setName('amount')
                                .setDescription("Misez votre argent. 0 pour tout miser")
                                .setRequired(true)))
                .addSubcommand(subcommand =>
                    subcommand.setName('roulette')
                        .setDescription("Misez mais attention cela peut mal tourner")
                        .addIntegerOption(option =>
                            option.setName('amount')
                                .setDescription("Misez votre argent. 0 pour tout miser")
                                .setRequired(true)))),



    category: "economy",

    async execute(interaction, client) {

        const channelsPlugings = await channelsPluginsModel.findOne({ serverID: interaction.guild.id })

        const serverStatsData = await serverStatsModel.findOne({ serverID: interaction.guild.id })


        let isAdministrator = false;

        interaction.member.roles.cache.forEach(role => {
            const { permissions } = role;

            if (permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
                isAdministrator = true;
            }
        });





        const economyData = await economyModel.findOne({ serverID: interaction.guild.id })

        try {

            if (!economyData || economyData.usersList.length <= 0) {

                let economyUser = await economyModel.create({

                    serverID: interaction.guild.id,
                    name: interaction.guild.name,
                    usersList: [{
                        "userID": interaction.user.id,
                        "username": interaction.user.username,
                        "userTag": interaction.user.tag,
                        "wallet": 0,
                        "items": [],
                        "isWorking": false,
                        "lastTimeWorked": 0,
                        "timeBeforeWorking": 0,
                        "totalSalary": 0,
                        "takedDailyGift": false,
                        "lastTimeGifted": 0,
                        "jobsCount": 0,
                        "lastTimePlayedDice": 0,
                        "CoolDownDice": 7200000,
                        "lastTimePlayedSecretNB": 0,
                        "CoolDownSecretNB": 7200000,
                        "lastTimePlayedRoulette": 0,
                        "CoolDownRoulette": 7200000,
                        "lastTimePlayedBJ": 0,
                        "CoolDownBJ": 18000000,

                    }],
                    topRichest: [],

                })
                economyUser.save();
                console.log("Je cree");
            }
            else if (economyData && economyData.usersList.length > 0) {

                let count = 0;
                economyData.usersList.forEach(user => {
                    if (user.userID !== interaction.user.id) count++;

                })
                if (count >= economyData.usersList.length) {
                    economyData.usersList.push({
                        "userID": interaction.user.id,
                        "username": interaction.user.username,
                        "userTag": interaction.user.tag,
                        "wallet": 0,
                        "items": [],
                        "isWorking": false,
                        "lastTimeWorked": 0,
                        "timeBeforeWorking": 0,
                        "totalSalary": 0,
                        "takedDailyGift": false,
                        "lastTimeGifted": 0,
                        "jobsCount": 0,
                        "lastTimePlayedDice": 0,
                        "CoolDownDice": 7200000,
                        "lastTimePlayedSecretNB": 0,
                        "CoolDownSecretNB": 7200000,
                        "lastTimePlayedRoulette": 0,
                        "CoolDownRoulette": 7200000,
                        "lastTimePlayedBJ": 0,
                        "CoolDownBJ": 18000000,
                    })
                    console.log("nouvel user");
                }

            }
            await economyModel.findOneAndUpdate({ serverID: interaction.guild.id },
                {
                    usersList: economyData.usersList
                }
            );

        }
        catch (err) {
            console.log(err);
        }


        let denyRolesList = [];
        let userCanUseCommand = true;
        serverStatsData.commandsCategoryPerms.forEach(element => {
            if (element.category === this.category) {

                if (element.currentPerms.denyRoles && element.currentPerms.denyRoles.length > 0) denyRolesList = element.currentPerms.denyRoles;

            }
        })


        if (denyRolesList.length > 0) {
            denyRolesList.forEach(role => {

                if (interaction.guild.members.cache.get(interaction.user.id).roles.cache.has(role.id)) {
                    userCanUseCommand = false

                }
            })
        }



        if (!userCanUseCommand && !isAdministrator) return interaction.reply({ content: "Vous n'avez pas le droit d'utiliser cette commande ! Désolé", ephemeral: true })


        const economyDataUpdated = await economyModel.findOne({ serverID: interaction.guild.id })

        let userEconomyData = {};

        let usersEconomyList = economyDataUpdated.usersList;

        economyDataUpdated.usersList.forEach(element => {

            if (interaction.user.id === element.userID) {
                userEconomyData = element;

            }

        })

        if (interaction.options.getSubcommand() === 'shop') {
            if (!channelsPlugings || !channelsPlugings.economyChannelID || channelsPlugings.economyChannelID === 'undefined') return interaction.reply({ content: "Oups désolé j'ai fait une erreur ! Pouvez-vous recommencer", ephemeral: true });

            if (interaction.channel.id !== channelsPlugings.economyChannelID) return interaction.reply({ content: `Vous ne pouvez pas utiliser cette commande ici ! Ressayez dans le channel <#${channelsPlugings.economyChannelID}> `, ephemeral: true });

            return interaction.reply({content: 'Arrive prochainement'})

        }

        if (interaction.options.getSubcommand() === 'work') {

            if (!channelsPlugings || !channelsPlugings.economyChannelID || channelsPlugings.economyChannelID === 'undefined') return interaction.reply({ content: "Oups désolé j'ai fait une erreur ! Pouvez-vous recommencer", ephemeral: true });

            if (interaction.channel.id !== channelsPlugings.economyChannelID) return interaction.reply({ content: `Vous ne pouvez pas utiliser cette commande ici ! Ressayez dans le channel <#${channelsPlugings.economyChannelID}> `, ephemeral: true });


            const action = interaction.options.getString("request");

            const timeLeftForWork = userEconomyData.timeBeforeWorking - (new Date().getTime() - userEconomyData.lastTimeWorked)

            let timeLeftBeforeWorkingAgain;

            if (timeLeftForWork <= 0) {
                userEconomyData.isWorking = false;
            }
            else {
                console.log("time left", timeConversion(timeLeftForWork))
                timeLeftBeforeWorkingAgain = timeConversion(timeLeftForWork)
            }
            console.log("start data ", usersEconomyList);


            if (action === "state") {
                const descriptionWorking = `**${interaction.user.username}**, Vous êtes actuellement en train de travailler. 
                Il vous reste **${timeLeftBeforeWorkingAgain}** avant de pouvoir récupérer votre salaire qui sera de **${userEconomyData.totalSalary}** 💶 `
                const descriptionNotWorking = `**${interaction.user.username}**, Vous n'êtes pas en train de travailler. Vous avez actuellement un salaire de **${userEconomyData.totalSalary}** 💶
                Vous pouvez soit trouver un autre job et accumulé plus de 💶 ou soit récupérer maintenant votre salaire`

                const description = (timeLeftForWork <= 0) ? descriptionNotWorking : descriptionWorking;

                const embedStatus = new MessageEmbed()
                    .setColor("#0099ff")
                    .setDescription(description)

                interaction.reply({ embeds: [embedStatus] });
            }
            else if (action === "start") {

                const embedDenyWork = new MessageEmbed()
                    .setColor('#FF0000')
                    .setAuthor("Ah ! Mince...")
                    .setDescription(`**${interaction.user.username}**, Vous êtes déjà en train de travailler ! 
                    Revenez dans **${timeLeftBeforeWorkingAgain}** pour reprendre un contrat`)

                if (userEconomyData.isWorking) return interaction.reply({ embeds: [embedDenyWork] });

                //                          30min    45min      1h       2h       5h
                const durationPossible = [1800000, 2700000, 3600000, 7200000, 18000000]

                const index = Math.floor(Math.random() * durationPossible.length - 1);

                const workDuration = durationPossible[index];
                const workDurationString = timeConversion(durationPossible[index]);

                console.log("durée", workDurationString)

                if (workDurationString.length <= 0) return interaction.reply({ content: "Oups désolé j'ai fait une erreur ! Pouvez-vous recommencer", ephemeral: true });

                const moneyEarned = Math.floor(Math.random() * 400) + 100;
                userEconomyData.totalSalary += moneyEarned;
                const embedWorkStart = new MessageEmbed()
                    .setColor('#0099ff')
                    .setAuthor(`${interaction.user.username}, Votre travail commence !`)
                    .setDescription(`Il durera **${workDurationString}**, et vous gagnerez un salaire total de ${userEconomyData.totalSalary}   
                Revenez une fois terminé pour travailler encore ou réccupérer votre argent`)


                console.log("money earned ", moneyEarned);


                userEconomyData.isWorking = true;
                userEconomyData.lastTimeWorked = new Date().getTime();
                userEconomyData.timeBeforeWorking = workDuration;

                userEconomyData.jobsCount++;

                console.log("updated", userEconomyData);
                usersEconomyList.forEach(element => {
                    if (element.userID === interaction.user.id) {
                        element = userEconomyData;
                    }
                })

                interaction.reply({ embeds: [embedWorkStart] });

            }
            else if (action === "claim") {
                const embedDenyClaim_Working = new MessageEmbed()
                    .setColor('#FF0000')
                    .setAuthor("Ah ! Mince...")
                    .setDescription(`Vous êtes déjà en train de travailler ! 
                Revenez dans **${timeLeftBeforeWorkingAgain}** pour récupérer votre argent`)

                const embedDenyClaim_NeedWork = new MessageEmbed()
                    .setColor('#FF0000')
                    .setAuthor("Ah ! Mince...")
                    .setDescription(`Vous devez travailler avant de récupérer votre argent !`)

                if (userEconomyData.isWorking) return interaction.reply({ embeds: [embedDenyClaim_Working] });

                if (userEconomyData.totalSalary <= 0) return interaction.reply({ embeds: [embedDenyClaim_NeedWork] });


                const embedWorkClaim = new MessageEmbed()
                    .setColor('#0099ff')
                    .setAuthor("Après de dures labeurs")
                    .setDescription(`Voici ton salaire: **${userEconomyData.totalSalary}** 💶`)

                interaction.reply({ embeds: [embedWorkClaim] });

                userEconomyData.wallet += userEconomyData.totalSalary;
                userEconomyData.isWorking = false;
                userEconomyData.lastTimeWorked = 0;
                userEconomyData.timeBeforeWorking = 0;
                userEconomyData.totalSalary = 0;
            }

            console.log("data ", usersEconomyList);

            await economyModel.findOneAndUpdate({ serverID: interaction.guild.id },
                {
                    usersList: usersEconomyList
                }
            );

        }

        if (interaction.options.getSubcommand() === 'daily-gift') {

            if (!channelsPlugings || !channelsPlugings.economyChannelID || channelsPlugings.economyChannelID === 'undefined') return interaction.reply({ content: "Oups désolé j'ai fait une erreur ! Pouvez-vous recommencer", ephemeral: true });

            if (interaction.channel.id !== channelsPlugings.economyChannelID) return interaction.reply({ content: `Vous ne pouvez pas utiliser cette commande ici ! Ressayez dans le channel <#${channelsPlugings.economyChannelID}> `, ephemeral: true });


            const timeLeft = new Date().getTime() - userEconomyData.lastTimeGifted;

            const timeUntilNewGift = timeConversion(86400000 - timeLeft);

            const embedDenyGift = new MessageEmbed()
                .setColor('#FF0000')
                .setAuthor("Cadeau journalier")
                .setDescription(`**${interaction.user.username}**, Vous avez déjà récupéré votre cadeau du jour ! 
                Revenez dans **${timeUntilNewGift}**`)


            if (timeLeft >= 86400000) userEconomyData.takedDailyGift = false;
            else return interaction.reply({ embeds: [embedDenyGift] })

            const giftAmmount = Math.floor(Math.random() * 2000) + 500;

            const embedGift = new MessageEmbed()
                .setColor('#0099ff')
                .setAuthor("Cadeau Journalier")
                .setDescription(`Tenez **${interaction.user.username}** ! Voila votre cadeau du jour....
                
                **${giftAmmount}** 💶 rien que pour vous ! Faîtes en bonne usage`)

            interaction.reply({ embeds: [embedGift] })


            userEconomyData.takedDailyGift = true;
            userEconomyData.lastTimeGifted = new Date().getTime();
            userEconomyData.wallet += giftAmmount;


            console.log("updated", userEconomyData);
            usersEconomyList.forEach(element => {
                if (element.userID === interaction.user.id) {
                    element = userEconomyData;
                }
            })

            await economyModel.findOneAndUpdate({ serverID: interaction.guild.id },
                {
                    usersList: usersEconomyList
                }
            );

        }

        if (interaction.options.getSubcommand() === 'wallet') {

            if (!channelsPlugings || !channelsPlugings.economyChannelID || channelsPlugings.economyChannelID === 'undefined') return interaction.reply({ content: "Oups désolé j'ai fait une erreur ! Pouvez-vous recommencer", ephemeral: true });

            if (interaction.channel.id !== channelsPlugings.economyChannelID) return interaction.reply({ content: `Vous ne pouvez pas utiliser cette commande ici ! Ressayez dans le channel <#${channelsPlugings.economyChannelID}> `, ephemeral: true });

            const embedWallet = new MessageEmbed()
                .setColor('#0099ff')
                .setDescription(`${userEconomyData.userTag}, vous avez **${userEconomyData.wallet}** 💶`)

            interaction.reply({ embeds: [embedWallet] })
        }

        if (interaction.options.getSubcommand() === 'top') {

            if (!channelsPlugings || !channelsPlugings.economyChannelID || channelsPlugings.economyChannelID === 'undefined') return interaction.reply({ content: "Oups désolé j'ai fait une erreur ! Pouvez-vous recommencer", ephemeral: true });

            if (interaction.channel.id !== channelsPlugings.economyChannelID) return interaction.reply({ content: `Vous ne pouvez pas utiliser cette commande ici ! Ressayez dans le channel <#${channelsPlugings.economyChannelID}> `, ephemeral: true });


            usersEconomyList.sort(function (x, y) {
                return y.wallet - x.wallet;
            });


            await economyModel.findOneAndUpdate({ serverID: interaction.guild.id },
                {
                    topRichest: usersEconomyList
                }
            );


            let listLeaderboard = [];

            for (let i = 0; i < usersEconomyList.length; i++) {
                listLeaderboard.push(`#${i + 1} : <@${usersEconomyList[i].userID}> => **${usersEconomyList[i].wallet}** 💶 - **${usersEconomyList[i].jobsCount}** jobs éffectués\n`)
            }

            let data = listLeaderboard.join("");
            const embedTopRichest = new MessageEmbed()
                .setColor('GREEN')
                .setTitle(`TOP ${usersEconomyList.length} des plus riches`)
                .setAuthor(`Classement des plus riches de  ${interaction.guild.name}`, interaction.guild.iconURL())
                .setDescription(data)
                .setTimestamp()
                .setFooter(interaction.user.username, interaction.user.displayAvatarURL());

            interaction.reply({ embeds: [embedTopRichest] })
        }

        //------------------------------- GAMES -------------------------------//


        if (interaction.options.getSubcommand() === 'dice') {

            if (!channelsPlugings || !channelsPlugings.gamblingGamesChannelID || channelsPlugings.gamblingGamesChannelID === 'undefined') return interaction.reply({ content: "Oups désolé j'ai fait une erreur ! Pouvez-vous recommencer", ephemeral: true });

            if (interaction.channel.id !== channelsPlugings.gamblingGamesChannelID) return interaction.reply({ content: `Vous ne pouvez pas utiliser cette commande ici ! Ressayez dans le channel <#${channelsPlugings.gamblingGamesChannelID}> `, ephemeral: true });

            let ammount = interaction.options.getInteger("amount");

            if (ammount === 0) ammount = userEconomyData.wallet;
            const userBet = ammount;

            const userNumber = interaction.options.getInteger("number");

            if (userEconomyData.wallet <= 0 || userBet > userEconomyData.wallet) {
                return interaction.reply({
                    content: `Vous n'avez pas suffisament de 💶 !
                    Vous pouvez miser au maximum **${userEconomyData.wallet}** 💶`, ephemeral: true
                })
            }



            if (userNumber > 12 || userNumber < 1) return interaction.reply({ content: `Vous devez utiliser un chiffre en 1 et 12 !`, ephemeral: true })

            const timeLeft = userEconomyData.CoolDownDice - (new Date().getTime() - userEconomyData.lastTimePlayedDice)

            let timeLeftBeforePlayAgain;

            if (timeLeft > 0) {

                console.log("time left", timeConversion(timeLeft))
                timeLeftBeforePlayAgain = timeConversion(timeLeft)

                const embedDenyPlay = new MessageEmbed()
                    .setColor('#FF0000')
                    .setAuthor("Ah ! Mince...")
                    .setDescription(`<@${interaction.user.id}>, Vous êtes déjà jouer a ce jeu ! 
            Revenez dans **${timeLeftBeforePlayAgain}** pour rejouer`)

                return interaction.reply({ embeds: [embedDenyPlay] })
            }




            console.log("start data ", usersEconomyList);

            const firstDiceNumber = Math.floor(Math.random() * 5) + 1;
            const secondDiceNumber = Math.floor(Math.random() * 5) + 1;

            const totalDiceNumber = secondDiceNumber + firstDiceNumber;



            userEconomyData.lastTimePlayedDice = new Date().getTime();
            const embedPlay = new MessageEmbed()
                .setColor('#0099ff')
                .setAuthor("Jouons aux dés")
                .setDescription(`**${interaction.user.username}** mise **${userBet}** 💶 sur le numéro **${userNumber}** !`)

            interaction.reply({ embeds: [embedPlay] });
            await wait(2000);
            await interaction.channel.send({ content: ` 🎲 Je lance les dés ... 🎲 ` });
            await wait(2000);
            await interaction.channel.send({ content: ` 🎲 Attention ... 🎲 ` });
            await wait(4000);
            await interaction.channel.send({ content: ` 🎲 Le premier dé s'arrête sur le **${firstDiceNumber}** 🎲 ` });
            await wait(2000);
            await interaction.channel.send({ content: ` 🎲 Le deuxième dé s'arrête sur le **${secondDiceNumber}** 🎲 ` });
            await wait(1500);
            await interaction.channel.send({ content: ` 🎲 Le total est de ${totalDiceNumber} 🎲 ` });

            if (totalDiceNumber === userNumber) {
                await interaction.channel.send({ content: ` 🎲 Bravo !! **${interaction.user.username}** gagne **${userBet}** 💶 🤑 ` });
                userEconomyData.wallet += userBet;
            }
            else {
                await interaction.channel.send({ content: ` 🎲 Dommage ! **${interaction.user.username}** perd **${userBet}** 💶 😔 ` });
                userEconomyData.wallet -= userBet;

            }


            console.log("updated", userEconomyData);

            usersEconomyList.forEach(element => {
                if (element.userID === interaction.user.id) {
                    element = userEconomyData;
                }
            })

            await economyModel.findOneAndUpdate({ serverID: interaction.guild.id },
                {
                    usersList: usersEconomyList
                }
            );

        }

        if (interaction.options.getSubcommand() === 'secret-number') {
            
            if (!channelsPlugings || !channelsPlugings.gamblingGamesChannelID || channelsPlugings.gamblingGamesChannelID === 'undefined') return interaction.reply({ content: "Oups désolé j'ai fait une erreur ! Pouvez-vous recommencer", ephemeral: true });
            if (interaction.channel.id !== channelsPlugings.gamblingGamesChannelID) return interaction.reply({ content: `Vous ne pouvez pas utiliser cette commande ici ! Ressayez dans le channel <#${channelsPlugings.gamblingGamesChannelID}> `, ephemeral: true });

            let ammount = interaction.options.getInteger("amount");

            if (ammount === 0) ammount = userEconomyData.wallet;
            const userBet = ammount;

            if (userEconomyData.wallet <= 0 || userBet > userEconomyData.wallet) {
                return interaction.reply({
                    content: `Vous n'avez pas suffisament de 💶 ! Vous pouvez miser au maximum **${userEconomyData.wallet}** 💶`, ephemeral: true
                })
            }

            if (userBet <= 0) return interaction.reply({ content: `Votre mise doit être positive !`, ephemeral: true })

            const timeLeft = userEconomyData.CoolDownSecretNB - (new Date().getTime() - userEconomyData.lastTimePlayedSecretNB)

            let timeLeftBeforePlayAgain;

            if (timeLeft > 0) {

                console.log("time left", timeConversion(timeLeft))
                timeLeftBeforePlayAgain = timeConversion(timeLeft)

                const embedDenyPlay = new MessageEmbed()
                    .setColor('#FF0000')
                    .setAuthor("Ah ! Mince...")
                    .setDescription(`<@${interaction.user.id}>, Vous êtes déjà jouer a ce jeu ! 
            Revenez dans **${timeLeftBeforePlayAgain}** pour rejouer`)

                return interaction.reply({ embeds: [embedDenyPlay] })
            }
            console.log("start data ", usersEconomyList);


            let userTries = 5;
            let cur_userTries = userTries;
            const secretNumber = Math.floor(Math.random() * 99) + 1;

            userEconomyData.lastTimePlayedSecretNB = new Date().getTime();
            const embedPlay = new MessageEmbed()
                .setColor('#0099ff')
                .setAuthor("Jouons aux dés")
                .setDescription(`**${interaction.user.username}** mise **${userBet}** 💶! Vous avez **${userTries}** essais pour trouver le nombre caché`)

            interaction.reply({ embeds: [embedPlay] });
            await wait(500);
            await interaction.channel.send({ content: `**${interaction.user.username}**, Ecrivez un nombre` });

            let userNumber;
            let gameEnded = false;

            client.on('messageCreate', async (msg) => {

                if (msg.type != 'DEFAULT') return;

                if (msg.author.id === interaction.user.id) {


                    if (!isNaN(msg.content) && cur_userTries > 0) {

                        userNumber = parseInt(msg.content);

                        if (userNumber < secretNumber) {
                            cur_userTries--;

                            if (cur_userTries <= 0) {

                                const embedLoose = new MessageEmbed()
                                    .setColor('#FF0000')
                                    .setAuthor(`Dommage ${interaction.user.username} !`)
                                    .setDescription(`Le nombre caché était : **${secretNumber}**. Vous perdez malheureusement **${userBet}** 💶`)

                                await wait(1000);

                                console.log("endSup")
                                userEconomyData.wallet -= userBet;

                                console.log("updatedSupLoose", userEconomyData);
                                usersEconomyList.forEach(element => {
                                    if (element.userID === interaction.user.id) {
                                        element = userEconomyData;
                                    }
                                })

                                await economyModel.findOneAndUpdate({ serverID: interaction.guild.id },
                                    {
                                        usersList: usersEconomyList
                                    }
                                );

                                return interaction.channel.send({ embeds: [embedLoose] });
                            }

                            await wait(1000);
                            await interaction.channel.send({ content: `Le nombre secret est **plus grand** que **${userNumber}**. Plus que **${cur_userTries}** essais` });

                        }
                        else if (userNumber > secretNumber) {
                            cur_userTries--;

                            if (cur_userTries <= 0) {
                                gameEnded = true;
                                const embedLoose = new MessageEmbed()
                                    .setColor('#FF0000')
                                    .setAuthor(`Dommage ${interaction.user.username} !`)
                                    .setDescription(`Le nombre caché était : **${secretNumber}**. Vous perdez malheureusement **${userBet}** 💶`)

                                await wait(1000);

                                console.log("endLess")
                                userEconomyData.wallet -= userBet;

                                console.log("updated lessLoose", userEconomyData);
                                usersEconomyList.forEach(element => {
                                    if (element.userID === interaction.user.id) {
                                        element = userEconomyData;
                                    }
                                })

                                await economyModel.findOneAndUpdate({ serverID: interaction.guild.id },
                                    {
                                        usersList: usersEconomyList
                                    }
                                );

                                return interaction.channel.send({ embeds: [embedLoose] });
                            }

                            await wait(1000);
                            await interaction.channel.send({ content: `Le nombre secret est **plus petit** que **${userNumber}**. Plus que **${cur_userTries}** essais` });

                        }
                        else if (userNumber === secretNumber) {

                            const embedWin = new MessageEmbed()
                                .setColor('GREEN')
                                .setAuthor(`Victoire ${interaction.user.username}`)
                                .setDescription(`Bravo !! Vous avez trouvé le nombre caché : **${secretNumber}**. 
                                    Voici votre mise **${userBet}** 💶`)



                            await wait(1000);


                            userEconomyData.wallet += userBet;

                            console.log("updatedWin", userEconomyData);
                            usersEconomyList.forEach(element => {
                                if (element.userID === interaction.user.id) {
                                    element = userEconomyData;
                                }
                            })

                            await economyModel.findOneAndUpdate({ serverID: interaction.guild.id },
                                {
                                    usersList: usersEconomyList
                                }
                            );

                            return interaction.channel.send({ embeds: [embedWin] });

                        }
                    }

                }
            })
        }

        if (interaction.options.getSubcommand() === 'roulette') {

            if (!channelsPlugings || !channelsPlugings.gamblingGamesChannelID || channelsPlugings.gamblingGamesChannelID === 'undefined') return interaction.reply({ content: "Oups désolé j'ai fait une erreur ! Pouvez-vous recommencer", ephemeral: true });

            if (interaction.channel.id !== channelsPlugings.gamblingGamesChannelID) return interaction.reply({ content: `Vous ne pouvez pas utiliser cette commande ici ! Ressayez dans le channel <#${channelsPlugings.gamblingGamesChannelID}> `, ephemeral: true });

            let ammount = interaction.options.getInteger("amount");

            if (ammount === 0) ammount = userEconomyData.wallet;
            const userBet = ammount;

            if (userEconomyData.wallet <= 0 || userBet > userEconomyData.wallet) {
                return interaction.reply({
                    content: `Vous n'avez pas suffisament de 💶 ! Vous pouvez miser au maximum **${userEconomyData.wallet}** 💶`, ephemeral: true
                })
            }

            if (userBet <= 0) return interaction.reply({ content: `Votre mise doit être positive !`, ephemeral: true })

            const timeLeft = userEconomyData.CoolDownRoulette - (new Date().getTime() - userEconomyData.lastTimePlayedRoulette)

            let timeLeftBeforePlayAgain;

            if (timeLeft > 0) {

                console.log("time left", timeConversion(timeLeft))
                timeLeftBeforePlayAgain = timeConversion(timeLeft)

                const embedDenyPlay = new MessageEmbed()
                    .setColor('#FF0000')
                    .setAuthor("Ah ! Mince...")
                    .setDescription(`<@${interaction.user.id}>, Vous êtes déjà jouer a ce jeu ! 
            Revenez dans **${timeLeftBeforePlayAgain}** pour rejouer`)

                return interaction.reply({ embeds: [embedDenyPlay] })
            }
            console.log("start data ", usersEconomyList);


            const nbAmmo = Math.floor(Math.random() * 4) + 1;

            const currentPlace = Math.floor(Math.random() * 5) + 1;


            userEconomyData.lastTimePlayedRoulette = new Date().getTime();

            const embedPlay = new MessageEmbed()
                .setColor('#0099ff')
                .setAuthor("La roulette")
                .setDescription(`**${interaction.user.username}** mise **${userBet}** 💶! Voici votre arme 🔫. Elle est chargé avec **${nbAmmo}** balles sur **6**.
                Bonne chance...`)

            interaction.reply({ embeds: [embedPlay] });

            await wait(3000);
            await interaction.channel.send({ content: `🔫 **${interaction.user.username}** fait tourner le chargeur de l'arme  et...` });
            await wait(2500);

            if (nbAmmo < currentPlace) {
                await interaction.channel.send({ content: `🔫 💥 BANG ! 💥` });
                await wait(1500);
                const embedLoose = new MessageEmbed()
                    .setColor('#FF0000')
                    .setAuthor("La roulette")
                    .setDescription(`Ce jeu a mal tourné... Vous perdez votre mise de ${userBet} 💶`)

                userEconomyData.wallet -= userBet;

                interaction.channel.send({ embeds: [embedLoose] });
            }
            else {
                await interaction.channel.send({ content: `🔫 ✨ CLICK ! ✨` });
                await wait(1500);
                const embedWin = new MessageEmbed()
                    .setColor('#0099ff')
                    .setAuthor("La roulette")
                    .setDescription(`Pas de désastre cette fois ! Vous gagnez vos ${userBet} 💶. Bravo !`)

                userEconomyData.wallet += userBet;
                interaction.channel.send({ embeds: [embedWin] });
            }

            console.log("updated", userEconomyData);

            usersEconomyList.forEach(element => {
                if (element.userID === interaction.user.id) {
                    element = userEconomyData;
                }
            })

            await economyModel.findOneAndUpdate({ serverID: interaction.guild.id },
                {
                    usersList: usersEconomyList
                }
            );

        }
    },
};