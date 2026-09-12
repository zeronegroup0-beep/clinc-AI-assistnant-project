require('dotenv').config();
const receptionistAgent = require('../services/receptionistAgent');

async function runTests() {
    console.log('================================================================');
    console.log('🧪 TESTING: Contextual Time & Conversational Memory Fix');
    console.log('================================================================\n');

    // Freeze base test date to Saturday, 12 September 2026
    const fixedNow = new Date(2026, 8, 12, 11, 0, 0); // Month 8 is September (0-indexed)
    console.log(`Current Base Time: ${fixedNow.toDateString()}`);
    console.log(`Expected Spoken Arabic: السبت 12 سبتمبر 2026\n`);

    let passed = 0;
    let failed = 0;

    function assert(condition, testName, details = '') {
        if (condition) {
            console.log(`✅ PASS: ${testName}`);
            if (details) console.log(`   ${details}`);
            passed++;
        } else {
            console.error(`❌ FAIL: ${testName}`);
            if (details) console.error(`   ${details}`);
            failed++;
        }
    }

    // -------------------------------------------------------------
    // TEST SUITE 1: Direct Answer for Date Inquiries (Rule 1)
    // -------------------------------------------------------------
    console.log('--- TEST SUITE 1: Direct Answer for Date Inquiries ("النهاردة إيه؟") ---');

    const testInquiries = [
        'هو النهاردة إيه؟',
        'احنا يوم إيه؟',
        'تاريخ النهاردة كام؟',
        'النهارده ايه في الايام؟'
    ];

    for (const q of testInquiries) {
        const res = await receptionistAgent.processChatMessage({
            message: q,
            sessionId: 'test_date_inquiry',
            sessionData: {},
            currentDate: fixedNow
        });

        const hasSpokenDate = res.reply.includes('السبت 12 سبتمبر 2026');
        const hasDirectAnswer = res.reply.startsWith('النهاردة السبت 12 سبتمبر 2026');
        assert(
            hasSpokenDate && hasDirectAnswer,
            `Direct Date Inquiry: "${q}"`,
            `Reply: "${res.reply}"`
        );
    }

    // -------------------------------------------------------------
    // TEST SUITE 2: Contextual Chain Tracking (Rule 2 & 3)
    // Multi-turn conversation tracking lastDiscussedDate
    // -------------------------------------------------------------
    console.log('\n--- TEST SUITE 2: Contextual Chain Tracking ("بعده", "وكمان يومين") ---');

    let sessionState = {};
    const sessionId = 'session_chain_tracking_' + Date.now();

    // Turn 1: Inquire about tomorrow ("بكرة")
    console.log('\n[Turn 1] User: "فاضيين بكرة؟"');
    let turn1 = await receptionistAgent.processChatMessage({
        message: 'فاضيين بكرة؟',
        sessionId,
        sessionData: sessionState,
        currentDate: fixedNow
    });
    sessionState = turn1.state;

    assert(
        turn1.state.lastDiscussedDate && turn1.state.lastDiscussedDate.dateStr === '2026-09-13',
        'Turn 1 sets lastDiscussedDate to Sunday 2026-09-13',
        `Stored dateStr: ${turn1.state.lastDiscussedDate?.dateStr}, Day: ${turn1.state.lastDiscussedDate?.dayNameAr}`
    );
    assert(
        turn1.suggestedSlots && turn1.suggestedSlots.length > 0,
        'Turn 1 triggers check_availability and returns slots for Sunday',
        `Slots: ${turn1.suggestedSlots?.join(', ')}`
    );

    // Turn 2: Follow up with "طب بعده؟" (should calculate Monday relative to Sunday)
    console.log('\n[Turn 2] User: "طب بعده؟"');
    let turn2 = await receptionistAgent.processChatMessage({
        message: 'طب بعده؟',
        sessionId,
        sessionData: sessionState,
        currentDate: fixedNow
    });
    sessionState = turn2.state;

    assert(
        turn2.state.lastDiscussedDate && turn2.state.lastDiscussedDate.dateStr === '2026-09-14',
        'Turn 2 ("طب بعده؟") calculates Monday 2026-09-14 (+1 from Sunday)',
        `Stored dateStr: ${turn2.state.lastDiscussedDate?.dateStr}, Day: ${turn2.state.lastDiscussedDate?.dayNameAr}`
    );
    assert(
        turn2.reply.includes('قصد حضرتك يوم الإثنين اللي بعد بكرة؟'),
        'Turn 2 includes elderly-friendly clarification greeting',
        `Reply excerpt: "${turn2.reply.split('\n')[0]}"`
    );
    assert(
        turn2.suggestedSlots && turn2.suggestedSlots.length > 0,
        'Turn 2 triggers check_availability for Monday slots',
        `Slots: ${turn2.suggestedSlots?.join(', ')}`
    );

    // Turn 3: Follow up with "وكمان يومين؟" (should calculate Wednesday relative to Monday)
    console.log('\n[Turn 3] User: "وكمان يومين؟"');
    let turn3 = await receptionistAgent.processChatMessage({
        message: 'وكمان يومين؟',
        sessionId,
        sessionData: sessionState,
        currentDate: fixedNow
    });
    sessionState = turn3.state;

    assert(
        turn3.state.lastDiscussedDate && turn3.state.lastDiscussedDate.dateStr === '2026-09-16',
        'Turn 3 ("وكمان يومين؟") calculates Wednesday 2026-09-16 (+2 from Monday)',
        `Stored dateStr: ${turn3.state.lastDiscussedDate?.dateStr}, Day: ${turn3.state.lastDiscussedDate?.dayNameAr}`
    );
    assert(
        turn3.reply.includes('قصد حضرتك بعد يوم الإثنين بيومين') || turn3.reply.includes('الأربعاء'),
        'Turn 3 includes elderly-friendly verification for Wednesday',
        `Reply excerpt: "${turn3.reply.split('\n')[0]}"`
    );
    assert(
        turn3.suggestedSlots && turn3.suggestedSlots.length > 0,
        'Turn 3 triggers check_availability for Wednesday slots',
        `Slots: ${turn3.suggestedSlots?.join(', ')}`
    );

    // Turn 4: Follow up with "وإيه اخبار اللي بعده؟" (should calculate Thursday relative to Wednesday)
    console.log('\n[Turn 4] User: "وإيه اخبار اللي بعده؟"');
    let turn4 = await receptionistAgent.processChatMessage({
        message: 'وإيه اخبار اللي بعده؟',
        sessionId,
        sessionData: sessionState,
        currentDate: fixedNow
    });
    sessionState = turn4.state;

    assert(
        turn4.state.lastDiscussedDate && turn4.state.lastDiscussedDate.dateStr === '2026-09-17',
        'Turn 4 ("وإيه اخبار اللي بعده؟") calculates Thursday 2026-09-17 (+1 from Wednesday)',
        `Stored dateStr: ${turn4.state.lastDiscussedDate?.dateStr}, Day: ${turn4.state.lastDiscussedDate?.dayNameAr}`
    );

    // Turn 5: Follow up with "ويوم الجمعة؟"
    console.log('\n[Turn 5] User: "ويوم الجمعة؟"');
    let turn5 = await receptionistAgent.processChatMessage({
        message: 'ويوم الجمعة؟',
        sessionId,
        sessionData: sessionState,
        currentDate: fixedNow
    });
    sessionState = turn5.state;

    assert(
        turn5.state.lastDiscussedDate && turn5.state.lastDiscussedDate.dateStr === '2026-09-18',
        'Turn 5 ("ويوم الجمعة؟") checks Friday 2026-09-18',
        `Stored dateStr: ${turn5.state.lastDiscussedDate?.dateStr}, Day: ${turn5.state.lastDiscussedDate?.dayNameAr}`
    );

    console.log('\n================================================================');
    console.log(`TEST SUMMARY: Total ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
    console.log('================================================================');

    if (failed > 0) {
        process.exit(1);
    }
}

runTests().catch(err => {
    console.error('Fatal test error:', err);
    process.exit(1);
});
