const config = require('../config')

module.exports = {
    text(text, bargeIn = true, language = "hu-HU", loop = 1) {
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
                "text": hasGame ? "Köszöntjük újra a telefonos Bleckdzseck világában!" 
                        : "Üdvözöljük a telefonos Bleckdzseck világában!",
                "language": "hu-HU",
                "bargeIn": true,
            })
        }

        response.push({
            "action": "talk",
            "text": (hasGame ?
                "<speak>Önnek már van egy nyitott asztala. " +
                "Ha azt szeretné folytatni, nyomja meg a nullás gombot."
                : "<speak>")
                + "Új játék kezdéséhez nyomja meg az egyes gombot, vagy" +
                "a szabályok meghallgatásához nyomja meg a kettes gombot.<break time='3s'/></speak>",
            "language": "hu-HU",
            "loop": 0,
            "bargeIn": true
        })
        response.push({
            "action": "input",
            "eventUrl": ["https://" + config.vonage.host + "/events/input/newGame"],
            "type": ["dtmf"],
            "dtmf": {
                "maxDigits": 1,
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
                "text": "<speak>Önnek "+balance+" kreditje van még. Kérem "+
                        "gépelje be a tét összegét majd nyomja meg a kettőskeresztet.<break time='3s'/></speak>",
                "language": "hu-HU",
                "bargeIn": true,
                "loop": 0
            },
            {
                "action": "input",
                "eventUrl": ["https://" + config.vonage.host + "/events/input/placeBet"],
                "type": ["dtmf"],
                "dtmf": {
                    "maxDigits": 6,
                    "submitOnHash": true,
                }
            }
        ]
    },

    playing(game) {
        let usersCards = "<emphasis>"+game.playersHand.map(card => card.toString()).join(", ")+"</emphasis>"
        return [
            {
                "action": "talk",
                "text": "<speak>Az Ön lapjai: "+usersCards+", értékük így "+
                        game.getPlayersHandValue()+" . Az osztó nyitott lapja "+game.dealersHand[0].toString()+
                        ", értéke így "+game.getDealersHandValue()+" . Ha szeretne húzni nyomja meg az egyes gombot,"+
                        "ha megállna, nyomja meg a "+
                        "nullás gombot! <break time='3s'/></speak>",
                "loop": 0,
                "bargeIn": true,
                "language": "hu-HU",
            },
            {
                "action": "input",
                "eventUrl": ["https://" + config.vonage.host + "/events/input/play"],
                "type": ["dtmf"],
                "dtmf": {
                    "maxDigits": 1,
                }
            }
        ]
    },

    hit(game) {
        let newCard = game.playersHand[game.playersHand.length-1].toString()
        return [
            {
                "action": "talk",
                "text": "<speak>Az új kártyája "+newCard+", ezzel az Ön kártyáinak értéke "+game.getPlayersHandValue()+" .</speak>",
                "language": "hu-HU",
                "bargeIn": true,
            }
        ]
    },

    stand(game) {
        let dealersCards = "<emphasis>"+game.dealersHand.map(card => card.toString()).join(", ")+"</emphasis>"
        let usersCards = "<emphasis>"+game.playersHand.map(card => card.toString()).join(", ")+"</emphasis>"

        return [
            {
                "action": "talk",
                "text": "<speak>Az Ön lapjai: "+usersCards+", értékük így "+
                        game.getPlayersHandValue()+" . Az osztó lapjai: "+dealersCards+", értékük így "+
                        game.getDealersHandValue()+" .</speak>",
                "language": "hu-HU",
                "bargeIn": true,
            }
        ]

    },

    bust(game) {
        let playersCards = "<emphasis>"+game.playersHand.map(card => card.toString()).join(", ")+"</emphasis>"
        return [
            {
                "action": "talk",
                "text": "<speak>Az Ön lapjai: "+playersCards+", értékük így "+
                        game.getPlayersHandValue()+" . Sajnos túllépte a 21-et, így vesztett.</speak>",
                "language": "hu-HU",
                "bargeIn": true,
            }
        ]
    },
                

    dealingABlackjack(game) {
        let dealersCards = "<emphasis>"+game.dealersHand.map(card => card.toString()).join(", ")+"</emphasis>";
        let usersCards = "<emphasis>"+game.playersHand.map(card => card.toString()).join(", ")+"</emphasis>";

        return [
            {
                "action": "talk",
                "text": "<speak>Az Ön lapjai: "+usersCards+", értékük így "+
                        game.getPlayersHandValue()+" . Az osztó lapjai: "+dealersCards+", értékük így "+
                        game.getDealersHandValue()+" . Gratulálunk Blekdzsekje van!</speak>",
                "language": "hu-HU",
                "bargeIn": true,
            }
        ]
    },

    resolving(game, winnings) {
        if (game.balance > 0) {
            return [
                {
                    "action": "talk",
                    "text": "<speak>Ön "+winnings+" kreditet nyert, így az egyenlege "+game.balance+" kredit. A játék véget ért. Ha szeretne új játékot kezdeni, gépelje be az új tét összegét, majd nyomjon kettőskeresztet.</speak>",
                    "language": "hu-HU",
                    "bargeIn": true,
                    "loop": 0
                },
                {
                    "action": "input",
                    "eventUrl": ["https://" + config.vonage.host + "/events/input/placeBet"],
                    "type": ["dtmf"],
                    "dtmf": {
                        "maxDigits": 6,
                        "submitOnHash": true,
                    }
                }
            ]
        } else {
            return [
                {
                    "action": "talk",
                    "text": "<speak>Ön "+winnings+" kreditet nyert, így az egyenlege "+game.balance+" kredit. A játék véget ért. Sajnos kifogyott a kreditből, így ez az asztal lezárult.</speak>",
                    "language": "hu-HU",
                    "bargeIn": true,
                }
            ]
        }
    },

}