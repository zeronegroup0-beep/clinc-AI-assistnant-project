const http = require('http');

function postChat(message, sessionId, sessionData = {}) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify({ message, sessionId, sessionData });
        const req = http.request({
            hostname: 'localhost',
            port: 5000,
            path: '/api/chat',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        }, res => {
            let body = '';
            res.on('data', chunk => { body += chunk; });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    reject(new Error(`Failed to parse: ${body}`));
                }
            });
        });

        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

async function testHttpChat() {
    console.log('--- Testing /api/chat End-to-End HTTP Flow ---\n');

    const sessionId = 'test_http_elderly_' + Date.now();
    let state = {};

    // 1. Direct date inquiry
    console.log('1. User asks: "هو النهاردة إيه؟"');
    const res1 = await postChat('هو النهاردة إيه؟', sessionId, state);
    console.log('Bot reply:', res1.reply);
    state = res1.state;
    if (!res1.reply.includes('النهاردة') || !res1.reply.includes('2026')) {
        throw new Error('Date inquiry failed in HTTP API');
    }

    // 2. Relative date query ("فاضيين بكرة؟")
    console.log('\n2. User asks: "فاضيين بكرة؟"');
    const res2 = await postChat('فاضيين بكرة؟', sessionId, state);
    console.log('Bot reply:', res2.reply);
    state = res2.state;
    if (!res2.suggestedSlots || res2.suggestedSlots.length === 0) {
        throw new Error('Tomorrow slots failed in HTTP API');
    }

    // 3. Chained inquiry ("طب بعده؟")
    console.log('\n3. User asks: "طب بعده؟"');
    const res3 = await postChat('طب بعده؟', sessionId, state);
    console.log('Bot reply:', res3.reply);
    state = res3.state;
    if (!res3.reply.includes('قصد حضرتك يوم الإثنين اللي بعد بكرة؟') && !res3.reply.includes('الإثنين')) {
        throw new Error('Chained inquiry "بعده" failed in HTTP API');
    }

    // 4. Chained inquiry ("وكمان يومين؟")
    console.log('\n4. User asks: "وكمان يومين؟"');
    const res4 = await postChat('وكمان يومين؟', sessionId, state);
    console.log('Bot reply:', res4.reply);
    state = res4.state;
    if (!res4.reply.includes('الأربعاء')) {
        throw new Error('Chained inquiry "وكمان يومين" failed in HTTP API');
    }

    console.log('\n✅ ALL HTTP API Contextual Memory & Chaining Tests PASSED!');
}

testHttpChat().catch(err => {
    console.error('HTTP test failed:', err);
    process.exit(1);
});
