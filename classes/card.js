const CardColor = Object.freeze({
    HEARTS: Symbol('HEARTS'),
    DIAMONDS: Symbol('DIAMONDS'),
    SPADES: Symbol('SPADES'),
    CLUBS: Symbol('CLUBS')
})

const CardValue = Object.freeze({
    ACE: Symbol('ACE'),
    TWO: Symbol('TWO'),
    THREE: Symbol('THREE'),
    FOUR: Symbol('FOUR'),
    FIVE: Symbol('FIVE'),
    SIX: Symbol('SIX'),
    SEVEN: Symbol('SEVEN'),
    EIGHT: Symbol('EIGHT'),
    NINE: Symbol('NINE'),
    TEN: Symbol('TEN'),
    JACK: Symbol('JACK'),
    QUEEN: Symbol('QUEEN'),
    KING: Symbol('KING')
})

const CardRealValue = Object.freeze({
    [CardValue.ACE]: 1,
    [CardValue.TWO]: 2,
    [CardValue.THREE]: 3,
    [CardValue.FOUR]: 4,
    [CardValue.FIVE]: 5,
    [CardValue.SIX]: 6,
    [CardValue.SEVEN]: 7,
    [CardValue.EIGHT]: 8,
    [CardValue.NINE]: 9,
    [CardValue.TEN]: 10,
    [CardValue.JACK]: 10,
    [CardValue.QUEEN]: 10,
    [CardValue.KING]: 10
})

const CardColorName = Object.freeze({
    [CardColor.HEARTS]: 'kőr',
    [CardColor.DIAMONDS]: 'káró',
    [CardColor.SPADES]: 'pikk',
    [CardColor.CLUBS]: 'treff'
})

const CardValueName = Object.freeze({
    [CardValue.ACE]: 'ász',
    [CardValue.TWO]: 'kettes',
    [CardValue.THREE]: 'hármas',
    [CardValue.FOUR]: 'négyes',
    [CardValue.FIVE]: 'ötös',
    [CardValue.SIX]: 'hatos',
    [CardValue.SEVEN]: 'hetes',
    [CardValue.EIGHT]: 'nyolcas',
    [CardValue.NINE]: 'kilences',
    [CardValue.TEN]: 'tizes',
    [CardValue.JACK]: 'jumbó',
    [CardValue.QUEEN]: 'dáma',
    [CardValue.KING]: 'király'
})

class Card {
    constructor(color, value) {
        if (Object.values(CardColor).indexOf(color) <= -1) {
            throw new Error('Invalid card color');
        }
        if (Object.values(CardValue).indexOf(value) <= -1) {
            throw new Error('Invalid card value');
        }
        this.color = color;
        this.value = value;
    }

    static fromDB(card) {
        if (card == null) return null;
        let color = card.color.match(/\((.*)\)/)[1]
        let value = card.value.match(/\((.*)\)/)[1]
        return new Card(CardColor[color], CardValue[value]);
    }

    toString() {
        return CardColorName[this.color] + ' ' + CardValueName[this.value];
    }
}

module.exports = {
    Card, CardColor, CardValue, CardRealValue
}