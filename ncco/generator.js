const config = require('../config')

module.exports = {
    text(text, language = "hu-HU", loop = 1, bargeIn = false) {
        return {
            "action": "talk",
            "text": text,
            "language": language,
            "loop": loop,
            "bargeIn": bargeIn
        }
    },

    intro(hasGame, welcome = true) {
        var response = []

        if (welcome) {
            response.push({
                "action": "talk",
                "text": hasGame ? "Köszöntjük újra a telefonos Bleckdzseck világában!" : "Üdvözöljük a telefonos Bleckdzseck világában!",
                "language": "hu-HU",
            })
        }

        response.push({
            "action": "talk",
            "text": (hasGame ?
                "<speak>Önnek már van egy nyitott asztala. " +
                "Ha azt szeretné folytatni, nyomja meg a nullás gombot, vagy mondja hogy folytatás."
                : "<speak>")
                + "Új játék kezdéséhez nyomja meg az egyes gombot, vagy mondja, hogy új játék." +
                "A szabályok meghallgatásához nyomja meg a kettes gombot, vagy mondja, hogy szabályok.<break time='3s'/></speak>",
            "language": "hu-HU",
            "loop": 0,
            "bargeIn": true
        })
        response.push({
            "action": "input",
            "eventUrl": ["https://" + config.vonage.host + "/events/input/newGame"],
            "type": ["dtmf", "speech"],
            "dtmf": {
                "maxDigits": 1,
            },
            "speech": {
                "language": "hu-HU",
                "context": ["folytatás", "új játék", "szabályok"],
            }
        })
        return response
    },

    newGame(numberOfDecks) {
        return [{
                "action": "talk",
                "text": "Új játékot kezdünk. A játékhoz "+numberOfDecks+" paklit keverek össze.",
                "language": "hu-HU",
                "bargeIn": true,
            }]
    },

    betPrompt(balance) {
        return [
            {
                "action": "talk",
                "text": "<speak>Önnek "+balance+" kreditje van még. Kérem mondja, vagy gépelje be a tét összegét.<break time='3s'/></speak>",
                "language": "hu-HU",
                "bargeIn": true,
                "loop": 0
            },
            {
                "action": "input",
                "eventUrl": ["https://" + config.vonage.host + "/events/input/placeBet"],
                "type": ["dtmf", "speech"],
                "dtmf": {
                    "maxDigits": 6,
                    "submitOnHash": true,
                },
                "speech": {
                    "language": "hu-HU",
                }
            }
        ]
    },

    finalizeBet(bet) {
        return [
            {
                "action": "talk",
                "text": "<speak>Úgy értettem, hogy "+bet+" kreditet szeretne feltenni. Igen vagy nem válasszal erősítse meg a tétet. A billentyűzeten az egyes a beleegyezés és nullás az elutasítás.<break time='3s'/></speak>",
                "language": "hu-HU",
                "bargeIn": true,
                "loop": 0
            },
            {
                "action": "input",
                "eventUrl": ["https://" + config.vonage.host + "/events/input/finalizeBet"],
                "type": ["dtmf", "speech"],
                "dtmf": {
                    "maxDigits": 1,
                },
                "speech": {
                    "language": "hu-HU",
                    "context": ["igen", "nem"],
                }
            }
        ]
    },

    playing(game) {
        return [
            {
                "action": "talk",
                "text": "A játék megkezdődött.",
                "language": "hu-HU",
            }
        ]
    }


}