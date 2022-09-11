const router = require('express').Router();
const User = require("../database/schemas/UserPreferences");

router.get('/', async (req, res) => {
    if (req.user) {

        const userData = await User.findOne({discordId: req.user.discordId});

        let userCardColor = userData.levelingCardColor;

        res.render('profile/userProfile', { user: req.user, userCardColor })
    }
    else {
        res.redirect('/auth/discord/redirect');
    }

});

router.post('/', async (req, res) => {
    if (req.user) {

        let userCardColor = req.body.userColor;
        await User.findOneAndUpdate({ discordId: req.user.discordId }, { levelingCardColor: userCardColor });
        res.send('Updated');
    }
    else {
        res.redirect('/auth/discord/redirect');
    }

});

module.exports = router;