const BASE = 'http://localhost:5000';

async function testSecretary() {
    console.log('--- TESTING SECRETARY TAKEOVER & LIVE CONSOLE ---');

    // 1. Patient initiates chat requesting takeover
    const chatRes = await fetch(`${BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message: 'عايز اكلم حد من السكرتارية ضروري لو سمحتوا',
            sessionId: 'sec_test_session_101'
        })
    }).then(r => r.json());

    console.log('1. Patient message result:');
    console.log('   Reply:', chatRes.reply);
    console.log('   State:', chatRes.state?.humanTakeover ? 'Human Takeover Requested ✅' : 'Failed ❌');

    // 2. Fetch session from Secretary API
    const sessionRes = await fetch(`${BASE}/api/admin/chats/sec_test_session_101`).then(r => r.json());
    console.log('\n2. Secretary retrieved session:');
    console.log('   Session ID:', sessionRes.data?.sessionId);
    console.log('   Last Message:', sessionRes.data?.lastMessage);

    // 3. Secretary takes over session
    const takeoverRes = await fetch(`${BASE}/api/admin/chats/sec_test_session_101/takeover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            isTakenOver: true,
            agentName: 'سارة (السكرتارية الطبية)'
        })
    }).then(r => r.json());
    console.log('\n3. Secretary Takeover result:');
    console.log('   Message:', takeoverRes.message);
    console.log('   Status:', takeoverRes.success ? 'Success ✅' : 'Failed ❌');

    // 4. Secretary sends message directly to patient
    const msgRes = await fetch(`${BASE}/api/admin/chats/sec_test_session_101/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message: 'أهلاً بحضرتك يا فندم، أنا سارة موظفة الاستقبال. كيف أقدر أساعدك بخصوص موعد الكشف؟',
            agentName: 'سارة (السكرتارية)'
        })
    }).then(r => r.json());
    console.log('\n4. Secretary Message result:');
    console.log('   Message:', msgRes.message);
    console.log('   Status:', msgRes.success ? 'Sent ✅' : 'Failed ❌');

    // 5. Patient chat widget polls for human agent messages
    const pollRes = await fetch(`${BASE}/api/chat/sec_test_session_101/poll`).then(r => r.json());
    console.log('\n5. Patient Poll result:');
    console.log('   isTakenOver:', pollRes.isTakenOver ? 'True ✅' : 'False ❌');
    console.log('   Agent Name:', pollRes.agentName);
    const lastHumanMsg = pollRes.history?.filter(m => m.sender === 'human_agent').pop();
    console.log('   Received Agent Message:', lastHumanMsg?.text);

    const allGood = Boolean(chatRes.reply && takeoverRes.success && msgRes.success && pollRes.isTakenOver && lastHumanMsg?.text);
    console.log('\n=============================================');
    console.log(allGood ? '🎉 SECRETARY COMMAND & LIVE TAKEOVER FULLY OPERATIONAL!' : '❌ Flow encountered an issue');
    console.log('=============================================');
    return allGood;
}

testSecretary().then(ok => {
    if (!ok) process.exitCode = 1;
}).catch(err => {
    console.error(err);
    process.exitCode = 1;
});
