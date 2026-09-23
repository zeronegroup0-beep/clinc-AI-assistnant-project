// Scratch test to verify /api/chat/voice-transcribe and /api/chat/voice-message endpoints
const http = require('http');

function postJson(path, data) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify(data);
        const req = http.request({
            hostname: 'localhost',
            port: 5000,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(body) });
                } catch (e) {
                    resolve({ status: res.statusCode, raw: body });
                }
            });
        });

        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

async function runTests() {
    console.log('--- Testing Voice Endpoints ---');

    // Test 1: Empty audio payload validation
    console.log('\n[Test 1] Testing empty audio validation...');
    const t1 = await postJson('/api/chat/voice-transcribe', {});
    console.log('Test 1 Result:', t1.status, t1.data);
    if (t1.status === 400 && t1.data.success === false) {
        console.log('✓ Test 1 Passed: Correctly returned 400 for missing audio');
    } else {
        console.error('✗ Test 1 Failed');
    }

    // Test 2: Voice transcribe endpoint with simulated base64 audio
    console.log('\n[Test 2] Testing voice-transcribe endpoint with base64 dummy audio...');
    // A tiny dummy WebM audio header base64
    const dummyWebm = 'GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQJ8gQAZ7kC/80FkBA==' ;
    const t2 = await postJson('/api/chat/voice-transcribe', {
        audio: dummyWebm,
        mimeType: 'audio/webm',
        language: 'ar'
    });
    console.log('Test 2 Result:', t2.status, t2.data);

    // Test 3: Voice message endpoint with dummy audio
    console.log('\n[Test 3] Testing voice-message endpoint...');
    const t3 = await postJson('/api/chat/voice-message', {
        audio: dummyWebm,
        mimeType: 'audio/webm',
        language: 'ar',
        sessionId: 'test_voice_session'
    });
    console.log('Test 3 Result:', t3.status, t3.data);

    // Test 4: Regular chat endpoint to ensure focus & message flow are rock solid
    console.log('\n[Test 4] Testing standard chat flow...');
    const t4 = await postJson('/api/chat', {
        message: 'عايز اعرف مواعيد دكتور احمد شريف',
        sessionId: 'test_voice_session'
    });
    console.log('Test 4 Result:', t4.status, t4.data?.reply ? 'Received Reply: ' + t4.data.reply.slice(0, 50) + '...' : t4.data);

    console.log('\nAll voice route verifications completed.');
}

runTests().catch(console.error);
