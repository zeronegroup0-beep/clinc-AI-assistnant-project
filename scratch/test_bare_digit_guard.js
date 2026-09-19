const assert = require('assert');
const { processChatMessage } = require('../services/receptionistAgent');

async function runBareDigitGuardTests() {
    console.log('================================================================');
    console.log('🧪 VERIFYING BARE DIGIT GUARD & UNPROMPTED DOCTOR SELECTION FIX');
    console.log('================================================================\n');

    let passedCount = 0;
    const fixedDate = new Date(2026, 8, 19, 10, 0, 0);

    // -------------------------------------------------------------
    // TEST 1: Bare digit '1' in fresh conversation
    // -------------------------------------------------------------
    console.log('--- TEST 1: Bare digit "1" in fresh conversation ---');
    {
        const r = await processChatMessage({
            message: '1',
            sessionId: 'bare_digit_t1',
            currentDate: fixedDate
        });

        console.log('Reply:', r.reply);
        assert(!r.reply.includes('د. أحمد شريف'), 'Must NOT assume Dr. Ahmed Sherif');
        assert(!r.reply.includes('مواعيد د.'), 'Must NOT output any doctor schedule');
        assert(r.reply.includes('عفواً، ما فهمتش قصد حضرتك') || r.reply.includes('أقدر أساعدك'), 'Must ask for clarification');
        console.log('  ✅ [PASS] Bare "1" does not default to Dr. Ahmed Sherif\n');
        passedCount++;
    }

    // -------------------------------------------------------------
    // TEST 2: Other bare digits ('2', '3', '4') in fresh conversation
    // -------------------------------------------------------------
    console.log('--- TEST 2: Bare digits "2", "3", "4" in fresh conversation ---');
    {
        for (const digit of ['2', '3', '4']) {
            const r = await processChatMessage({
                message: digit,
                sessionId: `bare_digit_${digit}`,
                currentDate: fixedDate
            });
            assert(!r.reply.includes('د. سارة') && !r.reply.includes('د. حسام') && !r.reply.includes('د. مريم'), `Must NOT select doctor for bare ${digit}`);
            assert(!r.reply.includes('مواعيد د.'), `Must NOT output schedule for bare ${digit}`);
        }
        console.log('  ✅ [PASS] Bare digits 2, 3, 4 do not select any doctor out of context\n');
        passedCount++;
    }

    // -------------------------------------------------------------
    // TEST 3: Unclear symbol or single character in fresh conversation
    // -------------------------------------------------------------
    console.log('--- TEST 3: Ambiguous single character / punctuation ---');
    {
        const r = await processChatMessage({
            message: '؟',
            sessionId: 'bare_symbol_t3',
            currentDate: fixedDate
        });
        assert(r.reply.includes('عفواً، ما فهمتش قصد حضرتك'), 'Must prompt for clarification on single symbol');
        console.log('  ✅ [PASS] Clarification returned for ambiguous input\n');
        passedCount++;
    }

    // -------------------------------------------------------------
    // TEST 4: Digit '1' AFTER bot explicitly asks to choose doctor
    // -------------------------------------------------------------
    console.log('--- TEST 4: Digit "1" in response to doctor prompt ---');
    {
        // Turn 1: Generic booking
        const r1 = await processChatMessage({
            message: 'عايز احجز كشف',
            sessionId: 'prompted_choice_t4',
            currentDate: fixedDate
        });
        assert(r1.reply.includes('د. أحمد شريف') && r1.reply.includes('د. سارة محمود'), 'Must list doctors');
        assert.strictEqual(r1.state.awaitingDoctorSelection, true, 'Must set awaitingDoctorSelection');

        // Turn 2: User responds "1"
        const r2 = await processChatMessage({
            message: '1',
            sessionId: 'prompted_choice_t4',
            sessionData: r1.state,
            currentDate: fixedDate
        });

        console.log('Turn 2 Reply:', r2.reply);
        assert(r2.reply.includes('د. أحمد شريف'), 'Should correctly choose Dr. Ahmed Sherif when prompted');
        assert(r2.reply.includes('يوم إيه'), 'Should ask for target day');
        console.log('  ✅ [PASS] "1" correctly maps to Dr. Ahmed Sherif when doctor selection is awaited\n');
        passedCount++;
    }

    // -------------------------------------------------------------
    // TEST 5: Explicit prefix "دكتور 1" or "رقم 2" on turn 1
    // -------------------------------------------------------------
    console.log('--- TEST 5: Explicit prefix "دكتور 1" and "رقم 2" ---');
    {
        const rDoc1 = await processChatMessage({
            message: 'دكتور 1',
            sessionId: 'explicit_prefix_doc1',
            currentDate: fixedDate
        });
        assert(rDoc1.reply.includes('د. أحمد شريف'), 'Should recognize Dr. Ahmed from "دكتور 1"');

        const rDoc2 = await processChatMessage({
            message: 'رقم 2',
            sessionId: 'explicit_prefix_doc2',
            currentDate: fixedDate
        });
        assert(rDoc2.reply.includes('د. سارة محمود'), 'Should recognize Dr. Sara from "رقم 2"');
        console.log('  ✅ [PASS] Explicit prefixes work on cold turn\n');
        passedCount++;
    }

    // -------------------------------------------------------------
    // TEST 6: Multi-doctor syntax "1 و 3" on turn 1
    // -------------------------------------------------------------
    console.log('--- TEST 6: Multi-doctor syntax "1 و 3" on turn 1 ---');
    {
        const rMulti = await processChatMessage({
            message: 'عايز احجز 1 و 3',
            sessionId: 'multi_syntax_t6',
            currentDate: fixedDate
        });
        assert(rMulti.reply.includes('د. أحمد شريف') && rMulti.reply.includes('د. حسام فتحي'), 'Should recognize both doctors in multi-choice');
        assert.strictEqual(rMulti.state.multiDoctorContext?.step, 'AWAITING_FIRST_DOCTOR_CHOICE', 'Should enter multi-doctor coordination');
        console.log('  ✅ [PASS] "1 و 3" triggers multi-doctor coordinated booking\n');
        passedCount++;
    }

    console.log('================================================================');
    console.log(`🎉 ALL ${passedCount}/6 BARE DIGIT GUARD TESTS PASSED SUCCESSFULLY!`);
    console.log('================================================================\n');
}

runBareDigitGuardTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
