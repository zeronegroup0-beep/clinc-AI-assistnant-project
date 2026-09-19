const { processChatMessage } = require('../services/receptionistAgent');

const text = "كنت حابب احجز كشف";
console.log("Testing with awaitingName = true:");

processChatMessage({ message: text, sessionData: { awaitingName: true } }).then(res => {
    console.log("Bot reply:\n", res.reply);
    console.log("State:", res.state);
    console.log("Reasoning:", res.reasoningSteps);
}).catch(console.error);
