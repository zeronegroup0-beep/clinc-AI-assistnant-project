const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const appointmentService = require('./appointmentService');

let GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
let OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const CLINIC_SYSTEM_INSTRUCTION = `
You are "Nora" (نورا), the warm, empathetic, and highly professional AI medical receptionist at "Smart Clinic" (سمارت كلينك).
The clinic is accredited by ISO 9001:2015, JCI International, and the Egyptian Ministry of Health (#84192/ج).

Doctors & Schedules:
1. Dr. Ahmed Sherif (د. أحمد شريف) - Dentistry (طب وجراحة الأسنان)
   Branches: Damanhour & Alexandria (فرع دمنهور وفرع الإسكندرية)
   Days: Sat, Mon, Wed (السبت، الإثنين، الأربعاء) from 2:00 PM to 9:00 PM. Price: 350 EGP.
2. Dr. Sara Mahmoud (د. سارة محمود) - Dermatology & Laser (الجلدية والتجميل والليزر)
   Branch: Damanhour ONLY (فرع دمنهور فقط)
   Days: Sun, Tue, Thu (الأحد، الثلاثاء، الخميس) from 1:00 PM to 8:00 PM. Price: 300 EGP.
3. Dr. Hossam Fathi (د. حسام فتحي) - Internal Medicine & Cardiology (أمراض الباطنة والقلب)
   Branch: Alexandria ONLY (فرع الإسكندرية فقط)
   Days: Sat to Thu (السبت إلى الخميس) from 3:00 PM to 10:00 PM. Price: 280 EGP.
4. Dr. Maryam Nabil (د. مريم نبيل) - Ophthalmology & LASIK (طب وجراحة العيون)
   Branch: Alexandria ONLY (فرع الإسكندرية فقط)
   Days: Sun, Tue, Thu (الأحد، الثلاثاء، الخميس) from 4:00 PM to 9:00 PM. Price: 260 EGP.

Branch Distribution & Compound Query Rules:
- فرع دمنهور (Damanhour Branch): شارع عبد السلام الشاذلي، دمنهور. الأطباء المتاحون في هذا الفرع هم فقط: د. أحمد شريف (أسنان) و د. سارة محمود (جلدية).
- فرع الإسكندرية (Alexandria Branch): طريق الجيش، ستانلي، الإسكندرية. الأطباء المتاحون في هذا الفرع هم فقط: د. أحمد شريف (أسنان)، د. حسام فتحي (باطنة وقلب)، و د. مريم نبيل (عيون).
- COMPOUND QUERIES (Branch + Date/Today):
  When asked about who is available at a specific branch on a specific day (e.g. "مين موجود في فرع دمنهور النهاردة؟" or "دكاترة اسكندرية بكرة"):
  * Look up the exact day (e.g. Wednesday 23 Sept 2026 is "الأربعاء").
  * Filter for doctors of that branch who work on that day (e.g. on Wednesday in Damanhour: Dr. Ahmed Sherif is on duty; Dr. Sara Mahmoud works Sun, Tue, Thu so she is not on duty).
  * State clearly who is on duty today at that branch, their working hours, and offer to book them.
  * NEVER list all clinic doctors or doctors from other branches!

Tone & Formulation Rules:
- If patient writes in Arabic: use natural, polite, respectful Egyptian Arabic ("يا فندم"، "نورتنا"، "تحت أمر حضرتك"، "ألف سلامة عليك").
- If patient writes in English: use fluent, professional, empathetic healthcare English.
- NEVER sound robotic or rigid.
- NEVER alter or omit medical facts, doctor names, dates, times, prices, or 5-digit booking codes.

Reception Flow & Interaction Rules:
- DO NOT ask for or force the patient's name upon initial greeting or general questions. Answer inquiries about doctors, specialties, branches, or prices directly and warmly.
- Only request the patient's full triple name and 11-digit mobile number when finalizing an appointment booking or waitlist entry.
- If the patient requests to contact administration, the secretary, customer service, or a human (e.g. "عايز اتواصل مع الادارة", "حولني للسكرتارية", "speak to human"), call tool "request_human_takeover" immediately and reassure them that front-desk staff is being connected.
`;

const GEMINI_TOOLS = [
    {
        functionDeclarations: [
            {
                name: 'check_availability',
                description: 'Check available appointment slots for a doctor on a specific date',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        doctor: { type: 'STRING', description: 'Doctor name or specialty' },
                        date: { type: 'STRING', description: 'Date description (e.g. Monday, الإثنين)' },
                        time: { type: 'STRING', description: 'Optional specific time' }
                    },
                    required: ['doctor', 'date']
                }
            },
            {
                name: 'book_appointment',
                description: 'Book and confirm a clinic appointment after patient provided full triple name, phone, doctor, date, and time',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        doctor: { type: 'STRING', description: 'Doctor name' },
                        date: { type: 'STRING', description: 'Appointment date' },
                        time: { type: 'STRING', description: 'Appointment time' },
                        patientName: { type: 'STRING', description: 'Full triple name of the patient' },
                        patientPhone: { type: 'STRING', description: '11-digit Egyptian mobile phone number' }
                    },
                    required: ['doctor', 'date', 'time', 'patientName', 'patientPhone']
                }
            },
            {
                name: 'cancel_appointment',
                description: 'Cancel an appointment using booking reference code or registered phone number',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        bookingId: { type: 'STRING', description: '5-digit booking reference code' },
                        phone: { type: 'STRING', description: 'Registered mobile phone number' }
                    }
                }
            },
            {
                name: 'add_to_waitlist',
                description: 'Register patient on priority waitlist when requested slot or day is fully booked',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        doctor: { type: 'STRING', description: 'Doctor name' },
                        requestedDate: { type: 'STRING', description: 'Requested date' },
                        requestedTime: { type: 'STRING', description: 'Requested time' },
                        patientName: { type: 'STRING', description: 'Full triple name of patient' },
                        phone: { type: 'STRING', description: 'Mobile phone number' }
                    },
                    required: ['doctor', 'patientName', 'phone']
                }
            },
            {
                name: 'request_human_takeover',
                description: 'Transfer the chat session to the front-desk human secretary upon patient request',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        reason: { type: 'STRING', description: 'Reason for requesting human takeover' }
                    }
                }
            }
        ]
    }
];

function isGeminiEnabled() {
    return Boolean(GEMINI_API_KEY && GEMINI_API_KEY.trim().length > 10);
}

function isOpenAIEnabled() {
    return Boolean(OPENAI_API_KEY && OPENAI_API_KEY.trim().length > 10);
}

function isLLMEnabled() {
    return isGeminiEnabled() || isOpenAIEnabled();
}

function getActiveProvider() {
    if (isGeminiEnabled()) return 'gemini';
    if (isOpenAIEnabled()) return 'openai';
    return 'none';
}

function updateAPIKey({ provider, key }) {
    if (provider === 'gemini') {
        GEMINI_API_KEY = key ? key.trim() : '';
        process.env.GEMINI_API_KEY = GEMINI_API_KEY;
    } else if (provider === 'openai') {
        OPENAI_API_KEY = key ? key.trim() : '';
        process.env.OPENAI_API_KEY = OPENAI_API_KEY;
    }

    // Persist to .env file
    try {
        const envPath = path.join(__dirname, '../.env');
        let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
        const keyVar = provider === 'gemini' ? 'GEMINI_API_KEY' : 'OPENAI_API_KEY';
        const regex = new RegExp(`^${keyVar}=.*$`, 'm');
        if (regex.test(content)) {
            content = content.replace(regex, `${keyVar}=${key.trim()}`);
        } else {
            content += `\n${keyVar}=${key.trim()}\n`;
        }
        fs.writeFileSync(envPath, content, 'utf8');
    } catch (e) {
        console.warn('Could not persist API key to .env:', e.message);
    }

    return {
        success: true,
        provider,
        hasGeminiKey: isGeminiEnabled(),
        hasOpenAIKey: isOpenAIEnabled(),
        activeProvider: getActiveProvider()
    };
}

/**
 * Validate an API key directly against Google or OpenAI API
 */
async function validateAPIKey({ provider, key }) {
    if (!key || typeof key !== 'string') {
        return { valid: false, error: 'مفتاح API فارغ أو غير صالح' };
    }
    const cleanKey = key.trim();
    if (provider === 'gemini') {
        if (!cleanKey.startsWith('AIzaSy')) {
            return {
                valid: false,
                error: 'تنبيه هام: مفاتيح Google Gemini (AI Studio) تبدأ دائماً بالبادئة "AIzaSy...". المفتاح الذي تم إدخاله لا يبدو مفتاح Google AI Studio صالحاً، وقد يؤدي إلى خطأ API_KEY_INVALID.'
            };
        }
        try {
            const testUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`;
            const res = await fetch(testUrl);
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                const errMsg = errData.error?.message || `HTTP ${res.status}`;
                return {
                    valid: false,
                    error: `فشل التحقق من المفتاح عبر Google API: ${errMsg}`
                };
            }
            return { valid: true, message: 'تم التحقق بنجاح! مفتاح Google Gemini صالح ومفعل ويعمل.' };
        } catch (e) {
            return { valid: false, error: `تعذر الوصول إلى سيرفر Google للتحقق: ${e.message}` };
        }
    } else if (provider === 'openai') {
        if (!cleanKey.startsWith('sk-')) {
            return {
                valid: false,
                error: 'تنبيه: مفاتيح OpenAI تبدأ دائماً بـ "sk-".'
            };
        }
        try {
            const testUrl = 'https://api.openai.com/v1/models';
            const res = await fetch(testUrl, {
                headers: { 'Authorization': `Bearer ${cleanKey}` }
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                return {
                    valid: false,
                    error: `فشل التحقق من مفتاح OpenAI: ${errData.error?.message || res.status}`
                };
            }
            return { valid: true, message: 'تم التحقق بنجاح من مفتاح OpenAI!' };
        } catch (e) {
            return { valid: false, error: `تعذر الاتصال بـ OpenAI: ${e.message}` };
        }
    }
    return { valid: false, error: 'مزود الذكاء الاصطناعي غير مدعوم' };
}

/**
 * Execute tool calls locally against appointmentService
 */
async function executeGeminiTool(name, args, state = {}, currentDate = new Date()) {
    if (name === 'check_availability') {
        return await appointmentService.checkAvailability({
            doctor: args.doctor,
            date: args.date,
            time: args.time || null,
            currentDate
        });
    }
    if (name === 'book_appointment') {
        const doc = args.doctor || args.doctor_name || state.bookingDraft?.doctor || state.doctor;
        const dDate = args.date || state.bookingDraft?.date || state.bookingDraft?.dateStr;
        const dTime = args.time || state.bookingDraft?.time;
        const pName = args.patientName || args.patient_name || state.patientName || state.userName || 'المريض';
        const pPhone = args.patientPhone || args.phone_number || args.phone || state.patientPhone;

        return await appointmentService.bookAppointment({
            doctor: doc,
            date: dDate,
            time: dTime,
            patientName: pName,
            patientPhone: pPhone,
            phone_number: pPhone,
            phone: pPhone,
            currentDate
        });
    }
    if (name === 'cancel_appointment') {
        return await appointmentService.cancelAppointment({
            bookingId: args.bookingId,
            phone: args.phone
        });
    }
    if (name === 'add_to_waitlist') {
        return await appointmentService.addToWaitlist({
            doctor: args.doctor,
            requestedDate: args.requestedDate,
            requestedTime: args.requestedTime,
            patientName: args.patientName,
            phone: args.phone
        });
    }
    if (name === 'request_human_takeover') {
        state.humanTakeover = true;
        state.takeoverRequested = true;
        state.takeoverRequestedBy = 'patient';
        state.status = 'awaiting_human';
        return {
            success: true,
            status: 'awaiting_human',
            message: 'Human takeover activated. Secretary notified.'
        };
    }
    return { error: 'Unknown tool' };
}

/**
 * Reformulate Nora's reply using Gemini or OpenAI for natural, warm linguistic phrasing (الصياغة اللغوية)
 */
async function reformulateWithLLM({ userMessage, draftReply, state = {}, language = 'ar', fewShotExamples = [] }) {
    if (!isLLMEnabled()) {
        return draftReply;
    }

    // Skip reformulation for short confirmations, emergencies, booking codes, or card triggers
    if (!draftReply || draftReply.length < 10) return draftReply;
    if (state.emergency || draftReply.includes('123') || draftReply.includes('طوارئ') || draftReply.includes('إسعاف')) return draftReply;
    if (state.takeoverRequested || draftReply.includes('السكرتارية')) return draftReply;
    if (draftReply.includes('SC-') || draftReply.includes('WL-')) return draftReply;

    const isEng = language === 'en';
    const instruction = isEng 
        ? `You are Nora, the receptionist at Smart Clinic. Rephrase the following clinic response naturally and warmly in professional English. Keep all medical data, doctor names, times, prices, and 5-digit booking codes EXACTLY as provided without changes.`
        : `أنتِ "نورا" موظفة الاستقبال في سمارت كلينك. أعد صياغة هذا الرد بلباقة مصرية دافئة وطبيعية جداً. حافظي تماماً وبدقة على أسماء الأطباء، المواعيد، الأسعار، التواريخ، وأكواد الحجز الخماسية دون أي تغيير في الحقائق.`;

    let fewShotSection = '';
    if (Array.isArray(fewShotExamples) && fewShotExamples.length > 0) {
        fewShotSection = `\n\n[معايير بنك الذاكرة الذهبية - Few-Shot Gold Standards]:\n` +
            fewShotExamples.map((ex, idx) => 
                `مثال ${idx + 1} (${ex.scenario}):\n` +
                `- مدخل المريض: "${ex.user_input}"\n` +
                `- الإجراء والأسلوب المطلوب: ${ex.expected_action}\n` +
                `- كلمات الاستجابة النموذجية: ${(ex.ideal_response_keywords || []).join('، ')}`
            ).join('\n\n');
    }

    const prompt = `${instruction}${fewShotSection}\n\nرسالة المريض الحالية: "${userMessage}"\nمسودة الرد من النظام: "${draftReply}"\n\nالرد المصاغ النهائي فقط (بدون أي شروحات أو علامات تنصيص):`;

    try {
        if (isGeminiEnabled()) {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY.trim()}`;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ role: 'user', parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.3, maxOutputTokens: 500 }
                })
            });
            if (res.ok) {
                const data = await res.json();
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text && text.trim().length > 15) {
                    if (draftReply.includes('أحمد شريف') && !cleanText.includes('أحمد')) return draftReply;
                    if (draftReply.includes('سارة محمود') && !cleanText.includes('سارة')) return draftReply;
                    if (draftReply.includes('حسام فتحي') && !cleanText.includes('حسام')) return draftReply;
                    if (draftReply.includes('مريم نبيل') && !cleanText.includes('مريم')) return draftReply;
                    if (draftReply.includes('350') && !cleanText.includes('350')) return draftReply;
                    if (draftReply.includes('كود الحجز') && !cleanText.includes('كود')) return draftReply;
                    if (draftReply.includes('تم تأكيد') && !cleanText.includes('تأكيد')) return draftReply;
                    return cleanText;
                }
            }
        } else if (isOpenAIEnabled()) {
            const url = 'https://api.openai.com/v1/chat/completions';
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENAI_API_KEY.trim()}`
                },
                body: JSON.stringify({
                    model: OPENAI_MODEL,
                    messages: [
                        { role: 'system', content: CLINIC_SYSTEM_INSTRUCTION },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.4,
                    max_tokens: 500
                })
            });
            if (res.ok) {
                const data = await res.json();
                const text = data.choices?.[0]?.message?.content;
                if (text && text.trim().length > 5) {
                    return text.trim();
                }
            }
        }
    } catch (err) {
        console.warn('LLM reformulation failed, using draft reply:', err.message);
    }

    return draftReply;
}

/**
 * Call Gemini Generative AI Agent with Function Calling (Autonomous Mode)
 */
async function processWithGemini({ message, history = [], state = {}, currentDate = new Date() }) {
    if (!isGeminiEnabled()) {
        return null;
    }

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY.trim()}`;

        const contents = [];
        if (Array.isArray(history) && history.length > 0) {
            history.slice(-6).forEach(item => {
                if (item.sender === 'user' || item.role === 'user') {
                    contents.push({ role: 'user', parts: [{ text: item.text || item.content || '' }] });
                } else if (item.sender === 'bot' || item.role === 'model') {
                    contents.push({ role: 'model', parts: [{ text: item.text || item.content || '' }] });
                }
            });
        }

        contents.push({ role: 'user', parts: [{ text: message }] });

        const payload = {
            contents,
            systemInstruction: {
                parts: [{ text: CLINIC_SYSTEM_INSTRUCTION }]
            },
            tools: GEMINI_TOOLS,
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 800
            }
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) return null;

        const data = await response.json();
        const candidate = data.candidates?.[0];
        if (!candidate || !candidate.content) return null;

        const parts = candidate.content.parts || [];
        const functionCallPart = parts.find(p => p.functionCall);

        let finalReply = '';
        let card = null;

        if (functionCallPart) {
            const { name, args } = functionCallPart.functionCall;
            const toolResult = await executeGeminiTool(name, args, state, currentDate);

            if (name === 'book_appointment' && toolResult.success) {
                card = {
                    type: 'booking_confirmed',
                    bookingId: toolResult.bookingId,
                    booking: {
                        doctor: toolResult.doctor,
                        date: toolResult.dateStr,
                        time: toolResult.timeStr,
                        patientName: toolResult.patientName,
                        phone: toolResult.phone
                    }
                };
            }

            contents.push(candidate.content);
            contents.push({
                role: 'user',
                parts: [{
                    functionResponse: {
                        name,
                        response: { output: toolResult }
                    }
                }]
            });

            const followUpRes = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents,
                    systemInstruction: { parts: [{ text: CLINIC_SYSTEM_INSTRUCTION }] }
                })
            });

            if (followUpRes.ok) {
                const followUpData = await followUpRes.json();
                const followUpPart = followUpData.candidates?.[0]?.content?.parts?.find(p => p.text);
                if (followUpPart && followUpPart.text) {
                    finalReply = followUpPart.text.trim();
                }
            }

            if (!finalReply) {
                finalReply = toolResult.message || 'تمت العملية بنجاح.';
            }
        } else {
            const textPart = parts.find(p => p.text);
            finalReply = textPart ? textPart.text.trim() : '';
        }

        return {
            reply: finalReply,
            card,
            state,
            reasoningSteps: [`Generative AI Agent (${GEMINI_MODEL}): Executed grounded clinic context`]
        };
    } catch (err) {
        console.warn('Gemini Agent exception, falling back:', err.message);
        return null;
    }
}

/**
 * Transcribe recorded speech audio using Gemini Multimodal Audio (Gemini Flash)
 */
async function transcribeAudioWithGemini({ audioBase64, mimeType = 'audio/webm', language = 'ar' }) {
    if (!audioBase64 || typeof audioBase64 !== 'string') {
        return { success: false, error: 'البيانات الصوتية غير صالحة أو فارغة' };
    }

    let rawBase64 = audioBase64.trim();
    let detectedMime = mimeType || 'audio/webm';

    if (rawBase64.includes(';base64,')) {
        const parts = rawBase64.split(';base64,');
        const mimeMatch = parts[0].match(/data:(.*?)(;|$)/);
        if (mimeMatch && mimeMatch[1]) {
            detectedMime = mimeMatch[1];
        }
        rawBase64 = parts[1];
    }

    // Strip codecs parameters for Gemini inline_data (e.g. "audio/webm;codecs=opus" -> "audio/webm")
    if (detectedMime.includes(';')) {
        detectedMime = detectedMime.split(';')[0].trim();
    }

    if (!isGeminiEnabled()) {
        return { 
            success: false, 
            error: 'Google Gemini API key is not configured. Please use browser speech recognition or configure an API key in .env' 
        };
    }

    const isAr = language !== 'en';
    const transcriptionPrompt = isAr
        ? 'أنت مفرغ صوتي محترف ومترجم لعيادة طبية راقية. استمع لهذا المقطع الصوتي بدقة وفرّغه حرفياً إلى نص باللغة العربية (سواء كانت فصحى أو لهجة مصرية عامية محكية مثل: "عايز احجز كشف"، "دكتور أحمد"، "مواعيد العيادة"، "عاوز اكلم السكرتارية"). اكتب فقط النص المنطوق بدون أي مقدمات أو تحيات أو شروحات أو علامات تنصيص.'
        : 'You are an accurate audio transcriber for a medical clinic. Transcribe the spoken audio verbatim in English without any preamble, explanation, or quotation marks. Output only the transcribed speech text.';

    try {
        const modelToUse = GEMINI_MODEL || 'gemini-3.6-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${GEMINI_API_KEY.trim()}`;

        const payload = {
            contents: [
                {
                    role: 'user',
                    parts: [
                        {
                            inline_data: {
                                mime_type: detectedMime,
                                data: rawBase64
                            }
                        },
                        {
                            text: transcriptionPrompt
                        }
                    ]
                }
            ],
            generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 600
            }
        };

        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            const errMsg = errData.error?.message || `HTTP ${res.status}`;
            console.warn('Gemini audio transcription error:', errMsg);
            return { success: false, error: errMsg };
        }

        const data = await res.json();
        const transcribedText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

        return {
            success: true,
            text: transcribedText,
            provider: 'gemini',
            model: modelToUse
        };
    } catch (err) {
        console.error('Gemini audio transcription exception:', err);
        return { success: false, error: err.message };
    }
}

module.exports = {
    processWithGemini,
    reformulateWithLLM,
    transcribeAudioWithGemini,
    isGeminiEnabled,
    isOpenAIEnabled,
    isLLMEnabled,
    getActiveProvider,
    updateAPIKey,
    validateAPIKey,
    executeGeminiTool,
    CLINIC_SYSTEM_INSTRUCTION
};
