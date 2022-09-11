const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const fs = require('fs');


module.exports = {

    data:
        new SlashCommandBuilder()
            .setName('help')
            .setDescription("Toutes les informations sur le fonctionnement des commandes")
            .addStringOption(option =>
                option.setName('plugin-name')
                    .setDescription("Indique le nom du service")
                    .setRequired(false)),


    category: "global",


    async execute(interaction, client) {


        const channelsPluginsModel = require("../models/channelsPluginsSchema");
        const serverStatsModel = require("../models/serverStatsSchema");

        const pluginsModel = require("../models/pluginsSelectedSchema");


        const plugins = await pluginsModel.findOne({ serverID: interaction.guild.id })



        const commandFiles = fs.readdirSync(__dirname).filter(file => file.endsWith('.js'));

        const embedFields = [];

        for (const file of commandFiles) {
            const cmd = require(__dirname + `/${file}`);

            switch (cmd.category) {
                case "birthday":
                    if (plugins[`${cmd.category}`]) {
                        embedFields.push({ name: 'Birthday', value: "/help `birthday`", inline: true })
                    }
                    break;
                case "moderator":
                    if (plugins[`${cmd.category}`]) {
                        embedFields.push({ name: 'Moderator', value: "/help `moderator`", inline: true })
                    }
                    break;
                case "leveling":
                    if (plugins[`${cmd.category}`]) {
                        embedFields.push({ name: 'Rank and Levels', value: "/help `leveling`", inline: true })
                    }
                    break;
                case "channelManager":
                    if (plugins[`${cmd.category}`]) {
                        embedFields.push({ name: 'Temporary Channels', value: "/help `tempChannels`", inline: true })
                    }
                    break;
                case "economy":
                    if (plugins[`${cmd.category}`]) {
                        embedFields.push({ name: 'Economy', value: "/help `economy`", inline: true })
                    }
                    break;

            }


        }
        const embedPluginDesactivate = new MessageEmbed()
            .setColor('#0099ff')
            .setThumbnail(`https://cdn.discordapp.com/app-icons/${client.user.id}/${client.user.avatar}.png`)
            .setAuthor(`${client.user.username}`, `https://cdn.discordapp.com/app-icons/${client.user.id}/${client.user.avatar}.png`)
            .addField("This plugin is not activated", " `/dashboard` to configure your server")


        if (embedFields.length <= 0) {
            embedFields.push({ name: "There is any plugin activated", value: " `/dashboard` to configure your server" });
        }
        const helpEmbed = new MessageEmbed()
            .setColor('#0099ff')
            .setThumbnail(`https://cdn.discordapp.com/app-icons/${client.user.id}/${client.user.avatar}.png`)
            .setAuthor(`${client.user.username}`, `https://cdn.discordapp.com/app-icons/${client.user.id}/${client.user.avatar}.png`)
            .addFields(embedFields)

        const pluginName = interaction.options.getString('plugin-name');

        if (!pluginName) return interaction.reply({ embeds: [helpEmbed] });

        if (!plugins[pluginName]) return interaction.reply({ embeds: [embedPluginDesactivate] });

        const serverData = await serverStatsModel.findOne({ serverID: interaction.guild.id })

        if (!serverData) returnrinteraction.reply({ content: "Oups désolé j'ai fait une erreur ! \nPeux-tu recommencer", ephemeral: true });



        const channelData = await channelsPluginsModel.findOne({ serverID: interaction.guild.id })

        let channel;
        if (channelData && channelData.defaultChannelID) channel = interaction.guild.channels.cache.get(channelData.defaultChannelID);

        if (channel && interaction.channel.id !== channel.id) return interaction.reply({ content: `Tu ne peux pas utiliser cette commande ici! Ressaye dans le salon <#${channelData.defaultChannelID}> `, ephemeral: true });


        let title;
        let description;

        switch (pluginName) {
            case 'birthday':
                title = `Toutes les informations à savoir sur la gestion des anniversaire et l'utilisation des commandes`;
                description = `Grâce à plugin, il vous suffit de vous enregistrer en inscrivant votre date de naissance.
                Lorsque le jour de votre anniversaire arriverra, **${client.user.username}** enverra une annonce vous souhaitant un bon et joyeux anniversaire.
                
    
                **Les Commandes**

                - **\` /birthday register [jour] [mois] [année] : \`**  
                Enregistrez votre date sous le format suivant :  
                - jour -> entre 1 et 31
                - mois -> entre 1 et 12
                - année -> année supérieur à 1960

                - **\` /birthday preview : \`** 
                Affichez votre date de naissance, si vous êtes enregistré.

                - **\` /birthday modify [jour] [mois] [année] : \`** 
                Modifiez votre date de naissance de la même façon que l'enregistrement.
            
                - **\` /birthday delete : \`** 
                Supprimez votre date de naissance.
                    
                    `;
                break;

            case 'moderator':
                title = `Toutes les informations à savoir sur l'utilisation des commandes de modération`;
                description = `Tous les administrateurs du serveur auront accès aux commandes de modération.
    
                **Les Commandes**

                    - **\` /clear (facultatif number) : \`**  
                    Supprimez 100 messages dans un salon si (number) n'est pas défini. 
                    Si (number) est definit, il indiquera le nombre de messages à supprimer.
                    **Tous les messages supprimés doivent avoir moins de 14 jours **
                
                    
                    `;
                break;


            case 'leveling':
                title = `Toutes les informations à savoir sur le système de niveaux et ranks et l'utilisation des commandes`;
                description = ``;
                break;

            case 'tempChannels':
                title = `Toutes les informations à savoir sur les salons temporaires et l'utilisation des commandes`;
                description = `Les salons temporaires sont créés automatiquement lorsqu'un utilisateur se connecte au salon créateur.
                Cet utilisateur reçoit alors toutes les permissions par rapport a ce salon.Il peut modifier le nom, le rendre privé, déconnecter des utilisateurs ou encore limiter l'accès a son vocal.
                Une fois que plus aucun utilisateur est connecté au salon, ce dernier se supprimera automatiquement.
                
                **Toutes le commandes sont accessible seulement quand vous êtes connecté à un salon temporaire.**
                
                
                **Les Commandes**

                    - **\` voice rename : \`**  
                    Renomez le nom du vocal.

                    - **\` voice lock : \`** 
                    Bloquez l'accès à tous les utilisateurs.

                    - **\` voice unlock : \`** 
                    Débloquez l'accès à tous les utilisateurs.
                
                    - **\` voice user-limit : \`** 
                    Limitez le nombre d'utilisateurs pouvant se connecter au salon. Si la valeur est de **0**, l'accès est ilimité. La valeur maximal est de 99.
                    
                    -**\` voice owner : \`**
                    Affichez le propriétaire du vocal dans lequel vous êtes connecté.
                   
                    - **\` voice kick : \`** 
                    Expulsez un utilisateur de votre vocal.
                    
                
                **ATTENTION** Les utilisateurs aillant les permissions administrateurs ont les mêmes permissions que le propriétaire de salon.`

                    ;
                break;

            case 'economy':
                title = `Toutes les informations à savoir sur l'économie du serveur et l'utilisation des commandes`;
                description = `Grâce a l'economie du serveur, tous les membres aillants les permissions d'accéder aux commandes, pourront :
                 - Commencer un travail moyennant salaire qu'ils pourront récupérer ou cumuler.
                 - Avoir accès à leurs compte pour voir leurs 💶 totaux.
                 - Afficher le top des plus riches du serveur.
                 - Miser leurs 💶 sur des jeux. Attention a ne pas tous perdre ;) 
                 
                 De plus un shop sera accesible où vous pourrez acheter des items (roles ou objets)


                 **Les Commandes**

                 - **\` eco - shop : \`**  
                 Renomez le nom du vocal.

                 - **\` eco lock : \`** 
                 Bloquez l'accès à tous les utilisateurs.

                 - **\` eco unlock : \`** 
                 Débloquez l'accès à tous les utilisateurs.
             
                 - **\` eco user-limit : \`** 
                 Limitez le nombre d'utilisateurs pouvant se connecter au salon. Si la valeur est de **0**, l'accès est ilimité. La valeur maximal est de 99.
                 
                 -**\` eco owner : \`**
                 Affichez le propriétaire du vocal dans lequel vous êtes connecté.
                
                 - **\` eco kick : \`** 
                 Expulsez un utilisateur de votre vocal.



                 `;
                break;


        }


        const embedInfo = new MessageEmbed()
            .setColor('#0099ff')
            .setThumbnail(`https://cdn.discordapp.com/app-icons/${client.user.id}/${client.user.avatar}.png`)
            .setAuthor(`${client.user.username}`, `https://cdn.discordapp.com/app-icons/${client.user.id}/${client.user.avatar}.png`)
            .setTitle(title)
            .setDescription(description)


        interaction.reply({ embeds: [embedInfo] });

    }
};