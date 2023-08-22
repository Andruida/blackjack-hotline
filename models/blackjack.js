const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const SchemaTypes = mongoose.SchemaTypes;

const cardSchema = new Schema({
    color: String,
    value: String,
})

const blackjackSchema = new Schema({
    uuid: String,
    deck: [cardSchema],
    numberOfDecks: Number,
    balance: Number,
    dealersHand: [cardSchema],
    dealersSecretCard: cardSchema,
    playersHand: [cardSchema],
    bet: Number,
    betToBePlaced: Number,
    roundPhase: String
});

const BlackjackModel = mongoose.model('Blackjack', blackjackSchema);

module.exports = BlackjackModel;