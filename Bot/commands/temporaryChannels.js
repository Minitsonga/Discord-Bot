const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('voice')
        .setDescription("Gestion des salons temporaires")
        .addSubcommand(subcommand =>
            subcommand.setName('rename')
                .setDescription("Renome le salon")
                .addStringOption(option =>
                    option.setName('new-name')
                        .setDescription('Nouveau nom du salon')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand.setName('lock')
                .setDescription("Bloque l'accès du salon aux membres du serveur"))
        .addSubcommand(subcommand =>
            subcommand.setName('unlock')
                .setDescription("Débloque l'accès du salon aux membres du serveur"))
        .addSubcommand(subcommand =>
            subcommand.setName('user-limit')
                .setDescription("Limite l'accès du salon")
                .addIntegerOption(option =>
                    option.setName('number')
                        .setDescription("Nombre maximum de membre, entre 1 et 99")
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand.setName('owner')
                .setDescription("Indique le propriétaire du salon"))
        .addSubcommand(subcommand =>
            subcommand.setName('kick')
                .setDescription("Expluse un membre dans le salon")
                .addUserOption(option =>
                    option.setName('member')
                        .setDescription("Membre a expulser")
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand.setName('help')
                .setDescription("Besoin d'aide ? Le fonctionnement complet des salons temporaires et des commandes vous sera détaillé")),

    category: "channelManager",

    async execute(interaction) {

    },
};