const Vonage = require('@vonage/server-sdk')
const config = require("../config.json")

const vonage = new Vonage({
    applicationId: config.vonage.applicationId,
    privateKey: __dirname + "/../private.key"
})

module.exports = vonage