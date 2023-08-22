const mongoose = require('mongoose');
const config = require("../config.json")

mongoose.connect(config.mongoUrl).catch((err) => console.error(err)).then(() => console.log("Connected to MongoDB"));

module.exports = mongoose;
