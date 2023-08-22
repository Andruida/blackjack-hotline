const config = require("./config.json")
if (!config.vonage || 
    !config.vonage.applicationId) {
    console.log("config.vonage",                new Boolean(config.vonage))
    console.log("config.vonage.applicationId",  new Boolean(config.vonage.applicationId))
    console.error("Config fields are missing")
    process.exit(1)
}

config.port = config.port || 3000

const express = require('express')
const path = require('path')
const vonage = require("./managers/vonage-manager")
const mongoose = require("./managers/mongo-manager")

// Array.prototype.choose = function() { this[Math.floor(Math.random() * this.length)]};

const app = express()
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(require("morgan")("tiny"))


app.use("/events", require("./routers/events"))
app.use(express.static(path.join(__dirname, "public")))
app.use("/audio", express.static(path.join(__dirname, "audio")))

app.listen(config.port, () => {
    // console.log(`Example app listening at http://localhost:${config.port}`)
})