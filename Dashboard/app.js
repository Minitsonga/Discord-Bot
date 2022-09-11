require('dotenv').config();
require('./src/strategies/discord');

const express = require('express');
const passport = require('passport');
const session = require('express-session');

const db = require('./src/database/database');

const app = express()
const PORT = process.env.PORT;


const routes = require('./src/routes/index');

const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.GUILD_MESSAGES] });


client.login(process.env.DISCORD_BOT_TOKEN);



db.then(() => console.log("Connected to MongoDB")).catch(err => console.log(err));


app.use(express.json());
app.use(express.urlencoded({ extended: false}));


app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(session({
    secret: 'secret',
    cookie: {
        maxAge: 60000 * 60 * 24
    },
    resave: false,
    saveUninitialized: false
}));



app.use(passport.initialize());
app.use(passport.session());

app.use('', routes);

app.get("/", (req, res) => {
    res.render('menu/mainMenu', { user: req.user });
});

app.get('/error', (req, res) => {
  res.send("Erreur de la redirection")
});


app.listen(PORT, () => console.log(`Example app listening at http://localhost:${PORT}/`));
