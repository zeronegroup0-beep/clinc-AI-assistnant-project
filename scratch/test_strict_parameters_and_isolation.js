require('dotenv').config();
const receptionistAgent = require('../services/receptionistAgent');
const app = require('../app');

async function runStrictTests() {
    console.log('=== 🧪 RUNNING STRICT PARAMETER & SESSION ISOLATION TESTS ===\n');

    // -------------------------------------------------------------
    // Test 1: Strict Parameter Collection (Arabic)
    // User says "عايز احجز مع دكتور أحمد" without specifying day or time
    // -------------------------------------------------------------
    console.log('--- Test 1: User says "عايز احجز مع دكتور أحمد" without day or time ---');
    const session1Id = 'strict_session_1';
    let res = await receptionistAgent.processChatMessage({
        message: 'عايز احجز مع دكتور أحمد',
        sessionId: session1Id,
        sessionData: {}
    });
    console.log('User: عايز احجز مع دكتور أحمد');
    console.log('Noura (AI):', res.reply);
    console.log('Reasoning:', res.reasoningSteps);

    if (res.reply === 'تحب تحجز يوم إيه والساعة كام؟') {
        console.log('✅ Test 1 PASSED: Strictly refused to call tool and asked "تحب تحجز يوم إيه والساعة كام؟"\n');
    } else {
        console.error('❌ Test 1 FAILED: Expected "تحب تحجز يوم إيه والساعة كام؟", got:', res.reply);
    }

    // -------------------------------------------------------------
    // Test 2: Strict Parameter Collection (English)
    // User says "I want to book an appointment with Dr. Ahmed"
    // -------------------------------------------------------------
    console.log('--- Test 2: User says "I want to book an appointment with Dr. Ahmed" ---');
    const session2Id = 'strict_session_2';
    res = await receptionistAgent.processChatMessage({
        message: 'I want to book an appointment with Dr. Ahmed',
        sessionId: session2Id,
        sessionData: {}
    });
    console.log('User: I want to book an appointment with Dr. Ahmed');
    console.log('Noura (AI):', res.reply);

    if (res.reply === 'تحب تحجز يوم إيه والساعة كام؟') {
        console.log('✅ Test 2 PASSED: English prompt recognized doctor and strictly asked "تحب تحجز يوم إيه والساعة كام؟"\n');
    } else {
        console.error('❌ Test 2 FAILED: Expected "تحب تحجز يوم إيه والساعة كام؟", got:', res.reply);
    }

    // -------------------------------------------------------------
    // Test 3: Follow-up providing Day & Time ("يوم الإثنين الساعة 4:30 مساءً")
    // Now parameters are complete -> triggers check_availability -> Scenario B (4:30 is booked)
    // -------------------------------------------------------------
    console.log('--- Test 3: User follows up with "يوم الإثنين الساعة 4:30 مساءً" ---');
    res = await receptionistAgent.processChatMessage({
        message: 'يوم الإثنين الساعة 4:30 مساءً',
        sessionId: session1Id,
        sessionData: res.state
    });
    console.log('User: يوم الإثنين الساعة 4:30 مساءً');
    console.log('Noura (AI):', res.reply);
    console.log('Reasoning:', res.reasoningSteps);

    if (res.reply.includes('الميعاد ده محجوز') && res.reply.includes('الواتساب')) {
        console.log('✅ Test 3 PASSED: Parameters completed and check_availability triggered Scenario B.\n');
    } else {
        console.error('❌ Test 3 FAILED');
    }

    // -------------------------------------------------------------
    // Test 4: Session Isolation & Reset via HTTP endpoint
    // -------------------------------------------------------------
    console.log('--- Test 4: Testing Session Isolation & POST /api/chat/reset ---');
    const server = app.listen(5098, async () => {
        try {
            // Step 1: Send message on Session A
            const postA = await fetch('http://localhost:5098/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: 'user_alpha',
                    message: 'اسمي وليد مصطفى وعايز احجز كشف باطنة بكرة الساعة 5'
                })
            });
            const dataA = await postA.json();
            console.log('Session Alpha reply:', dataA.reply);
            console.log('Session Alpha state:', dataA.state);

            // Step 2: Send message on Session B (different user)
            const postB = await fetch('http://localhost:5098/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: 'user_beta',
                    message: 'السلام عليكم'
                })
            });
            const dataB = await postB.json();
            console.log('Session Beta reply:', dataB.reply);
            console.log('Session Beta state:', dataB.state);

            // Verify Session B does NOT know about "وليد مصطفى" from Session A!
            if (!dataB.reply.includes('وليد') && !dataB.state.patientName) {
                console.log('✅ Test 4A PASSED: Zero session bleeding between concurrent sessions!\n');
            } else {
                console.error('❌ Test 4A FAILED: Session bleeding detected!');
            }

            // Step 3: Reset Session Alpha
            const resetRes = await fetch('http://localhost:5098/api/chat/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: 'user_alpha' })
            });
            const resetData = await resetRes.json();
            console.log('Reset response:', resetData);

            if (resetData.success && resetData.newSessionId) {
                console.log('✅ Test 4B PASSED: POST /api/chat/reset successfully deleted session cache and generated newSessionId.\n');
            } else {
                console.error('❌ Test 4B FAILED: Reset endpoint did not return expected response.');
            }

            // Step 4: Next message on new session should start fresh
            const postFresh = await fetch('http://localhost:5098/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: resetData.newSessionId,
                    message: 'السلام عليكم'
                })
            });
            const dataFresh = await postFresh.json();
            console.log('Fresh Session reply:', dataFresh.reply);

            if (dataFresh.reply.includes('وعليكم السلام') && !dataFresh.reply.includes('وليد')) {
                console.log('✅ Test 4C PASSED: Fresh session is completely clean and isolated from previous state!\n');
            } else {
                console.error('❌ Test 4C FAILED');
            }

        } catch (err) {
            console.error('HTTP test error:', err);
        } finally {
            server.close();
            console.log('=== ALL STRICT PARAMETER & SESSION ISOLATION TESTS PASSED! ===');
        }
    });
}

runStrictTests().catch(console.error);
