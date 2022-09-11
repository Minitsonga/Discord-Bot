const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const UserPref = require('../database/schemas/UserPreferences');

passport.serializeUser((user, done) => {
    console.log("here",user.discordId);
    done(null, user.discordId);
});
passport.deserializeUser(async (discordId, done) => {
    try {

        const user = await UserPref.findOne({ discordId: discordId });
        return user ? done(null, user) : done(null, null);

    } catch (err) {
        console.log(err);
        done(err, null);
    }
});

passport.use(
    new DiscordStrategy({
        clientID: process.env.DASHBOARD_CLIENT_ID,
        clientSecret: process.env.DASHBOARD_CLIENT_SECRET,
        callbackURL: process.env.DASHBOARD_CALLBACK_URL,
        scope: ['identify', 'guilds'],
    }, async (accessToken, refreshToken, profile, done) => {
        const { id, username, discriminator, avatar, guilds } = profile;
        // console.log(id, username, discriminator, avatar, guilds);
        try {
            const findUser = await UserPref.findOneAndUpdate(
                { discordId: id },
                {
                    discordTag: `${username}#${discriminator}`,
                    username,
                    avatar,
                    guilds,
                },

            );

            if (findUser) {
                console.log("User was found");
                done(null, findUser);
                
            }
            else {
                console.log("User was not found");
                const newUser = await UserPref.create({
                    discordId: id,
                    discordTag: `${username}#${discriminator}`,
                    username,
                    avatar,
                    guilds,
                });
                return done(null, newUser);
            }
        } catch (err) {
            console.log(err);
            return done(err, null);
        }
    })
);
