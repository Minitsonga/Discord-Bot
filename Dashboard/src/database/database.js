const mongoose = require('mongoose');

module.exports = mongoose.connect(process.env.MONGODB_TOKEN, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
});