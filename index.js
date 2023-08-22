const config = require("./config.json")
if (!config.vonage || 
    !config.vonage.applicationId) {
    console.log("config.vonage",                new Boolean(config.vonage))
    console.log("config.vonage.applicationId",  new Boolean(config.vonage.applicationId))
    console.error("Config fields are missing")
    process.exit(1)
}

config.port = config.port || 3000

const Vonage = require('@vonage/server-sdk')
const express = require('express')
const path = require('path')

// Array.prototype.choose = function() { this[Math.floor(Math.random() * this.length)]};

const app = express()
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(require("morgan")("tiny"))


const vonage = new Vonage({
    applicationId: config.vonage.applicationId,
    privateKey: __dirname + "/private.key"
})

app.use("/events", require("./routers/events")(vonage))
app.use(express.static(path.join(__dirname, "public")))
app.use("/audio", express.static(path.join(__dirname, "audio")))

app.listen(config.port, () => {
    // console.log(`Example app listening at http://localhost:${config.port}`)
})