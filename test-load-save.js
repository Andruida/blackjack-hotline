const Blackjack = require('./classes/blackjack');
const mongoose = require('mongoose');


async function main() {
    await mongoose.connect('mongodb://localhost:27017/blackjack')

    let blackjack = new Blackjack('test', 2, 1000);
    blackjack.placeBet(100);
    blackjack.finalizeBet();
    blackjack.deal();


    console.log(blackjack);
    console.log("\n")

    console.log(await Blackjack.exists('test'))

    await blackjack.save()

    console.log(await Blackjack.exists('test'))

    let newBlackjack = await Blackjack.load('36203474940')
    console.log(newBlackjack.placeBet(100));
    // newBlackjack.save()
    console.log(newBlackjack);
    // console.log(JSON.stringify(newBlackjack) == JSON.stringify(blackjack))

    console.log(await blackjack.delete())

    console.log(await Blackjack.exists('test'))

    await mongoose.disconnect()
}

main();
