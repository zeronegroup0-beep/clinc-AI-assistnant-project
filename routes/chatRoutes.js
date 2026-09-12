const express = require('express');
const router = express.Router();
const receptionistAgent = require('../services/receptionistAgent');
const appointmentService = require('../services/appointmentService');

// In-memory session tracking on server side (also backed by client localStorage)
const activeSessions = new Map();

/**
 * POST /api/chat
 * Main conversation endpoint for the Virtual Receptionist
 */
router.post('/chat', async (req, res, next) => {
    try {
        const { message, sessionId, sessionData = {} } = req.body;

        if (!message || typeof message !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'رسالة المحادثة مطلوبة'
            });
        }

        // Ensure unique, strictly isolated sessionId
        const effectiveSessionId = (sessionId && sessionId !== 'default_session')
            ? sessionId
            : 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);

        // Retrieve isolated session state
        const sessionRecord = activeSessions.get(effectiveSessionId) || { state: {}, history: [] };
        const mergedState = { ...sessionRecord.state, ...sessionData };

        // Dynamic Current Date Injection
        const currentDate = new Date();

        // Process message through receptionist agent
        const result = await receptionistAgent.processChatMessage({
            message,
            sessionId: effectiveSessionId,
            sessionData: mergedState,
            currentDate
        });

        // Update strictly isolated server cache
        activeSessions.set(effectiveSessionId, {
            state: result.state,
            history: [
                ...(sessionRecord.history || []),
                { user: message, bot: result.reply, timestamp: Date.now() }
            ]
        });

        return res.json({
            success: true,
            sessionId: effectiveSessionId,
            reply: result.reply,
            reasoningSteps: result.reasoningSteps || [],
            state: result.state,
            card: result.card || null,
            suggestedSlots: result.suggestedSlots || []
        });
    } catch (error) {
        console.error('Chat error:', error);
        next(error);
    }
});

/**
 * GET /api/appointments
 * List appointments for admin dashboard
 */
router.get('/appointments', async (req, res, next) => {
    try {
        const appointments = await appointmentService.getAllAppointments();
        res.json({
            success: true,
            count: appointments.length,
            data: appointments
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/waitlist
 * List waitlist records for admin dashboard
 */
router.get('/waitlist', async (req, res, next) => {
    try {
        const waitlist = await appointmentService.getAllWaitlist();
        res.json({
            success: true,
            count: waitlist.length,
            data: waitlist
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/chat/reset
 * Reset and clear isolated session state
 */
router.post('/chat/reset', (req, res) => {
    const { sessionId } = req.body;
    if (sessionId && activeSessions.has(sessionId)) {
        activeSessions.delete(sessionId);
    }
    const newSessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    activeSessions.set(newSessionId, { state: {}, history: [] });

    res.json({
        success: true,
        newSessionId,
        message: 'Session cleared and isolated successfully'
    });
});

module.exports = router;
