const router = require('express').Router();

router.get('/', (req, res) => {
    res.render('guildDashboard/invite')
});


module.exports = router;