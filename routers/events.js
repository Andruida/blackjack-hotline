module.exports = function(vonage) {
    const config = require("../config.json")
    const express = require('express')
    const router = express.Router()

    const path = require("path")
    const https = require("https");
    const fs = require("fs");
    const dformat = require('date-format');

    router.post("/answer", (req, res) => {
        console.log(req.body)
        res.json([
            {
                "action": "talk",
                "text": "Teszt üzemmód. Kérjük nyomjon meg egy gombot, vagy mondjon egy egyjegyű számot.",
                "language": "hu-HU",
                "loop": 0,
                "bargeIn": true
            },
            {
                "action": "input",
                "eventUrl": ["https://" + config.vonage.host + "/events/input"],
                "type": ["dtmf", "speech"],
                "dtmf": {
                    "maxDigits": 1,
                },
                "speech": {
                    "language": "hu-HU",
                    "context": ["egy", "kettő", "három", "négy", "öt", "hat", "hét", "nyolc", "kilenc", "nulla"],
                }
            }
        ])
    })

    router.post("/recording", (req, res) => {
        const filename = dformat.asString('yy.MM.dd_hh:mm:ss', new Date());
        vonage.files.save(req.body.recording_url, path.join(__dirname, "../audio/recordings/", filename+".mp3"), (err, res) => {
            if(err) { console.error(err); }
            else {
                console.log(res);
            }
          })
        res.send()
        console.log("Recording saved")
    })

    router.post("/input", (req, res) => {
        console.log(req.body)
        if (!req.body.dtmf || !req.body.dtmf.digits) {
            return res.json([
                {
                    "action": "talk",
                    "text": "Remek, most mindenképp egy gombot nyomjon meg!",
                    "loop": 0,
                    "bargeIn": true,
                    "language": "hu-HU",
                },
                {
                    "action": "input",
                    "eventUrl": ["https://" + config.vonage.host + "/events/input"],
                    "type": ["dtmf"],
                    "dtmf": {
                        "maxDigits": 1,
                    }
                }
            ])
        }
        res.json([
            {
                "action": "talk",
                "language": "hu-HU",
                "text": "Juhú"
            }
        ])
    })

    router.post("/*", (req, res) => {
        console.log(req.body)
        if (req.body.status === "completed") {
            const logFile = path.join(__dirname, "../log.txt")
            fs.appendFileSync(logFile, req.body.start_time + " " + req.body.from + " " + req.body.duration + "\n")
        }
        res.sendStatus(200)
    })

    return router
}