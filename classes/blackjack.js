const BlackjackModel = require('../models/blackjack.js');
const { Card, CardColor, CardValue, CardRealValue } = require('./card.js');


class Blackjack {

    static RoundPhases = Object.freeze({
        BETTING: Symbol('BETTING'),
        DEALING: Symbol('DEALING'),
        PLAYING: Symbol('PLAYING'),
        RESOLVING: Symbol('RESOLVING')
    })

    uuid = null;
    deck = []
    numberOfDecks = 0;
    balance = 0;
    dealersHand = [];
    dealersSecretCard = null;
    playersHand = [];
    bet = 0;
    betToBePlaced = 0;
    roundPhase = Blackjack.RoundPhases.BETTING;

    constructor(uuid, numberOfDecks, balance) {
        this.uuid = uuid;
        this.numberOfDecks = numberOfDecks;
        this.deck = Blackjack.createDeck(numberOfDecks);
        this.balance = balance;
    }

    static shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    static createDeck(numberOfDecks) {
        let deck = [];
        for (let i = 0; i < numberOfDecks; i++) {
            for (let color in CardColor) {
                for (let value in CardValue) {
                    deck.push(new Card(CardColor[color], CardValue[value]));
                }
            }
        }

        Blackjack.shuffle(deck);
        return deck;
    }

    static getHandValue(array) {
        let softValue = 0;
        array.forEach(card => {
            if (card.value == CardValue.ACE) {
                softValue += (softValue + 11 <= 21) ? 11 : 1;
            } else {
                softValue += CardRealValue[card.value];
            }
            
        })
        return softValue;
    }

    getDealersHandValue() {
        return Blackjack.getHandValue(this.dealersHand);
    }

    getPlayersHandValue() {
        return Blackjack.getHandValue(this.playersHand);
    }

    /**
     * Place a bet
     * @param {number} amount
     * @returns {bool} wether the bet was successful or not
     * @throws {Error} if the round phase is not betting
     */
    placeBet(amount) {
        if (this.roundPhase != Blackjack.RoundPhases.BETTING) {
            throw new Error('Invalid round phase');
        }
        
        if (amount <= 0 || this.balance < amount) {
            return false;
        }

        this.betToBePlaced = amount;

        return true;
    }

    finalizeBet() {
        if (this.roundPhase != Blackjack.RoundPhases.BETTING) {
            throw new Error('Invalid round phase');
        }
        if (this.betToBePlaced <= 0 || this.balance < this.betToBePlaced) {
            return false;
        }
        this.bet = this.betToBePlaced;
        this.balance -= this.betToBePlaced;
        this.betToBePlaced = 0;
        this.roundPhase = Blackjack.RoundPhases.DEALING;
        return true;
    }

    /**
     * Deal cards to the player and the dealer
     * @returns {bool} wether the player has blackjack or not
     * @throws {Error} if the round phase is not dealing
     */
    deal() {
        if (this.roundPhase != Blackjack.RoundPhases.DEALING) {
            throw new Error('Invalid round phase');
        }
        this.playersHand.push(this.deck.pop());
        this.dealersSecretCard = this.deck.pop();
        this.playersHand.push(this.deck.pop());
        this.dealersHand.push(this.deck.pop());
        this.roundPhase = Blackjack.RoundPhases.PLAYING;
        if (this.getPlayersHandValue() == 21) {
            this.stand();
        }
        return this.getPlayersHandValue() == 21;
    }

    /**
     * Hit the deck
     * @returns {bool} true if the player can still hit
     * @throws {Error} if the round phase is not playing
     */
    hit() {
        if (this.roundPhase != Blackjack.RoundPhases.PLAYING) {
            throw new Error('Invalid round phase');
        }
        this.playersHand.push(this.deck.pop());
        if (this.getPlayersHandValue() >= 21) {
            this.stand();
        }
        return this.getPlayersHandValue() < 21;
    }

    /**
     * Stand
     * @throws {Error} if the round phase is not playing
     */
    stand() {
        if (this.roundPhase != Blackjack.RoundPhases.PLAYING) {
            throw new Error('Invalid round phase');
        }
        this.dealersHand.push(this.dealersSecretCard);
        this.dealersSecretCard = null;

        while (this.getDealersHandValue() < 17) {
            this.dealersHand.push(this.deck.pop());
        }
        this.roundPhase = Blackjack.RoundPhases.RESOLVING;
    }

    pay() {
        if (this.roundPhase != Blackjack.RoundPhases.RESOLVING) {
            throw new Error('Invalid round phase');
        }
        let winnings = 0;
        let player = this.getPlayersHandValue();
        let dealer = this.getDealersHandValue();
        if (player > 21) {
            winnings = 0;
        }
        else if (dealer > 21 || player > dealer) {
            winnings = this.bet * 2;
        }
        else if (player == dealer) {
            winnings = this.bet;
        }

        this.balance += winnings;
        this.bet = 0;
        this.dealersHand = [];
        this.dealersSecretCard = null;
        this.playersHand = [];
        this.roundPhase = Blackjack.RoundPhases.BETTING;

        return winnings;

    }

    shuffleIfNeeded() {
        let didShuffle = false;
        if (this.roundPhase == Blackjack.RoundPhases.BETTING || this.roundPhase == Blackjack.RoundPhases.RESOLVING
          && this.deck.length < this.numberOfDecks * 52 / 2) {
            didShuffle = true;
            this.deck = Blackjack.createDeck(this.numberOfDecks);
        }
        return didShuffle;
    }

    save() {
        return BlackjackModel.findOneAndUpdate(
            {uuid: this.uuid},
            {
                uuid: this.uuid,
                deck: this.deck,
                numberOfDecks: this.numberOfDecks,
                balance: this.balance,
                dealersHand: this.dealersHand,
                dealersSecretCard: this.dealersSecretCard,
                playersHand: this.playersHand,
                bet: this.bet,
                betToBePlaced: this.betToBePlaced,
                roundPhase: this.roundPhase
            },
            {upsert: true, new: true}
        );
    }

    static async load(uuid) {
        let gameState = await BlackjackModel.findOne({uuid: uuid}).exec();
        if (gameState == null) {
            return null;
        }
        let blackjack = new Blackjack(gameState.uuid, gameState.numberOfDecks, gameState.balance);

        blackjack.deck = gameState.deck.map(Card.fromDB);

        blackjack.dealersHand = gameState.dealersHand.map(Card.fromDB);
        blackjack.dealersSecretCard = Card.fromDB(gameState.dealersSecretCard);
        blackjack.playersHand = gameState.playersHand.map(Card.fromDB);
        blackjack.bet = gameState.bet;
        blackjack.betToBePlaced = gameState.betToBePlaced;
        blackjack.roundPhase = this.RoundPhases[gameState.roundPhase.match(/\((.*)\)/)[1]];
        return blackjack;
    }

    static delete(uuid) {
        return BlackjackModel.deleteMany({uuid: uuid}).exec();
    }

    delete() {
        return Blackjack.delete(this.uuid);
    }

    static async exists(uuid) {
        return await BlackjackModel.exists({uuid: uuid}).exec() ? true : false;
    }
}

module.exports = Blackjack;