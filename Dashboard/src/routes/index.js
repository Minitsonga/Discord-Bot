const router = require('express').Router();
const auth = require('./auth');
const dashboard = require('./dashboard');
const invite = require('./invite');
const profile = require('./profile');

router.use('/auth', auth);
router.use('/dashboard', dashboard)
router.use('/invite', invite)
router.use('/profile', profile)

module.exports = router;