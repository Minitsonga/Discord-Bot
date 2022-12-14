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

        if (!serverData) returnrinteraction.reply({ content: "Oups d??sol?? j'ai fait une erreur ! \nPeux-tu recommencer", ephemeral: true });



        const channelData = await channelsPluginsModel.findOne({ serverID: interaction.guild.id })

        let channel;
        if (channelData && channelData.defaultChannelID) channel = interaction.guild.channels.cache.get(channelData.defaultChannelID);

        if (channel && interaction.channel.id !== channel.id) return interaction.reply({ content: `Tu ne peux pas utiliser cette commande ici! Ressaye dans le salon <#${channelData.defaultChannelID}> `, ephemeral: true });


        let title;
        let description;

        switch (pluginName) {
            case 'birthday':
                title = `Toutes les informations ?? savoir sur la gestion des anniversaire et l'utilisation des commandes`;
                description = `Gr??ce ?? plugin, il vous suffit de vous enregistrer en inscrivant votre date de naissance.
                Lorsque le jour de votre anniversaire arriverra, **${client.user.username}** enverra une annonce vous souhaitant un bon et joyeux anniversaire.
                
    
                **Les Commandes**

                - **\` /birthday register [jour] [mois] [ann??e] : \`**  
                Enregistrez votre date sous le format suivant :  
                - jour -> entre 1 et 31
                - mois -> entre 1 et 12
                - ann??e -> ann??e sup??rieur ?? 1960

                - **\` /birthday preview : \`** 
                Affichez votre date de naissance, si vous ??tes enregistr??.

                - **\` /birthday modify [jour] [mois] [ann??e] : \`** 
                Modifiez votre date de naissance de la m??me fa??on que l'enregistrement.
            
                - **\` /birthday delete : \`** 
                Supprimez votre date de naissance.
                    
                    `;
                break;

            case 'moderator':
                title = `Toutes les informations ?? savoir sur l'utilisation des commandes de mod??ration`;
                description = `Tous les administrateurs du serveur auront acc??s aux commandes de mod??ration.
    
                **Les Commandes**

                    - **\` /clear (facultatif number) : \`**  
                    Supprimez 100 messages dans un salon si (number) n'est pas d??fini. 
                    Si (number) est definit, il indiquera le nombre de messages ?? supprimer.
                    **Tous les messages supprim??s doivent avoir moins de 14 jours **
                
                    
                    `;
                break;


            case 'leveling':
                title = `Toutes les informations ?? savoir sur le syst??me de niveaux et ranks et l'utilisation des commandes`;
                description = ``;
                break;

            case 'tempChannels':
                title = `Toutes les informations ?? savoir sur les salons temporaires et l'utilisation des commandes`;
                description = `Les salons temporaires sont cr????s automatiquement lorsqu'un utilisateur se connecte au salon cr??ateur.
                Cet utilisateur re??oit alors toutes les permissions par rapport a ce salon.Il peut modifier le nom, le rendre priv??, d??connecter des utilisateurs ou encore limiter l'acc??s a son vocal.
                Une fois que plus aucun utilisateur est connect?? au salon, ce dernier se supprimera automatiquement.
                
                **Toutes le commandes sont accessible seulement quand vous ??tes connect?? ?? un salon temporaire.**
                
                
                **Les Commandes**

                    - **\` voice rename : \`**  
                    Renomez le nom du vocal.

                    - **\` voice lock : \`** 
                    Bloquez l'acc??s ?? tous les utilisateurs.

                    - **\` voice unlock : \`** 
                    D??bloquez l'acc??s ?? tous les utilisateurs.
                
                    - **\` voice user-limit : \`** 
                    Limitez le nombre d'utilisateurs pouvant se connecter au salon. Si la valeur est de **0**, l'acc??s est ilimit??. La valeur maximal est de 99.
                    
                    -**\` voice owner : \`**
                    Affichez le propri??taire du vocal dans lequel vous ??tes connect??.
                   
                    - **\` voice kick : \`** 
                    Expulsez un utilisateur de votre vocal.
                    
                
                **ATTENTION** Les utilisateurs aillant les permissions administrateurs ont les m??mes permissions que le propri??taire de salon.`

                    ;
                break;

            case 'economy':
                title = `Toutes les informations ?? savoir sur l'??conomie du serveur et l'utilisation des commandes`;
                description = `Gr??ce a l'economie du serveur, tous les membres aillants les permissions d'acc??der aux commandes, pourront :
                 - Commencer un travail moyennant salaire qu'ils pourront r??cup??rer ou cumuler.
                 - Avoir acc??s ?? leurs compte pour voir leurs ???? totaux.
                 - Afficher le top des plus riches du serveur.
                 - Miser leurs ???? sur des jeux. Attention a ne pas tous perdre ;) 
                 
                 De plus un shop sera accesible o?? vous pourrez acheter des items (roles ou objets)


                 **Les Commandes**

                 - **\` eco - shop : \`**  
                 Renomez le nom du vocal.

                 - **\` eco lock : \`** 
                 Bloquez l'acc??s ?? tous les utilisateurs.

                 - **\` eco unlock : \`** 
                 D??bloquez l'acc??s ?? tous les utilisateurs.
             
                 - **\` eco user-limit : \`** 
                 Limitez le nombre d'utilisateurs pouvant se connecter au salon. Si la valeur est de **0**, l'acc??s est ilimit??. La valeur maximal est de 99.
                 
                 -**\` eco owner : \`**
                 Affichez le propri??taire du vocal dans lequel vous ??tes connect??.
                
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