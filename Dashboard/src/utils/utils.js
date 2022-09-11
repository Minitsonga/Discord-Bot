function getMutualGuilds(userGuilds, botGuilds) {
    const validGuilds = userGuilds.filter((guild) => (guild.permissions & 0x20) === 0x20); // take only the MANAGE_GUILD permissions
    const included = [];
    const excluded = validGuilds.filter((guild) => {
        try {


            const findGuild = botGuilds.find((g) => g.id === guild.id); //check if there is same guild in validGuild and botguilds 

            if (!findGuild) return guild; //put the guilds from user into excluded (The bot is not included in)
            included.push(findGuild);
        } catch (error) {
            console.log(error)
        }
    });
    return { included, excluded };
}

module.exports = { getMutualGuilds };