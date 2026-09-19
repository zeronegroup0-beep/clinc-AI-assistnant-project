// scratch/test_multi_doctor_switch_remaining.js
const { processChatMessage } = require('../services/receptionistAgent');

async function testSwitchRemaining() {
    console.log("==================================================================");
    console.log("🧪 MULTI-DOCTOR JOURNEY SWITCH TO SARA SIMULATION");
    console.log("==================================================================");

    let sessionData = {};

    await processChatMessage({ message: '1 و 3', sessionData }).then(r => sessionData = r.state);
    await processChatMessage({ message: '1', sessionData }).then(r => sessionData = r.state);
    await processChatMessage({ message: 'الإثنين الساعة 5:30', sessionData }).then(r => sessionData = r.state);
    await processChatMessage({ message: 'محمود 01012345678', sessionData }).then(r => sessionData = r.state);

    // User asks about Dr. Sara instead of Dr. Hossam:
    console.log('\n[Turn 5] User: "طب دكتورة سارة ايه دنيتها؟"');
    const r5 = await processChatMessage({ message: 'طب دكتورة سارة ايه دنيتها؟', sessionData });
    sessionData = r5.state;
    console.log('Bot:\n' + r5.reply);
    console.log('Active doctor now:', sessionData.bookingDraft?.doctor);
}

testSwitchRemaining().catch(console.error);
