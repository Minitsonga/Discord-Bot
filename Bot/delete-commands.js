const fs = require('fs');
require("dotenv").config();
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

const { Client, Intents, Collection } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES] });


const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	//commands.push(command.data.toJSON());

}

const rest = new REST({ version: '9' }).setToken(process.env.token);

module.exports = async function ad(guild_ID) {
	try {

		await rest.put(
			Routes.applicationGuildCommands(process.env.clientId, guild_ID),
			{ body: commands },
		);

		console.log('Successfully registered application commands.');
		

	} catch (error) {
		console.error(error);

	}


};


