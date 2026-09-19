// scratch/test_multi_doctor_journey.js
const { processChatMessage } = require('../services/receptionistAgent');

async function testJourney() {
    let sessionData = {};

    console.log('\n[Turn 1] User: "1 و 3"');
    await processChatMessage({ message: '1 و 3', sessionData }).then(r => {
        sessionData = r.state;
        console.log('Bot:\n' + r.reply);
    });

    console.log('\n[Turn 2] User: "1"');
    await processChatMessage({ message: '1', sessionData }).then(r => {
        sessionData = r.state;
        console.log('Bot:\n' + r.reply);
    });

    console.log('\n[Turn 3] User: "الإثنين الساعة 5:30"');
    await processChatMessage({ message: 'الإثنين الساعة 5:30', sessionData }).then(r => {
        sessionData = r.state;
        console.log('Bot:\n' + r.reply);
    });

    console.log('\n[Turn 4] User: "محمود 01012345678"');
    await processChatMessage({ message: 'محمود 01012345678', sessionData }).then(r => {
        sessionData = r.state;
        console.log('Bot:\n' + r.reply);
    });

    console.log('\n[Turn 5] User: "اه يوم الثلاثاء الساعة 2"');
    await processChatMessage({ message: 'اه يوم الثلاثاء الساعة 2', sessionData }).then(r => {
        sessionData = r.state;
        console.log('Bot:\n' + r.reply);
    });

    console.log('\n[Turn 6] User: "تمام 3:00 يناسبني"');
    await processChatMessage({ message: 'تمام 3:00 يناسبني', sessionData }).then(r => {
        sessionData = r.state;
        console.log('Bot:\n' + r.reply);
    });
}

testJourney().catch(console.error);
