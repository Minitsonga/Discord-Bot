const passport = require('passport');
const router = require('express').Router();

router.get('/discord', passport.authenticate('discord'));

router.get('/discord/redirect', passport.authenticate('discord', {
    successRedirect: '/dashboard',
    failureRedirect: '/error',
    //session: false
}));





module.exports = router;