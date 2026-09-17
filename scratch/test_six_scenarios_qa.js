const { processChatMessage } = require('../services/receptionistAgent');

/**
 * Automated QA Test Suite for Nora AI Clinic Assistant
 * 6 Sequential Scenarios:
 * 1. Doctor Switch
 * 2. Emergency
 * 3. Entity Correction
 * 4. Branch Selection
 * 5. General Inquiry
 * 6. Multi-Switch
 */

async function runScenario(scenarioName, turns) {
    console.log(`\n================================================================`);
    console.log(`🧪 Running Scenario: ${scenarioName}`);
    console.log(`================================================================`);

    let state = {};
    const turnResults = [];
    let scenarioPassed = true;
    const failures = [];

    for (let i = 0; i < turns.length; i++) {
        const turn = turns[i];
        const turnNum = i + 1;
        const start = Date.now();

        const res = await processChatMessage({
            message: turn.input,
            sessionId: `qa_${scenarioName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
            sessionData: state,
            currentDate: turn.mockDate || new Date(2026, 8, 14, 10, 0) // Monday Sep 14, 2026
        });

        const durationMs = Date.now() - start;
        state = res.state || {};

        console.log(`\n--- [Turn ${turnNum}] User: "${turn.input}" (${durationMs}ms) ---`);
        console.log(`Bot Reply: "${res.reply.replace(/\n/g, ' ')}"`);
        console.log(`Active State -> Doctor: ${state.doctor_id || state.bookingDraft?.doctor_id || 'none'} | Specialty: ${state.specialty_id || state.bookingDraft?.specialty_id || 'none'} | Branch: ${state.branch_id || 'none'} | Patient: ${state.patientName || 'none'} | Phone: ${state.patientPhone || 'none'}`);

        // Evaluate Turn Assertions
        const turnErrors = [];
        if (turn.assertions) {
            // mustInclude
            if (turn.assertions.mustInclude) {
                for (const str of turn.assertions.mustInclude) {
                    if (!res.reply.includes(str)) {
                        turnErrors.push(`Missing expected string: "${str}"`);
                    }
                }
            }
            // mustIncludeAny
            if (turn.assertions.mustIncludeAny) {
                const found = turn.assertions.mustIncludeAny.some(s => res.reply.includes(s));
                if (!found) {
                    turnErrors.push(`None of expected strings found: [${turn.assertions.mustIncludeAny.join(', ')}]`);
                }
            }
            // mustNotInclude
            if (turn.assertions.mustNotInclude) {
                for (const str of turn.assertions.mustNotInclude) {
                    if (res.reply.includes(str)) {
                        turnErrors.push(`Forbidden string appeared: "${str}"`);
                    }
                }
            }
            // stateCheck
            if (typeof turn.assertions.stateCheck === 'function') {
                try {
                    const ok = turn.assertions.stateCheck(state, res);
                    if (!ok) {
                        turnErrors.push(`State assertion condition failed.`);
                    }
                } catch (e) {
                    turnErrors.push(`State check error: ${e.message}`);
                }
            }
        }

        if (turnErrors.length > 0) {
            scenarioPassed = false;
            console.log(`❌ Turn ${turnNum} Assertions Failed:`);
            turnErrors.forEach(err => console.log(`   - ${err}`));
            failures.push(`Turn ${turnNum}: ${turnErrors.join('; ')}`);
        } else {
            console.log(`✅ Turn ${turnNum} Passed`);
        }

        turnResults.push({
            turnNum,
            input: turn.input,
            reply: res.reply,
            durationMs,
            passed: turnErrors.length === 0,
            errors: turnErrors,
            stateSnapshot: JSON.parse(JSON.stringify(state))
        });
    }

    return {
        scenarioName,
        passed: scenarioPassed,
        turns: turnResults,
        failures
    };
}

async function main() {
    console.log('🚀 Starting Nora AI Automated QA Test Execution (6 Scenarios)...\n');

    const testResults = [];

    // ==========================================
    // SCENARIO 1: DOCTOR SWITCH
    // ==========================================
    const s1 = await runScenario('Doctor Switch', [
        {
            input: 'اسمي هاني رمزي وعايز كشف أسنان مع د. أحمد شريف يوم الإثنين',
            assertions: {
                mustInclude: ['د. أحمد شريف'],
                mustIncludeAny: ['الأسنان', 'المواعيد'],
                stateCheck: (st) => (st.doctor_id === 'dr_ahmed' || st.bookingDraft?.doctor_id === 'dr_ahmed') &&
                                    (st.specialty_id?.includes('dent') || st.bookingDraft?.specialty_id?.includes('dent'))
            }
        },
        {
            input: 'لا معلش غيرت رأيي، عايز كشف باطنة مع د. حسام فتحي',
            assertions: {
                mustInclude: ['د. حسام فتحي', 'الباطنة والقلب'],
                mustNotInclude: ['طب الأسنان', 'كشف أسنان', 'تبييض الأسنان', 'د. أحمد شريف'],
                stateCheck: (st) => (st.doctor_id === 'dr_hossam' || st.bookingDraft?.doctor_id === 'dr_hossam') &&
                                    (st.specialty_id?.includes('cardiology') || st.bookingDraft?.specialty_id?.includes('cardiology')) &&
                                    st.bookingDraft?.specialty !== 'طب الأسنان' &&
                                    st.bookingDraft?.category !== 'طب الأسنان'
            }
        }
    ]);
    testResults.push(s1);

    // ==========================================
    // SCENARIO 2: EMERGENCY
    // ==========================================
    const s2 = await runScenario('Emergency', [
        {
            input: 'عندي نزيف حاد في أسناني وألم لا يطاق مش قادر أستنى',
            assertions: {
                mustInclude: [
                    'يا فندم سلامتك ألف سلامة!',
                    'الحالات الحادّة والطارئة بتتطلب توجه فوراً لأقرب قسم طوارئ أو مستشفى'
                ],
                mustNotInclude: ['المواعيد المتاحة', 'تحب أحجز'],
                stateCheck: (st) => st.isEmergency === true && !st.bookingDraft
            }
        }
    ]);
    testResults.push(s2);

    // ==========================================
    // SCENARIO 3: ENTITY CORRECTION
    // ==========================================
    const s3 = await runScenario('Entity Correction', [
        {
            input: 'مساء الخير، أنا اسمي سارة حسن وعايزة احجز كشف جلدية يوم الثلاثاء',
            assertions: {
                mustInclude: ['سارة حسن'],
                mustIncludeAny: ['د. سارة محمود', 'الجلدية'],
                stateCheck: (st) => st.patientName?.includes('سارة') && st.gender === 'female'
            }
        },
        {
            input: 'معلش اسمي مش سارة حسن، اسمي نور الهدى أحمد ورقمي 01012345678',
            assertions: {
                mustInclude: ['نور الهدى أحمد', '01012345678'],
                mustNotInclude: ['سارة حسن'],
                stateCheck: (st) => st.patientName === 'نور الهدى أحمد' && st.patientPhone === '01012345678'
            }
        }
    ]);
    testResults.push(s3);

    // ==========================================
    // SCENARIO 4: BRANCH SELECTION
    // ==========================================
    const s4 = await runScenario('Branch Selection', [
        {
            input: 'عندكم فروع ايه؟',
            assertions: {
                mustInclude: ['فرع دمنهور', 'فرع الإسكندرية'],
                mustIncludeAny: ['تحب تحجز في فرع دمنهور ولا فرع الإسكندرية؟', 'دمنهور والإسكندرية']
            }
        },
        {
            input: 'ممكن أعرف مواعيد فرع الإسكندرية؟',
            assertions: {
                mustInclude: ['مواعيد فرع الإسكندرية', 'د. حسام فتحي', 'د. مريم نبيل', 'د. أحمد شريف'],
                stateCheck: (st) => st.branch_id === 'alex'
            }
        },
        {
            input: 'طيب أكمل في دمنهور',
            assertions: {
                mustInclude: ['فرع دمنهور'],
                stateCheck: (st) => st.branch_id === 'damanhour'
            }
        }
    ]);
    testResults.push(s4);

    // ==========================================
    // SCENARIO 5: GENERAL INQUIRY
    // ==========================================
    const s5 = await runScenario('General Inquiry', [
        {
            input: 'ممكن اعرف سعر كشف الأسنان كام؟',
            assertions: {
                mustIncludeAny: ['350', 'جنيه'],
                mustInclude: ['د. أحمد شريف']
            }
        },
        {
            input: 'وهل متعاقدين مع شركات التأمين زي بوبا أو أكسا؟',
            assertions: {
                mustInclude: ['بوبا Bupa', 'أكسا AXA', 'ميدنت MedNet']
            }
        },
        {
            input: 'عنوان العيادة فين بالضبط ومواعيد العمل إيه؟',
            assertions: {
                mustInclude: ['الدقي', 'التحرير']
            }
        }
    ]);
    testResults.push(s5);

    // ==========================================
    // SCENARIO 6: MULTI-SWITCH
    // ==========================================
    const s6 = await runScenario('Multi-Switch', [
        {
            // Turn 1: Ahmed (Dentistry)
            input: 'عايز كشف مع د. أحمد شريف يوم الإثنين',
            assertions: {
                mustInclude: ['د. أحمد شريف'],
                stateCheck: (st) => (st.doctor_id === 'dr_ahmed' || st.bookingDraft?.doctor_id === 'dr_ahmed') &&
                                    (st.specialty_id?.includes('dent') || st.bookingDraft?.specialty_id?.includes('dent'))
            }
        },
        {
            // Turn 2: Switch to Sara (Dermatology)
            input: 'غيرت رأيي، عايز دكتورة سارة يوم الثلاثاء كشف جلدية',
            assertions: {
                mustInclude: ['د. سارة محمود', 'الجلدية'],
                mustNotInclude: ['طب الأسنان', 'د. أحمد شريف'],
                stateCheck: (st) => (st.doctor_id === 'dr_sara' || st.bookingDraft?.doctor_id === 'dr_sara') &&
                                    (st.specialty_id?.includes('skin') || st.specialty_id?.includes('derm')) &&
                                    st.bookingDraft?.specialty !== 'طب الأسنان'
            }
        },
        {
            // Turn 3: Switch to Hossam (Cardiology) in Alex
            input: 'لا هحول على د. حسام فتحي باطنة وقلب فرع الإسكندرية',
            assertions: {
                mustInclude: ['د. حسام فتحي', 'الباطنة والقلب'],
                mustNotInclude: ['الجلدية', 'طب الأسنان', 'سارة'],
                stateCheck: (st) => (st.doctor_id === 'dr_hossam' || st.bookingDraft?.doctor_id === 'dr_hossam') &&
                                    (st.specialty_id?.includes('cardiology') || st.bookingDraft?.specialty_id?.includes('cardiology')) &&
                                    st.branch_id === 'alex'
            }
        },
        {
            // Turn 4: Finalize booking
            input: 'يناسبني يوم الإثنين الساعة 6:00 مساءً، اسمي طارق يحيى ورقمي 01223344556',
            assertions: {
                mustIncludeAny: ['تم تأكيد حجز', 'تم الحجز', 'د. حسام فتحي', '01223344556'],
                mustNotInclude: ['الجلدية', 'الأسنان'],
                stateCheck: (st) => st.patientPhone === '01223344556' &&
                                    st.patientName?.includes('طارق')
            }
        }
    ]);
    testResults.push(s6);

    // ==========================================
    // SUMMARY
    // ==========================================
    console.log('\n================================================================');
    console.log('📊 SIMULATION EXECUTION SUMMARY');
    console.log('================================================================');
    let totalTurns = 0;
    let passedTurns = 0;
    let passedScenarios = 0;

    testResults.forEach((s, idx) => {
        const icon = s.passed ? '✅' : '❌';
        console.log(`${idx + 1}. [${icon}] ${s.scenarioName}: ${s.passed ? 'PASSED' : 'FAILED'}`);
        if (!s.passed) {
            s.failures.forEach(f => console.log(`    ⚠️  ${f}`));
        }
        s.turns.forEach(t => {
            totalTurns++;
            if (t.passed) passedTurns++;
        });
        if (s.passed) passedScenarios++;
    });

    const scenarioPassRate = ((passedScenarios / testResults.length) * 100).toFixed(1);
    const turnPassRate = ((passedTurns / totalTurns) * 100).toFixed(1);

    console.log(`\n• Total Scenarios: ${testResults.length}`);
    console.log(`• Passed Scenarios: ${passedScenarios}/${testResults.length} (${scenarioPassRate}%)`);
    console.log(`• Total Turns: ${totalTurns}`);
    console.log(`• Passed Turns: ${passedTurns}/${totalTurns} (${turnPassRate}%)`);
    console.log('================================================================\n');

    return { testResults, scenarioPassRate, turnPassRate };
}

if (require.main === module) {
    main().catch(err => {
        console.error('Fatal execution error:', err);
        process.exit(1);
    });
}

module.exports = { main, runScenario };
