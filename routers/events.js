
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
    }

    var response = []

    switch (digit) {
        case "0":
            if (hasGame) {
                response.push(NCCO.text("Folytatjuk a játékot."))
                let game = await Blackjack.load(req.body.from);
                switch (game.roundPhase) {
                    case Blackjack.RoundPhases.BETTING:
                        response.push(...NCCO.betPrompt(game.balance))
                        break
                    case Blackjack.RoundPhases.DEALING:
                        let hasBlackjack = game.deal()
                        if (hasBlackjack) {
                            response.push(...NCCO.dealingABlackjack(game))
                            let winnings = game.pay()
                            response.push(...NCCO.resolving(game, winnings))
                            if (game.balance <= 0) {
                                game = new Blackjack(req.body.from, 2, 1000)
                                response.push(...NCCO.newGame(game.numberOfDecks))
                                response.push(...NCCO.betPrompt(game.balance))
                                await game.save()
                            }
                        } else {
                            response.push(...NCCO.playing(game))
                        }
                        break;
                    case Blackjack.RoundPhases.PLAYING:
                        response.push(...NCCO.playing(game))
                        break
                    case Blackjack.RoundPhases.RESOLVING:
                        if (game.getPlayersHandValue() > 21) {
                            response.push(...NCCO.bust(game))
                        } else {
                            response.push(...NCCO.stand(game))
                        }
                        let winnings = game.pay()
                        response.push(...NCCO.resolving(game, winnings))
                        if (game.balance <= 0) {
                            game = new Blackjack(req.body.from, 2, 1000)
                            response.push(...NCCO.newGame(game.numberOfDecks))
                            response.push(...NCCO.betPrompt(game.balance))
                            await game.save()
                        }
                        break
                    }
                    await game.save()
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
    }

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


    let didShuffle = game.shuffleIfNeeded()
    game.finalizeBet()
    let hasBlackjack = game.deal()
    // response.push(...NCCO.deal(game))
    response.push(NCCO.text(game.bet+" kredit téttel játszik."))
    if (didShuffle) {
        response.push(NCCO.text("A paklit újrakevertem."))
    }
    if (hasBlackjack) {
        response.push(...NCCO.dealingABlackjack(game))
        let winnings = game.pay()
        response.push(...NCCO.resolving(game, winnings))
        if (game.balance <= 0) {
            game = new Blackjack(req.body.from, 2, 1000)
            response.push(...NCCO.newGame(game.numberOfDecks))
            response.push(...NCCO.betPrompt(game.balance))
            await game.save()
        }
    } else {
        response.push(...NCCO.playing(game))
    }
    await game.save()
    res.json(response)
})

router.post("/input/play", async (req, res) => {
    let game = await Blackjack.load(req.body.from);
    let response = [];
    if (game == null) {
        res.json(NCCO.intro(false, false))
        return
    }
    var digit = -1;
    if (req.body.dtmf && req.body.dtmf.digits && req.body.dtmf.digits.length == 1) {
        digit = req.body.dtmf.digits[0];
    }

    switch (digit) {
        case "0":
            game.stand()
            response.push(...NCCO.stand(game))
            let winnings = game.pay()
            await game.save()
            response.push(...NCCO.resolving(game, winnings))
            if (game.balance <= 0) {
                game = new Blackjack(req.body.from, 2, 1000)
                response.push(...NCCO.newGame(game.numberOfDecks))
                response.push(...NCCO.betPrompt(game.balance))
                await game.save()
            }
            break;
        case "1":
            let canHit = game.hit()
            response.push(...NCCO.hit(game)) 
            if (canHit) {
                response.push(...NCCO.playing(game))
            } else {
                if (game.getPlayersHandValue() > 21) {
                    response.push(...NCCO.bust(game))
                } else {
                    response.push(...NCCO.stand(game))
                }
                let winnings = game.pay()
                response.push(...NCCO.resolving(game, winnings))
                if (game.balance <= 0) {
                    game = new Blackjack(req.body.from, 2, 1000)
                    response.push(...NCCO.newGame(game.numberOfDecks))
                    response.push(...NCCO.betPrompt(game.balance))
                    await game.save()
                }
                
            }
            await game.save()
            break;
        default:
            response.push(NCCO.text("Nem értettem, kérem próbálja újra!"))
            response.push(...NCCO.playing(game))
            break;
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