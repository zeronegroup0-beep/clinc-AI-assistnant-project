const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const receptionistAgent = require('../services/receptionistAgent');
const appointmentService = require('../services/appointmentService');
const geminiAgent = require('../services/geminiAgent');

// In-memory session tracking on server side (also backed by client localStorage and data/chats.json)
const activeSessions = new Map();

// 2-minute cooldown map for disciplinary system (Strike 3)
const COOLDOWN_MAP = new Map();

/**
 * POST /api/chat
 * Main conversation endpoint for the Virtual Receptionist (with Live Monitor & Human Takeover support)
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

        const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'local';

        // Ensure unique, strictly isolated sessionId
        const effectiveSessionId = (sessionId && sessionId !== 'default_session')
            ? sessionId
            : 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);

        // Check if client IP or sessionId is currently in 2-minute cooldown (Strike 3)
        const now = Date.now();
        const ipUnblock = COOLDOWN_MAP.get(clientIp);
        const sessionUnblock = COOLDOWN_MAP.get(effectiveSessionId);
        const unblockAt = Math.max(ipUnblock || 0, sessionUnblock || 0);

        if (unblockAt > now) {
            const remainingSeconds = Math.ceil((unblockAt - now) / 1000);
            return res.status(429).json({
                success: false,
                blocked: true,
                remainingSeconds,
                message: `تم حظر جلستك مؤقتاً لمدة دقيقتين بسبب تكرار الألفاظ غير اللائقة. يرجى الانتظار ${remainingSeconds} ثانية قبل المحاولة مجدداً.`
            });
        }

        // Check if this session is currently taken over by a human secretary/admin
        const chatRecord = appointmentService.getChatSession(effectiveSessionId);
        if (chatRecord && chatRecord.isTakenOver) {
            // Log patient message to transcript
            chatRecord.history = chatRecord.history || [];
            chatRecord.history.push({
                sender: 'user',
                text: message,
                timestamp: new Date().toISOString()
            });
            chatRecord.lastMessage = message;
            chatRecord.lastUpdated = new Date();
            appointmentService.saveChatSession(effectiveSessionId, chatRecord);

            return res.json({
                success: true,
                sessionId: effectiveSessionId,
                reply: `تم استلام رسالتك يا فندم. معك الآن موظفة الاستقبال سارة وسترد عليك في الحال.`,
                isTakenOver: true,
                agentName: chatRecord.agentName || 'موظفة الاستقبال سارة',
                state: chatRecord.state || {}
            });
        }

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

        // Handle disciplinary Strike 3 termination & cooldown
        if (result.state?.abuseBlocked) {
            const cooldownUntil = Date.now() + (2 * 60 * 1000);
            COOLDOWN_MAP.set(clientIp, cooldownUntil);
            COOLDOWN_MAP.set(effectiveSessionId, cooldownUntil);

            // Completely purge abusive session from memory and persistent storage
            activeSessions.delete(effectiveSessionId);
            appointmentService.deleteChatSession(effectiveSessionId);

            return res.json({
                success: true,
                sessionId: effectiveSessionId,
                reply: result.reply,
                blocked: true,
                remainingSeconds: 120,
                state: result.state,
                reasoningSteps: result.reasoningSteps || []
            });
        }

        // Update strictly isolated server cache
        const updatedHistory = [
            ...(sessionRecord.history || []),
            { sender: 'user', text: message, timestamp: new Date().toISOString() },
            { sender: 'bot', text: result.reply, timestamp: new Date().toISOString() }
        ];

        activeSessions.set(effectiveSessionId, {
            state: result.state,
            history: updatedHistory
        });

        // Sync to persistent live monitor chats
        appointmentService.saveChatSession(effectiveSessionId, {
            patientName: result.state?.patientName || result.state?.userName || 'مريض زائر',
            phone: result.state?.patientPhone || null,
            doctor: result.state?.bookingDraft?.doctor || result.state?.pendingBooking?.doctor || 'عام',
            lastMessage: message,
            history: updatedHistory,
            state: result.state,
            takeoverRequested: Boolean(result.state?.takeoverRequested || result.state?.humanTakeover),
            isTakenOver: false
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
 * POST /api/chat/voice-transcribe
 * Transcribes audio note into text using Google Gemini 2.5 Flash
 */
router.post('/chat/voice-transcribe', async (req, res) => {
    try {
        const { audio, mimeType = 'audio/webm', language = 'ar' } = req.body;
        if (!audio) {
            return res.status(400).json({
                success: false,
                message: 'البيانات الصوتية مطلوبة للتفريغ'
            });
        }

        const result = await geminiAgent.transcribeAudioWithGemini({
            audioBase64: audio,
            mimeType,
            language
        });

        if (!result.success) {
            return res.status(502).json({
                success: false,
                message: result.error || 'فشل تفريغ الصوت عبر نموذج الذكاء الاصطناعي'
            });
        }

        return res.json({
            success: true,
            text: result.text,
            provider: result.provider,
            model: result.model
        });
    } catch (error) {
        console.error('Voice transcribe error:', error);
        return res.status(500).json({
            success: false,
            message: 'خطأ في معالجة الصوت: ' + error.message
        });
    }
});

/**
 * POST /api/chat/voice-message
 * Receives audio note, transcribes with Gemini Flash, and immediately processes with Receptionist Nora
 */
router.post('/chat/voice-message', async (req, res, next) => {
    try {
        const { audio, mimeType = 'audio/webm', language = 'ar', liveText, sessionId, sessionData = {} } = req.body;
        if (!audio && (!liveText || liveText.trim().length === 0)) {
            return res.status(400).json({ success: false, message: 'التسجيل الصوتي مطلوب' });
        }

        let transcribedText = '';

        // 1. Fast-track with browser real-time speech recognition if present (Drops latency from ~8s to ~1s!)
        if (liveText && typeof liveText === 'string' && liveText.trim().length >= 2) {
            transcribedText = liveText.trim();
        } else if (audio) {
            // Fallback to Gemini Flash audio transcription when browser speech recognition is unavailable
            const transcribeResult = await geminiAgent.transcribeAudioWithGemini({
                audioBase64: audio,
                mimeType,
                language
            });

            if (!transcribeResult.success || !transcribeResult.text) {
                return res.status(502).json({
                    success: false,
                    message: transcribeResult.error || 'تعذر استخراج النص من المقطع الصوتي'
                });
            }
            transcribedText = transcribeResult.text;
        } else {
            return res.status(400).json({ success: false, message: 'تعذر التعرف على الصوت' });
        }
        const effectiveSessionId = (sessionId && sessionId !== 'default_session')
            ? sessionId
            : 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);

        // 2. Check takeover
        const chatRecord = appointmentService.getChatSession(effectiveSessionId);
        if (chatRecord && chatRecord.isTakenOver) {
            chatRecord.history = chatRecord.history || [];
            chatRecord.history.push({
                sender: 'user',
                text: transcribedText,
                isVoice: true,
                timestamp: new Date().toISOString()
            });
            chatRecord.lastMessage = transcribedText;
            chatRecord.lastUpdated = new Date();
            appointmentService.saveChatSession(effectiveSessionId, chatRecord);

            return res.json({
                success: true,
                sessionId: effectiveSessionId,
                transcribedText,
                reply: `تم استلام رسالتك الصوتية يا فندم: "${transcribedText}". معك الآن موظفة الاستقبال سارة وسترد عليك في الحال.`,
                isTakenOver: true,
                agentName: chatRecord.agentName || 'موظفة الاستقبال سارة',
                state: chatRecord.state || {}
            });
        }

        // 3. Process with receptionist agent
        const sessionRecord = activeSessions.get(effectiveSessionId) || { state: {}, history: [] };
        const mergedState = { ...sessionRecord.state, ...sessionData };
        const currentDate = new Date();

        const agentResult = await receptionistAgent.processChatMessage({
            message: transcribedText,
            sessionId: effectiveSessionId,
            sessionData: mergedState,
            currentDate
        });

        // 4. Update session
        const updatedHistory = [
            ...(sessionRecord.history || []),
            { sender: 'user', text: transcribedText, isVoice: true, timestamp: new Date().toISOString() },
            { sender: 'bot', text: agentResult.reply, timestamp: new Date().toISOString() }
        ];

        activeSessions.set(effectiveSessionId, {
            state: agentResult.state,
            history: updatedHistory
        });

        appointmentService.saveChatSession(effectiveSessionId, {
            patientName: agentResult.state?.patientName || agentResult.state?.userName || 'مريض زائر',
            phone: agentResult.state?.patientPhone || null,
            doctor: agentResult.state?.bookingDraft?.doctor || agentResult.state?.pendingBooking?.doctor || 'عام',
            lastMessage: transcribedText,
            history: updatedHistory,
            state: agentResult.state,
            takeoverRequested: Boolean(agentResult.state?.takeoverRequested || agentResult.state?.humanTakeover),
            isTakenOver: false
        });

        return res.json({
            success: true,
            sessionId: effectiveSessionId,
            transcribedText,
            reply: agentResult.reply,
            reasoningSteps: agentResult.reasoningSteps || [],
            state: agentResult.state,
            card: agentResult.card || null,
            suggestedSlots: agentResult.suggestedSlots || []
        });
    } catch (error) {
        console.error('Voice message endpoint error:', error);
        next(error);
    }
});

/**
 * GET /api/chat/:sessionId/poll
 * Polling endpoint for frontend chat widget to fetch new human agent messages
 */
router.get('/chat/:sessionId/poll', (req, res) => {
    const { sessionId } = req.params;
    const session = appointmentService.getChatSession(sessionId);
    if (!session) {
        return res.json({ success: true, history: [], isTakenOver: false });
    }
    return res.json({
        success: true,
        isTakenOver: Boolean(session.isTakenOver),
        agentName: session.agentName || null,
        history: session.history || []
    });
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

/**
 * GET /api/schedule/weekly
 * Returns 7-day interactive weekly schedule matrix (Saturday to Friday) with doctors, slots, and bookings
 */
router.get('/schedule/weekly', async (req, res) => {
    try {
        const matrix = await appointmentService.getWeeklyScheduleMatrix(req.query.startDate);
        res.json({
            success: true,
            data: matrix
        });
    } catch (error) {
        console.error('Weekly schedule matrix error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * POST /api/appointments/manual-book
 * Secretary / Admin manual booking endpoint from Schedule Matrix or Reception Console
 */
router.post('/appointments/manual-book', async (req, res, next) => {
    try {
        const { patientName, phone, doctor, date, time, reason } = req.body;
        if (!patientName || !phone || !doctor || !date || !time) {
            return res.status(400).json({
                success: false,
                message: 'جميع بيانات الحجز مطلوبة (اسم المريض، الهاتف، الطبيب، التاريخ، والوقت)'
            });
        }
        const bookingResult = await appointmentService.bookAppointment({
            patientName,
            phone,
            doctor,
            date,
            time,
            reason: reason || 'حجز مباشر من موظفة الاستقبال',
            currentDate: new Date()
        });
        res.json(bookingResult);
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/today-doctors
 * Dynamically look up doctors working today with remaining open slots
 */
router.get('/today-doctors', (req, res) => {
    try {
        const todayData = appointmentService.getTodayAvailableDoctorsAndSlots(new Date());
        res.json({
            success: true,
            data: todayData
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
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
 * POST /api/appointments/cancel
 * Cancel an appointment using booking code (SC-XXXXX) or registered phone
 */
router.post('/appointments/cancel', async (req, res, next) => {
    try {
        const { bookingId, phone } = req.body;
        const result = await appointmentService.cancelAppointment({ bookingId, phone });
        res.json(result);
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/appointments/reschedule
 * Reschedule an appointment to a new date/time
 */
router.post('/appointments/reschedule', async (req, res, next) => {
    try {
        const { bookingId, phone, newDate, newTime } = req.body;
        const result = await appointmentService.rescheduleAppointment({
            bookingId,
            phone,
            newDate,
            newTime,
            currentDate: new Date()
        });
        res.json(result);
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
 * GET /api/admin/blacklist
 * Dynamic blacklist manager: view words
 */
router.get('/admin/blacklist', (req, res) => {
    const list = appointmentService.getBlacklist();
    res.json({
        success: true,
        count: list.length,
        data: list
    });
});

/**
 * POST /api/admin/blacklist
 * Dynamic blacklist manager: add word
 */
router.post('/admin/blacklist', (req, res) => {
    const { word } = req.body;
    if (!word || typeof word !== 'string' || !word.trim()) {
        return res.status(400).json({ success: false, message: 'الكلمة المراد إضافتها مطلوبة' });
    }
    const updated = appointmentService.addBlacklistWord(word.trim());
    res.json({
        success: true,
        message: `تمت إضافة الكلمة "${word.trim()}" إلى القائمة السوداء بنجاح`,
        data: updated
    });
});

/**
 * DELETE /api/admin/blacklist/:word
 * Dynamic blacklist manager: remove word
 */
router.delete('/admin/blacklist/:word', (req, res) => {
    const { word } = req.params;
    const updated = appointmentService.removeBlacklistWord(decodeURIComponent(word));
    res.json({
        success: true,
        message: `تم حذف الكلمة من القائمة السوداء بنجاح`,
        data: updated
    });
});

/**
 * GET /api/admin/chats
 * Live Chat Monitor: view active conversations
 */
router.get('/admin/chats', (req, res) => {
    const sessions = appointmentService.getChatSessions();
    res.json({
        success: true,
        count: sessions.length,
        data: sessions
    });
});

/**
 * GET /api/admin/chats/:sessionId
 * Live Chat Monitor: view detailed conversation transcript
 */
router.get('/admin/chats/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    const session = appointmentService.getChatSession(sessionId);
    if (!session) {
        return res.status(404).json({ success: false, message: 'المحادثة غير موجودة' });
    }
    res.json({
        success: true,
        data: session
    });
});

/**
 * POST /api/admin/chats/:sessionId/takeover
 * Live Chat Monitor: Secretary / Admin Human Takeover Toggle
 */
router.post('/admin/chats/:sessionId/takeover', (req, res) => {
    const { sessionId } = req.params;
    const { isTakenOver = true, agentName = 'موظفة الاستقبال سارة' } = req.body;

    const updated = appointmentService.setHumanTakeover(sessionId, Boolean(isTakenOver), agentName);
    res.json({
        success: true,
        message: isTakenOver ? `تم استلام المحادثة بنجاح من قِبل ${agentName}` : 'تمت إعادة المحادثة للرد الآلي (نورا)',
        data: updated
    });
});

/**
 * POST /api/admin/chats/:sessionId/message
 * Live Chat Monitor: Secretary sends message directly to patient
 */
router.post('/admin/chats/:sessionId/message', (req, res) => {
    const { sessionId } = req.params;
    const { message, agentName = 'موظفة الاستقبال سارة' } = req.body;

    if (!message || !message.trim()) {
        return res.status(400).json({ success: false, message: 'نص الرسالة مطلوب' });
    }

    const newMsg = appointmentService.addHumanMessage(sessionId, message.trim(), agentName);
    res.json({
        success: true,
        message: 'تم إرسال الرسالة إلى المريض بنجاح',
        data: newMsg
    });
});

/**
 * GET /api/ai/status
 * Check LLM integration status (Gemini / OpenAI)
 */
router.get('/ai/status', (req, res) => {
    res.json({
        success: true,
        hasGeminiKey: geminiAgent.isGeminiEnabled(),
        hasOpenAIKey: geminiAgent.isOpenAIEnabled(),
        isLLMEnabled: geminiAgent.isLLMEnabled(),
        activeProvider: geminiAgent.getActiveProvider()
    });
});

/**
 * POST /api/ai/configure
 * Dynamically configure Gemini or OpenAI API key with live validation
 */
router.post('/ai/configure', async (req, res) => {
    const { provider = 'gemini', key = '' } = req.body;
    if (!key || typeof key !== 'string' || key.trim().length < 5) {
        return res.status(400).json({ success: false, message: 'مفتاح API غير صالح' });
    }

    // Validate key against provider
    const validation = await geminiAgent.validateAPIKey({ provider, key });
    if (!validation.valid) {
        return res.status(400).json({
            success: false,
            message: validation.error,
            details: validation
        });
    }

    const result = geminiAgent.updateAPIKey({ provider, key });
    res.json({
        success: true,
        message: `تم التحقق من مفتاح ${provider.toUpperCase()} وحفظه بنجاح، وتفعيل الصياغة اللغوية الذكية الفورية!`,
        data: result
    });
});

/**
 * GET /api/dev/logs
 * Retrieve latest AI self-play QA logs & evaluation metrics
 */
router.get('/dev/logs', (req, res) => {
    try {
        const qaLogsPath = path.join(__dirname, '..', 'data', 'qa_logs.json');
        if (fs.existsSync(qaLogsPath)) {
            const raw = fs.readFileSync(qaLogsPath, 'utf8');
            const data = JSON.parse(raw);
            return res.json({ success: true, data });
        }
        res.json({
            success: true,
            data: {
                summary: { totalRuns: 0, passed: 0, failed: 0, passRate: '0%', activeModels: [], durationMs: 0 },
                sessions: []
            }
        });
    } catch (err) {
        console.error('Failed to load dev logs:', err);
        res.status(500).json({ success: false, message: 'فشل استرجاع سجلات الاختبارات الذاتية', error: err.message });
    }
});

/**
 * POST /api/dev/run-simulation
 * Trigger full AI Self-Play simulation suite against Nora
 */
router.post('/dev/run-simulation', async (req, res) => {
    try {
        const selfPlayEngine = require('../scripts/self_play_engine');
        const results = await selfPlayEngine.runSelfPlaySuite();
        res.json({
            success: true,
            message: `تم تشغيل محاكاة اللعب الذاتي بنجاح (${results.summary.passed}/${results.summary.totalRuns} سيناريوهات ناجحة)`,
            data: results
        });
    } catch (err) {
        console.error('Simulation execution failed:', err);
        res.status(500).json({ success: false, message: 'فشل تنفيذ محاكاة اللعب الذاتي', error: err.message });
    }
});

/**
 * GET /api/dev/memory-bank
 * Retrieve gold standard scenarios from the Memory Bank
 */
router.get('/dev/memory-bank', (req, res) => {
    try {
        const memoryBankPath = path.join(__dirname, '..', 'data', 'memory_bank.json');
        if (fs.existsSync(memoryBankPath)) {
            const raw = fs.readFileSync(memoryBankPath, 'utf8');
            const data = JSON.parse(raw);
            return res.json({ success: true, count: data.length, data });
        }
        res.json({ success: true, count: 0, data: [] });
    } catch (err) {
        console.error('Failed to load memory bank:', err);
        res.status(500).json({ success: false, message: 'فشل استرجاع بنك الذاكرة المرجعي', error: err.message });
    }
});

module.exports = router;
