const express = require('express');
const router = express.Router();
const qaRunner = require('../services/qaRunner');
const receptionistAgent = require('../services/receptionistAgent');

/**
 * GET /api/qa/cases
 * Returns metadata list of all test cases in the QA suite
 */
router.get('/cases', (req, res) => {
    const casesMetadata = qaRunner.QA_TEST_SUITE.map(tc => ({
        id: tc.id,
        title: tc.title,
        category: tc.category,
        persona: tc.persona,
        description: tc.description,
        turnCount: tc.turns.length,
        initialPrompt: tc.turns[0]?.userMessage || ''
    }));

    return res.json({
        success: true,
        total: casesMetadata.length,
        cases: casesMetadata
    });
});

/**
 * POST /api/qa/run
 * Run all tests or filtered subset
 */
router.post('/run', async (req, res) => {
    try {
        const { category, testIds } = req.body || {};
        const report = await qaRunner.runAllTests({ category, testIds });
        return res.json({
            success: true,
            report
        });
    } catch (err) {
        console.error('QA Run Error:', err);
        return res.status(500).json({
            success: false,
            message: 'Error executing QA suite',
            error: err.message
        });
    }
});

/**
 * POST /api/qa/run-single
 * Run a specific test case by ID
 */
router.post('/run-single', async (req, res) => {
    try {
        const { testId } = req.body;
        if (!testId) {
            return res.status(400).json({ success: false, message: 'testId is required' });
        }

        const testCase = qaRunner.QA_TEST_SUITE.find(tc => tc.id === testId);
        if (!testCase) {
            return res.status(404).json({ success: false, message: `Test case ${testId} not found` });
        }

        const result = await qaRunner.runTestCase(testCase);
        return res.json({
            success: true,
            result
        });
    } catch (err) {
        console.error('QA Run Single Error:', err);
        return res.status(500).json({
            success: false,
            message: 'Error executing test case',
            error: err.message
        });
    }
});

/**
 * POST /api/qa/custom-test
 * Interactive ad-hoc testing endpoint for user-provided prompts
 */
router.post('/custom-test', async (req, res) => {
    try {
        const { message, sessionId = 'qa_custom_session', sessionData = {} } = req.body;
        if (!message) {
            return res.status(400).json({ success: false, message: 'message is required' });
        }

        const startTime = Date.now();
        const result = await receptionistAgent.processChatMessage({
            message,
            sessionId,
            sessionData,
            currentDate: new Date()
        });
        const durationMs = Date.now() - startTime;

        return res.json({
            success: true,
            durationMs,
            reply: result.reply,
            reasoningSteps: result.reasoningSteps || [],
            state: result.state || {},
            card: result.card || null,
            suggestedSlots: result.suggestedSlots || []
        });
    } catch (err) {
        console.error('QA Custom Test Error:', err);
        return res.status(500).json({
            success: false,
            message: 'Error executing custom test',
            error: err.message
        });
    }
});

module.exports = router;
