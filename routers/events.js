
const config = require("../config.json")
const vonage = require("../managers/vonage-manager")
const Blackjack = require("../classes/blackjack")
const express = require('express')
const router = express.Router()

const NCCO = require("../ncco/generator")

const path = require("path")
const https = require("https");
const fs = require("fs");
const dformat = require('date-format');

router.post("/answer", async (req, res) => {
    console.log(req.body)
    let hasGame = await Blackjack.exists(req.body.from);
    res.json(NCCO.intro(hasGame, true))
})

router.post("/input/newGame", async (req, res) => {
    // console.log(req.body)
    let hasGame = await Blackjack.exists(req.body.from);

    var digit = -1;
    if (req.body.dtmf && req.body.dtmf.digits && req.body.dtmf.digits.length == 1) {
        digit = req.body.dtmf.digits[0];
    } else if (req.body.speech && req.body.speech.results && req.body.speech.results.length > 0) {
        for (let result of req.body.speech.results) {
            if (result.confidence <= 0.5) {
                continue
            }
            if (result.text.startsWith("folytat")) {
                digit = "0"
                break
            } else if (result.text == "új játék" || result.text == "úgy játék") {
                digit = "1"
                break
            } else if (result.text.startsWith("szabály")) {
                digit = "2"
                break
            }
        }
    }

    var response = []

    switch (digit) {
        case "0":
            if (hasGame) {
                response.push(NCCO.text("Folytatjuk a játékot."))
            } else {
                response.push(NCCO.text("Sajnos nincs nyitott asztala."))
                response.push(...NCCO.intro(hasGame, false))
            }
            break
        case "1":
            let game = new Blackjack(req.body.from, 2, 1000)
            response.push(...NCCO.newGame(game.numberOfDecks))
            response.push(...NCCO.betPrompt(game.balance))
            await game.save()
            break
        case "2":
            response.push(NCCO.text("A játék szabályait még nem írtam össze, bocsi."))
            response.push(...NCCO.intro(hasGame, false))
            break
        default:
            response.push(NCCO.text("Nem értettem, kérjük próbálja újra!"))
            response.push(...NCCO.intro(hasGame, false))
            break
    }

    res.json(response)
})

router.post("/input/placeBet", async (req, res) => {
    // console.log(req.body)
    let game = await Blackjack.load(req.body.from);
    let response = [];
    if (game == null) {
        res.json(NCCO.intro(false, false))
        return
    }
    var didRecognize = false;
    var success = false;
    var triedNumber = 0;
    if (req.body.dtmf && req.body.dtmf.digits && req.body.dtmf.digits.length > 0 && parseInt(req.body.dtmf.digits)) {
        didRecognize = true;
        triedNumber = parseInt(req.body.dtmf.digits)
        success = game.placeBet(triedNumber)
    } else if (req.body.speech && req.body.speech.results && req.body.speech.results.length > 0) {
        if (req.body.speech.results[0].confidence > 0.5 && parseInt(req.body.speech.results[0].text)) {
            didRecognize = true;
            triedNumber = parseInt(req.body.speech.results[0].text)
            success = game.placeBet(triedNumber)
        }
    }
    await game.save()

    if (!didRecognize) {
        response.push(NCCO.text("Nem értettem, kérjük próbálja újra!"))
        response.push(...NCCO.betPrompt(game.balance))
        res.json(response)
        return
    }
    if (!success) {
        response.push(NCCO.text("Azt értettem, hogy "+triedNumber+" kredit tétet szeretne tenni, de ez sajnos nem lehetséges."))
        response.push(...NCCO.betPrompt(game.balance))
        res.json(response)
        return
    }
    response.push(...NCCO.finalizeBet(game.betToBePlaced))
    res.json(response)
})

router.post("/input/finalizeBet", async (req, res) => {
    let game = await Blackjack.load(req.body.from);
    let response = [];
    if (game == null) {
        res.json(NCCO.intro(false, false))
        return
    }
    var digit = -1;
    if (req.body.dtmf && req.body.dtmf.digits && req.body.dtmf.digits.length == 1) {
        digit = req.body.dtmf.digits[0];
    } else if (req.body.speech && req.body.speech.results && req.body.speech.results.length > 0) {
        for (let result of req.body.speech.results) {
            if (result.confidence <= 0.5) {
                continue
            }
            if (result.text == "igen") {
                digit = "1"
            } else if (result.text == "nem") {
                digit = "0"
            }
        }
    }

    switch (digit) {
        case "0":
            response.push(NCCO.text("A tétet nem fogadta el."))
            response.push(...NCCO.betPrompt(game.balance))
            break
        case "1":
            game.finalizeBet()
            game.deal()
            await game.save()
            // response.push(...NCCO.deal(game))
            response.push(NCCO.text("A "+game.bet+" kredit tétet megtette."))
            response.push(...NCCO.playing(game))
            break
        default:
            response.push(NCCO.text("Nem értettem, kérjük próbálja újra!"))
            response.push(...NCCO.finalizeBet(game.betToBePlaced))
            break
    }

    res.json(response)

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

router.post("/*", (req, res) => {
    // console.log(req.body)
    if (req.body.status === "completed") {
        const logFile = path.join(__dirname, "../log.txt")
        fs.appendFileSync(logFile, req.body.start_time + " " + req.body.from + " " + req.body.duration + "\n")
    }
    res.sendStatus(200)
})

module.exports = router