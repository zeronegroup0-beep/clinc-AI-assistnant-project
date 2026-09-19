// scratch/test_multi_doctor_skip.js
const { processChatMessage } = require('../services/receptionistAgent');

async function testSkip() {
    console.log("==================================================================");
    console.log("🧪 MULTI-DOCTOR JOURNEY SKIP SIMULATION");
    console.log("==================================================================");

    let sessionData = {};

    // Turn 1: User says "1 و 3"
    await processChatMessage({ message: '1 و 3', sessionData }).then(r => sessionData = r.state);

    // Turn 2: User chooses who to book first: "1"
    await processChatMessage({ message: '1', sessionData }).then(r => sessionData = r.state);

    // Turn 3: User chooses slot: "الإثنين الساعة 5:30"
    await processChatMessage({ message: 'الإثنين الساعة 5:30', sessionData }).then(r => sessionData = r.state);

    // Turn 4: User provides name & phone: "محمود 01012345678"
    const r4 = await processChatMessage({ message: 'محمود 01012345678', sessionData });
    sessionData = r4.state;
    console.log('[Turn 4 Confirmation & Prompt]:\n' + r4.reply);

    // Turn 5: User declines second doctor: "لا خلاص كفاية دكتور أحمد شكراً"
    console.log('\n[Turn 5] User: "لا خلاص كفاية دكتور أحمد شكراً"');
    const r5 = await processChatMessage({ message: 'لا خلاص كفاية دكتور أحمد شكراً', sessionData });
    sessionData = r5.state;
    console.log('Bot:\n' + r5.reply);
    console.log('Session multiDoctorContext after skip:', sessionData.multiDoctorContext);
}

testSkip().catch(console.error);
