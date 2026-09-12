const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const QA_TEST_SUITE = require('../config/qa_suite');
const receptionistAgent = require('./receptionistAgent');

/**
 * Execute a single turn and evaluate its assertions
 */
async function executeTurn({ userMessage, assertions = {}, sessionId, sessionData = {}, currentDate = new Date() }) {
    const startTime = Date.now();
    const result = await receptionistAgent.processChatMessage({
        message: userMessage,
        sessionId,
        sessionData,
        currentDate
    });
    const durationMs = Date.now() - startTime;

    const reply = result.reply || '';
    const reasoningSteps = result.reasoningSteps || [];
    const suggestedSlots = result.suggestedSlots || [];
    const state = result.state || {};
    const turnFailures = [];

    // Check mustInclude
    if (assertions.mustInclude && Array.isArray(assertions.mustInclude)) {
        for (const str of assertions.mustInclude) {
            if (!reply.includes(str)) {
                turnFailures.push(`النص المطلوب "${str}" لم يظهر في الرد.`);
            }
        }
    }

    // Check mustIncludeAny
    if (assertions.mustIncludeAny && Array.isArray(assertions.mustIncludeAny)) {
        const foundAny = assertions.mustIncludeAny.some(str => reply.includes(str));
        if (!foundAny) {
            turnFailures.push(`لم يظهر أي من المصطلحات المطلوبة: [${assertions.mustIncludeAny.join(', ')}].`);
        }
    }

    // Check mustNotInclude
    if (assertions.mustNotInclude && Array.isArray(assertions.mustNotInclude)) {
        for (const str of assertions.mustNotInclude) {
            if (reply.includes(str)) {
                turnFailures.push(`النص الممنوع "${str}" ظهر بشكل خاطئ في الرد.`);
            }
        }
    }

    // Check mustTriggerTool
    if (assertions.mustTriggerTool) {
        const triggered = reasoningSteps.some(step => step.toLowerCase().includes(assertions.mustTriggerTool.toLowerCase()));
        if (!triggered) {
            turnFailures.push(`الأداة المطلوبة "${assertions.mustTriggerTool}" لم يتم تشغيلها في خطوات التفكير.`);
        }
    }

    // Check mustHaveSlots
    if (assertions.mustHaveSlots && suggestedSlots.length === 0) {
        turnFailures.push('كان متوقعاً عرض قائمة مواعيد متاحة ولكن لم تظهر أي مواعيد.');
    }

    // Check mustNotHaveSlots
    if (assertions.mustNotHaveSlots && suggestedSlots.length > 0) {
        turnFailures.push('كان متوقعاً عدم عرض أزرار المواعيد ولكن تم عرضها بشكل زائد.');
    }

    // Check stateCheck
    if (typeof assertions.stateCheck === 'function') {
        try {
            const stateOk = assertions.stateCheck(state);
            if (!stateOk) {
                turnFailures.push('حالة الجلسة المستخرجة (State) لم تطابق الشروط المتوقعة.');
            }
        } catch (e) {
            turnFailures.push(`خطأ أثناء التحقق من حالة الجلسة: ${e.message}`);
        }
    }

    return {
        userMessage,
        botReply: reply,
        reasoningSteps,
        suggestedSlots,
        card: result.card || null,
        nextState: state,
        durationMs,
        passed: turnFailures.length === 0,
        turnFailures
    };
}

/**
 * Run a single test case across all its turns
 */
async function runTestCase(testCase, currentDate = new Date()) {
    const caseStartTime = Date.now();
    const sessionId = `qa_${testCase.id}_${Date.now()}`;
    const effectiveDate = testCase.mockDate || currentDate;
    let currentState = {};
    const turnsResults = [];
    let isCasePassed = true;
    const allFailures = [];

    for (let i = 0; i < testCase.turns.length; i++) {
        const turn = testCase.turns[i];
        const turnResult = await executeTurn({
            userMessage: turn.userMessage,
            assertions: turn.assertions,
            sessionId,
            sessionData: currentState,
            currentDate: effectiveDate
        });

        currentState = turnResult.nextState;
        turnsResults.push(turnResult);

        if (!turnResult.passed) {
            isCasePassed = false;
            turnResult.turnFailures.forEach(f => {
                allFailures.push(`[جولة ${i + 1}]: ${f}`);
            });
        }
    }

    const totalDurationMs = Date.now() - caseStartTime;

    return {
        id: testCase.id,
        title: testCase.title,
        category: testCase.category,
        persona: testCase.persona,
        description: testCase.description,
        passed: isCasePassed,
        durationMs: totalDurationMs,
        failures: allFailures,
        turns: turnsResults
    };
}

/**
 * Run all test cases in the suite or a filtered subset
 */
async function runAllTests({ category = null, testIds = null, currentDate = new Date() } = {}) {
    const overallStartTime = Date.now();
    let casesToRun = QA_TEST_SUITE;

    if (category) {
        casesToRun = casesToRun.filter(c => c.category === category);
    }

    if (Array.isArray(testIds) && testIds.length > 0) {
        casesToRun = casesToRun.filter(c => testIds.includes(c.id));
    }

    const results = [];
    let passedCount = 0;
    let failedCount = 0;

    for (const testCase of casesToRun) {
        const testResult = await runTestCase(testCase, currentDate);
        if (testResult.passed) {
            passedCount++;
        } else {
            failedCount++;
        }
        results.push(testResult);
    }

    const totalDurationMs = Date.now() - overallStartTime;
    const totalCount = results.length;
    const passRate = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;

    return {
        timestamp: new Date().toISOString(),
        summary: {
            total: totalCount,
            passed: passedCount,
            failed: failedCount,
            passRate: `${passRate}%`,
            durationMs: totalDurationMs,
            averageDurationMs: totalCount > 0 ? Math.round(totalDurationMs / totalCount) : 0
        },
        results
    };
}

module.exports = {
    runAllTests,
    runTestCase,
    executeTurn,
    QA_TEST_SUITE
};
