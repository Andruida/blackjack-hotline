const Blackjack = require('../classes/blackjack');
const { Card, CardColor, CardValue, CardRealValue } = require('../classes/card');

describe('Deck creation', () => {
    test('should create 2 decks', () => {
        let blackjack = new Blackjack('test', 2, 1000);
        expect(blackjack.deck.length).toBe(104);
    })

})

describe('Hand value', () => {
    test('blackjack', () => {
        let playersHand = [new Card(CardColor.HEARTS, CardValue.ACE), new Card(CardColor.HEARTS, CardValue.KING)];
        let value = Blackjack.getHandValue(playersHand);
        expect(value).toBe(21);
    })

    test('bust', () => {
        let playersHand = [
            new Card(CardColor.HEARTS, CardValue.ACE), 
            new Card(CardColor.HEARTS, CardValue.KING), 
            new Card(CardColor.HEARTS, CardValue.KING), 
            new Card(CardColor.HEARTS, CardValue.ACE)
        ];
        let value = Blackjack.getHandValue(playersHand);
        expect(value).toBe(22);
    })

    test('three aces', () => {
        let playersHand = [
            new Card(CardColor.HEARTS, CardValue.ACE), 
            new Card(CardColor.SPADES, CardValue.ACE), 
            new Card(CardColor.DIAMONDS, CardValue.ACE)
        ];
        let value = Blackjack.getHandValue(playersHand);
        expect(value).toBe(13);
    })

    test('sanity check', () => {
        let playersHand = [
            new Card(CardColor.HEARTS, CardValue.TWO),
            new Card(CardColor.SPADES, CardValue.THREE),
            new Card(CardColor.DIAMONDS, CardValue.TEN),
            new Card(CardColor.CLUBS, CardValue.KING)
        ];

        let value = Blackjack.getHandValue(playersHand);
        expect(value).toBe(25);
    })

    test('sanity check 2', () => {
        let game = new Blackjack('test', 2, 1000);
        game.playersHand = [
            new Card(CardColor.HEARTS, CardValue.TWO),
            new Card(CardColor.SPADES, CardValue.THREE),
            new Card(CardColor.DIAMONDS, CardValue.TEN),
            new Card(CardColor.CLUBS, CardValue.KING)
        ];
        game.dealersHand = [
            new Card(CardColor.HEARTS, CardValue.TWO),
            new Card(CardColor.SPADES, CardValue.FIVE),
            new Card(CardColor.DIAMONDS, CardValue.TEN),
            new Card(CardColor.CLUBS, CardValue.ACE)
        ];

        let player = game.getPlayersHandValue();
        expect(player).toBe(25);

        let dealer = game.getDealersHandValue();
        expect(dealer).toBe(18);
    })
})

describe("Game phases", () => {
    describe("Betting", () => {
        let game = null
        beforeEach(() => {
            game = new Blackjack('test', 2, 1000);
        })

        test('should throw an error if the round phase is not betting', () => {
            game.roundPhase = Blackjack.RoundPhases.DEALING;
            expect(() => game.placeBet(100)).toThrow('Invalid round phase');
        })

        test('should return false if the player does not have enough money', () => {
            game.balance = 100;
            expect(game.placeBet(200)).toBe(false);
            expect(game.bet).toBe(0);
            expect(game.balance).toBe(100);
        })

        test('should return true if the player has enough money', () => {
            game.balance = 100;
            expect(game.placeBet(50)).toBe(true);
            game.finalizeBet();
            expect(game.bet).toBe(50);
            expect(game.balance).toBe(50);
        })

        test('should change the round phase to dealing', () => {
            game.balance = 100;
            game.placeBet(50);
            game.finalizeBet();
            expect(game.roundPhase).toBe(Blackjack.RoundPhases.DEALING);
            expect(() => game.placeBet(50)).toThrow('Invalid round phase');
        })
    })

    describe("Dealing", () => {
        let game = null
        beforeEach(() => {
            game = new Blackjack('test', 2, 1000);
            game.placeBet(100)
            game.finalizeBet()
        })

        test('should deal 2 cards to the player and 2 cards to the dealer', () => {
            game.deal();
            expect(game.playersHand.length).toBe(2);
            expect(game.dealersHand.length).toBe(1);
            expect(game.dealersSecretCard).not.toBeNull();
            expect(game.deck.length).toBe(100);
            expect(game.roundPhase).toBe(Blackjack.RoundPhases.PLAYING);
        })

        test('should return true if the player has blackjack', () => {
            game.deck.push(new Card(CardColor.SPADES, CardValue.TWO));
            game.deck.push(new Card(CardColor.SPADES, CardValue.KING)); // player
            game.deck.push(new Card(CardColor.HEARTS, CardValue.KING));
            game.deck.push(new Card(CardColor.HEARTS, CardValue.ACE)); // player

            expect(game.deal()).toBe(true);
            expect(game.roundPhase).toBe(Blackjack.RoundPhases.RESOLVING);
        })

    })

    describe("Playing", () => {
        let game = null;
        beforeEach(() => {
            game = new Blackjack('test', 2, 1000);

            game.deck.push(new Card(CardColor.SPADES, CardValue.TWO));
            game.deck.push(new Card(CardColor.HEARTS, CardValue.FIVE));
            game.deck.push(new Card(CardColor.DIAMONDS, CardValue.SEVEN));
            game.deck.push(new Card(CardColor.SPADES, CardValue.KING));
            game.deck.push(new Card(CardColor.SPADES, CardValue.ACE));
            game.deck.push(new Card(CardColor.HEARTS, CardValue.ACE));
            game.deck.push(new Card(CardColor.SPADES, CardValue.QUEEN)); // 1st hit
            game.deck.push(new Card(CardColor.DIAMONDS, CardValue.SIX));
            game.deck.push(new Card(CardColor.DIAMONDS, CardValue.NINE)); // player
            game.deck.push(new Card(CardColor.DIAMONDS, CardValue.KING));
            game.deck.push(new Card(CardColor.HEARTS, CardValue.JACK)); // player

            game.placeBet(100);
            game.finalizeBet();
            game.deal();
        })

        test('should throw an error if the round phase is not playing', () => {
            game.roundPhase = Blackjack.RoundPhases.DEALING;
            expect(() => game.hit()).toThrow('Invalid round phase');
            expect(() => game.stand()).toThrow('Invalid round phase');
        })

        test('should hit the deck and bust', () => {
            expect(game.hit()).toBe(false);
            expect(game.playersHand.length).toBe(3);
            expect(game.roundPhase).toBe(Blackjack.RoundPhases.RESOLVING);
        })

        test('should hit the deck and win', () => {
            game.deck.push(new Card(CardColor.HEARTS, CardValue.TWO))
            expect(game.hit()).toBe(false);
            expect(game.playersHand.length).toBe(3);
            expect(game.roundPhase).toBe(Blackjack.RoundPhases.RESOLVING);
        })

        test('should hit the deck and not bust', () => {
            game.deck.push(new Card(CardColor.HEARTS, CardValue.ACE))
            expect(game.hit()).toBe(true);
            expect(game.playersHand.length).toBe(3);
            expect(game.roundPhase).toBe(Blackjack.RoundPhases.PLAYING);
        })

        test('should stand', () => {
            game.stand();
            expect(game.dealersHand.length).toBe(3);
            expect(game.roundPhase).toBe(Blackjack.RoundPhases.RESOLVING);
        })
    })

})