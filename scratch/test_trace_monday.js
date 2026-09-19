const { processChatMessage } = require('../services/receptionistAgent');

async function testTrace() {
    console.log("\n--- Session with doctor_id = dr_ahmed ---");
    const r3 = await processChatMessage({ 
        message: "كنت حابب اشوف كل مواعيد يوم الاثنين", 
        sessionData: { doctor_id: 'dr_ahmed' } 
    });
    console.log("R3 reply:\n", r3.reply);
    console.log("R3 reasoning:\n", r3.reasoningSteps);
}

testTrace().catch(console.error);
