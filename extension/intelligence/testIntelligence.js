import { processTrade }
    from "./index.js";


const testTrade = {

    id: "test-001",

    symbol: "BTCUSD",

    direction: "LONG",

    entry: 65174,

    stopLoss: 64952,

    takeProfit: 66326,

    exitPrice: 66000

};


const result =
    processTrade(testTrade);


console.log(
    "🧠 INTELLIGENCE TEST:",
    result
);