import { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, X, Minus, RotateCcw, Send, Sparkles, 
  CheckCircle2, Clock, Calendar, User, Phone, AlertCircle, Loader2, Bot,
  UserCheck, ShieldCheck, Mic, Trash2, Check, Radio
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const STORAGE_KEY = 'smart_clinic_receptionist_session_v4';
const API_URL = import.meta.env.VITE_API_URL || '/api';

export default function FloatingChatWidget({ externalTriggerMessage, onClearTrigger }) {
  const { language, dir, t } = useLanguage();
  const isAr = language === 'ar';

  const getInitialMessage = () => ({
    id: 'init-1',
    sender: 'bot',
    text: isAr 
      ? 'أهلاً بحضرتك في سمارت كلينك! أنا "نورا" موظفة الاستقبال الطبية الذكية. يشرفني أعرف اسم حضرتك الثلاثي الكريم عشان أقدر أساعدك؟'
      : 'Welcome to Smart Clinic! I am Nora, your intelligent medical receptionist. May I have your full three-part name so I can best assist you?',
    timestamp: new Date().toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })
  });

  // Session Persistence State
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([getInitialMessage()]);
  const [sessionId, setSessionId] = useState('');
  const [sessionState, setSessionState] = useState({ awaitingName: true });
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [reasoning, setReasoning] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [isHumanTakeover, setIsHumanTakeover] = useState(false);
  const [humanAgentName, setHumanAgentName] = useState(null);

  // Voice Note & Speech-to-Text State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [voiceNotice, setVoiceNotice] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const recognitionRef = useRef(null);
  const streamRef = useRef(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Keep input focused when widget opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // 1. Load Session from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.sessionId) setSessionId(parsed.sessionId);
        if (parsed.messages && parsed.messages.length > 0) setMessages(parsed.messages);
        if (parsed.sessionState && Object.keys(parsed.sessionState).length > 0) {
          setSessionState(parsed.sessionState);
        } else {
          setSessionState({ awaitingName: true });
        }
        if (typeof parsed.isOpen === 'boolean') setIsOpen(parsed.isOpen);
      } else {
        const newId = 'session_' + Math.random().toString(36).substring(2, 10);
        setSessionId(newId);
        setSessionState({ awaitingName: true });
      }
    } catch (e) {
      console.warn('Could not restore chat session from localStorage:', e);
      setSessionId('session_' + Date.now());
      setSessionState({ awaitingName: true });
    }
  }, []);

  // 2. Persist Session to localStorage whenever relevant state changes
  useEffect(() => {
    if (!sessionId) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        sessionId,
        messages,
        sessionState,
        isOpen
      }));
    } catch (e) {
      console.warn('Failed to persist session to localStorage:', e);
    }
    scrollToBottom();
  }, [sessionId, messages, sessionState, isOpen]);

  // 3. Poll for human takeover and human agent messages
  useEffect(() => {
    if (!sessionId) return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/chat/${sessionId}/poll`).then(r => r.json());
        if (res.success) {
          setIsHumanTakeover(Boolean(res.isTakenOver));
          setHumanAgentName(res.agentName);

          // Check if any human messages exist that aren't displayed yet
          if (res.history && Array.isArray(res.history)) {
            const humanMsgs = res.history.filter(m => m.sender === 'human_agent');
            if (humanMsgs.length > 0) {
              setMessages(prev => {
                const currentTexts = new Set(prev.map(p => p.text));
                const newOnes = [];
                for (const hm of humanMsgs) {
                  if (!currentTexts.has(hm.text)) {
                    newOnes.push({
                      id: 'human-' + Date.now() + '-' + Math.random(),
                      sender: 'bot',
                      isHumanAgent: true,
                      agentName: hm.agentName || (isAr ? 'موظفة الاستقبال سارة' : 'Receptionist Sarah'),
                      text: hm.text,
                      timestamp: new Date().toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })
                    });
                  }
                }
                return newOnes.length > 0 ? [...prev, ...newOnes] : prev;
              });
            }
          }
        }
      } catch (e) {
        // Silent poll error
      }
    }, 4000);

    return () => clearInterval(pollInterval);
  }, [sessionId, isAr]);

  // Handle external trigger (e.g. from service booking buttons)
  useEffect(() => {
    if (externalTriggerMessage) {
      setIsOpen(true);
      sendMessage(externalTriggerMessage);
      if (onClearTrigger) onClearTrigger();
    }
  }, [externalTriggerMessage]);

  // Cleanup media recording streams on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Clear or Reset the Chat Session with Server Isolation
  const handleReset = async () => {
    let newId = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    try {
      const res = await fetch(`${API_URL}/chat/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });
      const data = await res.json();
      if (data.newSessionId) {
        newId = data.newSessionId;
      }
    } catch (err) {
      console.warn('Server reset failed:', err);
    }

    setSessionId(newId);
    setMessages([getInitialMessage()]);
    setSessionState({ awaitingName: true });
    setInput('');
    setReasoning('');
    setIsHumanTakeover(false);
    setVoiceNotice(null);
    localStorage.removeItem(STORAGE_KEY);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // Send message function - Keeps input focused!
  const sendMessage = async (textToSend) => {
    const text = (textToSend || input).trim();
    if (!text || isTyping || isTranscribing) return;

    const userMsg = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    // Ensure focus stays firmly in the input field!
    inputRef.current?.focus();

    setIsTyping(true);
    setReasoning(isAr ? 'جاري معالجة الطلب...' : 'Processing request...');

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          sessionId: sessionId || 'default_session',
          sessionData: { ...sessionState, language }
        })
      });

      const data = await response.json();

      if (data.blocked || response.status === 429) {
        setReasoning('');
        const botMsg = {
          id: 'bot-' + Date.now(),
          sender: 'bot',
          isBlocked: true,
          text: data.reply || data.message || (isAr ? 'تم حظر الجلسة مؤقتاً لمدة دقيقتين بسبب تكرار الألفاظ غير اللائقة.' : 'Session temporarily blocked for 2 minutes due to abusive language.'),
          timestamp: new Date().toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, botMsg]);
        setIsTyping(false);
        setTimeout(() => inputRef.current?.focus(), 60);
        return;
      }

      if (data.success) {
        if (data.isTakenOver) {
          setIsHumanTakeover(true);
          setHumanAgentName(data.agentName);
        }

        // If there were reasoning steps, show them
        if (data.reasoningSteps && data.reasoningSteps.length > 0) {
          setReasoning(data.reasoningSteps[data.reasoningSteps.length - 1]);
        }

        setTimeout(() => {
          setReasoning('');
          const botMsg = {
            id: 'bot-' + Date.now(),
            sender: 'bot',
            isHumanAgent: Boolean(data.isTakenOver),
            agentName: data.agentName,
            text: data.reply,
            card: data.card,
            timestamp: new Date().toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })
          };

          setMessages(prev => [...prev, botMsg]);
          if (data.state) {
            setSessionState(data.state);
          }
          setIsTyping(false);
          // Refocus input field immediately!
          setTimeout(() => inputRef.current?.focus(), 60);

          // If widget is closed, increment unread badge
          if (!isOpen) {
            setUnreadCount(prev => prev + 1);
          }
        }, 500);
      } else {
        setReasoning('');
        setMessages(prev => [
          ...prev,
          {
            id: 'err-' + Date.now(),
            sender: 'bot',
            text: data.message || (isAr 
              ? 'بعتذر لحضرتك جداً، حصل عطل بسيط في الاتصال. ممكن تعيد كتابة رسالتك؟'
              : 'I apologize, a temporary connection error occurred. Could you please retype your message?'),
            timestamp: new Date().toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        setIsTyping(false);
        setTimeout(() => inputRef.current?.focus(), 60);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setReasoning('');
      setMessages(prev => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          sender: 'bot',
          text: isAr
            ? 'بعتذر لحضرتك، تعذر الاتصال بالخادم. يرجى التأكد من تشغيل السيرفر والمحاولة مرة أخرى.'
            : 'Apologies, unable to contact the server. Please verify your connection and try again.',
          timestamp: new Date().toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setIsTyping(false);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  };

  // Format recording seconds into M:SS
  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Start Voice Note Recording
  const startRecording = async () => {
    if (isRecording || isTyping || isTranscribing) return;
    setVoiceNotice(null);
    setLiveTranscript('');
    setRecordingDuration(0);
    audioChunksRef.current = [];

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setVoiceNotice(isAr ? 'المتصفح الحالي لا يدعم تسجيل الصوت' : 'Current browser does not support audio recording');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      let mimeType = 'audio/webm';
      if (typeof MediaRecorder !== 'undefined') {
        if (!MediaRecorder.isTypeSupported('audio/webm')) {
          if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
          else if (MediaRecorder.isTypeSupported('audio/ogg')) mimeType = 'audio/ogg';
          else mimeType = '';
        }
      }

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      // Native Web Speech Recognition for instant live speech preview
      const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRec) {
        try {
          const rec = new SpeechRec();
          rec.lang = isAr ? 'ar-EG' : 'en-US';
          rec.continuous = true;
          rec.interimResults = true;
          rec.onresult = (event) => {
            let current = '';
            for (let i = 0; i < event.results.length; i++) {
              current += event.results[i][0].transcript;
            }
            if (current) setLiveTranscript(current);
          };
          rec.onerror = (e) => console.warn('SpeechRecognition info:', e.error);
          rec.start();
          recognitionRef.current = rec;
        } catch (recErr) {
          console.warn('Speech recognition start failed:', recErr);
        }
      }

      recorder.start(250);
      setIsRecording(true);

      const startTime = Date.now();
      timerIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setRecordingDuration(elapsed);
        if (elapsed >= 60) {
          finishRecordingAndSend();
        }
      }, 500);

    } catch (err) {
      console.warn('Microphone permission error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setVoiceNotice(isAr ? 'يرجى السماح بصلاحية الميكروفون في المتصفح للتسجيل الصوتي' : 'Please grant microphone permissions in your browser');
      } else {
        setVoiceNotice(isAr ? 'تعذر تشغيل الميكروفون: ' + err.message : 'Microphone error: ' + err.message);
      }
    }
  };

  // Cancel Voice Recording
  const cancelRecording = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = null;

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) {}
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch (e) {}
    }
    mediaRecorderRef.current = null;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    setIsRecording(false);
    setLiveTranscript('');
    audioChunksRef.current = [];
    setTimeout(() => inputRef.current?.focus(), 60);
  };

  // Finish Recording and Transcribe with Gemini Flash
  const finishRecordingAndSend = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = null;

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
      recognitionRef.current = null;
    }

    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') {
      setIsRecording(false);
      return;
    }

    recorder.onstop = async () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }

      setIsRecording(false);
      setIsTranscribing(true);

      const mimeType = recorder.mimeType || 'audio/webm';
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
      const capturedLiveText = liveTranscript.trim();

      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result;

        try {
          setReasoning(capturedLiveText 
            ? (isAr ? 'جاري تحليل الرسالة الصوتية الذكية...' : 'Processing voice message...')
            : (isAr ? 'جاري تفريغ الصوت وتحليله عبر الذكاء الاصطناعي...' : 'Transcribing voice via AI...'));

          const response = await fetch(`${API_URL}/chat/voice-message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audio: base64Audio,
              mimeType,
              liveText: capturedLiveText,
              language,
              sessionId: sessionId || 'default_session',
              sessionData: { ...sessionState, language }
            })
          });

          const data = await response.json();

          if (data.success) {
            const transcribed = data.transcribedText || capturedLiveText;

            // Add user voice message bubble
            const userMsg = {
              id: 'voice-' + Date.now(),
              sender: 'user',
              isVoice: true,
              text: transcribed,
              timestamp: new Date().toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, userMsg]);

            if (data.isTakenOver) {
              setIsHumanTakeover(true);
              setHumanAgentName(data.agentName);
            }

            if (data.reasoningSteps && data.reasoningSteps.length > 0) {
              setReasoning(data.reasoningSteps[data.reasoningSteps.length - 1]);
            }

            setTimeout(() => {
              setReasoning('');
              const botMsg = {
                id: 'bot-' + Date.now(),
                sender: 'bot',
                isHumanAgent: Boolean(data.isTakenOver),
                agentName: data.agentName,
                text: data.reply,
                card: data.card,
                timestamp: new Date().toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })
              };
              setMessages(prev => [...prev, botMsg]);
              if (data.state) setSessionState(data.state);
              setIsTranscribing(false);
              setTimeout(() => inputRef.current?.focus(), 80);
            }, 400);

          } else {
            // Graceful fallback to browser speech recognition if Gemini audio endpoint had an error
            if (capturedLiveText) {
              setIsTranscribing(false);
              sendMessage(capturedLiveText);
            } else {
              setReasoning('');
              setIsTranscribing(false);
              setVoiceNotice(data.message || (isAr ? 'تعذر تفريغ الصوت، يرجى المحاولة ثانية أو كتابة الرسالة' : 'Could not transcribe voice. Please try typing.'));
              setTimeout(() => inputRef.current?.focus(), 80);
            }
          }
        } catch (netErr) {
          console.error('Voice send error:', netErr);
          if (capturedLiveText) {
            setIsTranscribing(false);
            sendMessage(capturedLiveText);
          } else {
            setReasoning('');
            setIsTranscribing(false);
            setVoiceNotice(isAr ? 'تعذر إرسال الصوت بسبب خطأ في الشبكة' : 'Network error while sending audio');
            setTimeout(() => inputRef.current?.focus(), 80);
          }
        }
      };
    };

    recorder.stop();
  };

  const handleFormSubmit = (e) => {
    if (e) e.preventDefault();
    sendMessage();
    inputRef.current?.focus();
  };

  const toggleWidget = () => {
    setIsOpen(prev => {
      const next = !prev;
      if (next) {
        setUnreadCount(0);
        setTimeout(() => inputRef.current?.focus(), 150);
      }
      return next;
    });
  };

  return (
    <div className="floating-chat-root" dir={dir}>
      {/* 1. Trigger Floating Action Button (Collapsed View) */}
      {!isOpen && (
        <div className="floating-fab-container">
          <button 
            className="floating-chat-fab animate-pulse-glow"
            onClick={toggleWidget}
            title={isAr ? 'تحدث مع موظفة الاستقبال الافتراضية' : 'Chat with AI Receptionist Nora'}
            aria-label="Toggle Chat"
          >
            <MessageCircle size={28} />
            {unreadCount > 0 && (
              <span className="floating-chat-badge">{unreadCount}</span>
            )}
          </button>
        </div>
      )}

      {/* 2. Expanded Interactive Chat Window */}
      {isOpen && (
        <div className="floating-chat-window animate-scale-up glass-modal">
          {/* Header */}
          <div className="chat-window-header">
            <div className="header-agent-info">
              <div className="agent-avatar-box">
                <Sparkles size={20} className="sparkle-icon" />
              </div>
              <div>
                <h3 className="agent-name">{isAr ? 'نورا (الاستقبال الذكي)' : 'Nora (AI Receptionist)'}</h3>
                <span className="agent-status-online">
                  <span className="status-dot"></span> {t('chatOnlineStatus')}
                </span>
              </div>
            </div>

            <div className="header-actions">
              <button 
                className="header-btn" 
                onClick={handleReset} 
                title={t('chatNewConversation')}
              >
                <RotateCcw size={16} />
              </button>
              <button 
                className="header-btn" 
                onClick={() => setIsOpen(false)} 
                title="Minimize"
              >
                <Minus size={18} />
              </button>
              <button 
                className="header-btn close-btn" 
                onClick={() => setIsOpen(false)} 
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Human Takeover Notice Banner */}
          {isHumanTakeover && (
            <div style={{ background: '#f59e0b', color: '#fff', padding: '0.4rem 1rem', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserCheck size={16} />
              <span>{t('chatHumanBanner')} ({humanAgentName || (isAr ? 'خدمة العملاء' : 'Support Desk')})</span>
            </div>
          )}

          {/* Voice Warning or Info Notice */}
          {voiceNotice && (
            <div className="voice-notice-banner animate-slide-up">
              <span>{voiceNotice}</span>
              <button type="button" onClick={() => setVoiceNotice(null)} className="notice-close-btn">
                <X size={14} />
              </button>
            </div>
          )}

          {/* Quick Context Pill (Shows Patient Name if known) */}
          {sessionState.patientName && (
            <div className="patient-context-pill">
              <User size={13} />
              <span>{t('chatPatientLabel')} <strong>{sessionState.patientName}</strong></span>
              {sessionState.patientPhone && (
                <span className="phone-tag"> • {sessionState.patientPhone}</span>
              )}
            </div>
          )}

          {/* Messages Area */}
          <div className="chat-window-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`chat-bubble-row ${msg.sender}`}>
                <div className={`chat-bubble ${msg.sender}`}>
                  {msg.isHumanAgent && (
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <UserCheck size={12} />
                      <span>{msg.agentName || (isAr ? 'موظفة الاستقبال' : 'Receptionist')} ({isAr ? 'تدخل بشري' : 'Human Takeover'})</span>
                    </div>
                  )}

                  {/* Voice Note Badge if sent via audio */}
                  {msg.isVoice && (
                    <div className="voice-tag-badge">
                      <Mic size={12} />
                      <span>{isAr ? 'رسالة صوتية (تفريغ الذكاء الاصطناعي)' : 'Voice Note (AI Transcribed)'}</span>
                    </div>
                  )}

                  <div className="bubble-text">{msg.text}</div>

                  {/* Rich Confirmation Card: booking_confirmed */}
                  {msg.card && msg.card.type === 'booking_confirmed' && (
                    <div className="confirmation-card booking-card animate-slide-up">
                      <div className="card-header">
                        <CheckCircle2 size={18} color="#10b981" />
                        <strong>{t('chatBookingCardTitle')}</strong>
                      </div>
                      <div className="card-body">
                        <div><CheckCircle2 size={14} color="#10b981" /> <span>{t('chatBookingCode')}</span> <strong style={{ color: '#10b981' }}>{msg.card.bookingId}</strong></div>
                        <div><User size={14} /> <span>{t('chatPatientLabel')}</span> <strong>{msg.card.patientName}</strong></div>
                        <div><Calendar size={14} /> <span>{isAr ? 'الموعد:' : 'Date:'}</span> <strong>{msg.card.date}</strong></div>
                        <div><Clock size={14} /> <span>{isAr ? 'الساعة:' : 'Time:'}</span> <strong>{msg.card.time}</strong></div>
                        <div><Bot size={14} /> <span>{t('chatDoctor')}</span> <strong>{msg.card.doctor}</strong></div>
                        <div><Phone size={14} /> <span>{t('chatPhone')}</span> <strong>{msg.card.phone}</strong></div>
                      </div>
                      <div className="card-footer">
                        <span className="badge-confirmed">{t('chatConfirmedBadge')}</span>
                      </div>
                    </div>
                  )}

                  {/* Rich Confirmation Card: unified_booking_confirmed */}
                  {msg.card && msg.card.type === 'unified_booking_confirmed' && (
                    <div className="confirmation-card booking-card animate-slide-up" style={{ borderColor: '#3b82f6' }}>
                      <div className="card-header" style={{ color: '#3b82f6' }}>
                        <CheckCircle2 size={18} color="#3b82f6" />
                        <strong>{isAr ? 'بطاقة الحجز الموحد لعدة استشاريين' : 'Multi-Doctor Combined Booking Receipt'}</strong>
                      </div>
                      <div className="card-body">
                        <div><User size={14} /> <span>{t('chatPatientLabel')}</span> <strong>{msg.card.patientName}</strong></div>
                        <div><Phone size={14} /> <span>{t('chatPhone')}</span> <strong>{msg.card.phone}</strong></div>
                        <div style={{ marginTop: '0.4rem', borderTop: '1px dashed var(--border-color)', paddingTop: '0.4rem' }}>
                          {(msg.card.appointments || []).map((b, idx) => (
                            <div key={idx} style={{ marginBottom: '0.3rem', fontSize: '0.85rem' }}>
                              • <strong>{b.doctor}</strong> ({b.departmentTitle}): {b.date} {isAr ? 'الساعة' : 'at'} {b.time} ({isAr ? 'كود:' : 'code:'} <span style={{ color: '#0d9488' }}>{b.bookingId}</span>)
                            </div>
                          ))}
                        </div>
                        {msg.card.totalPrice && (
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.3rem' }}>
                            💰 {isAr ? 'إجمالي الكشوفات:' : 'Total Cost:'} {msg.card.totalPrice} {isAr ? 'جنيه' : 'EGP'}
                          </div>
                        )}
                      </div>
                      <div className="card-footer">
                        <span className="badge-confirmed" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' }}>
                          {isAr ? 'حجز متعدد موحد ✓' : 'Unified Cart Booked ✓'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Rich Confirmation Card: waitlist_confirmed */}
                  {msg.card && msg.card.type === 'waitlist_confirmed' && (
                    <div className="confirmation-card waitlist-card animate-slide-up">
                      <div className="card-header">
                        <AlertCircle size={18} color="#f59e0b" />
                        <strong>{t('chatWaitlistTitle')}</strong>
                      </div>
                      <div className="card-body">
                        <div><CheckCircle2 size={14} color="#f59e0b" /> <span>{isAr ? 'كود الانتظار:' : 'Waitlist ID:'}</span> <strong style={{ color: '#f59e0b' }}>{msg.card.waitlistId}</strong></div>
                        <div><User size={14} /> <span>{t('chatPatientLabel')}</span> <strong>{msg.card.patientName}</strong></div>
                        <div><Calendar size={14} /> <span>{isAr ? 'المطلوب:' : 'Requested:'}</span> <strong>{msg.card.requestedDate} ({msg.card.requestedTime})</strong></div>
                        <div><Bot size={14} /> <span>{t('chatDoctor')}</span> <strong>{msg.card.doctor}</strong></div>
                        <div><Phone size={14} /> <span>{isAr ? 'الواتساب للتنبيه:' : 'Alert WhatsApp:'}</span> <strong>{msg.card.phone}</strong></div>
                      </div>
                      <div className="card-footer">
                        <span className="badge-waitlist">{t('chatWaitlistBadge')}</span>
                      </div>
                    </div>
                  )}

                  {/* Rich Card: booking_cancelled */}
                  {msg.card && msg.card.type === 'booking_cancelled' && (
                    <div className="confirmation-card animate-slide-up" style={{ borderColor: 'rgba(239, 68, 68, 0.4)', background: 'rgba(239, 68, 68, 0.05)' }}>
                      <div className="card-header" style={{ color: '#ef4444' }}>
                        <X size={18} color="#ef4444" />
                        <strong>{t('chatCancelledTitle')}</strong>
                      </div>
                      <div className="card-body">
                        <div><CheckCircle2 size={14} color="#ef4444" /> <span>{t('chatBookingCode')}</span> <strong style={{ color: '#ef4444' }}>{msg.card.bookingId}</strong></div>
                        <div><User size={14} /> <span>{t('chatPatientLabel')}</span> <strong>{msg.card.patientName}</strong></div>
                        <div><Bot size={14} /> <span>{t('chatDoctor')}</span> <strong>{msg.card.doctor}</strong></div>
                        <div><Clock size={14} /> <span>{isAr ? 'الموعد الملغى:' : 'Cancelled Slot:'}</span> <strong>{msg.card.date} - {msg.card.time}</strong></div>
                      </div>
                      <div className="card-footer">
                        <span style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.85rem' }}>{t('chatCancelledBadge')}</span>
                      </div>
                    </div>
                  )}

                  <span className="bubble-timestamp">{msg.timestamp}</span>
                </div>
              </div>
            ))}

            {/* Live Reasoning Indicator */}
            {(isTyping || isTranscribing) && (
              <div className="chat-bubble-row bot">
                <div className="chat-bubble bot typing-bubble">
                  {reasoning && (
                    <div className="reasoning-step-box animate-pulse-subtle">
                      <Loader2 size={14} className="animate-spin" />
                      <span>{reasoning}</span>
                    </div>
                  )}
                  <div className="typing-dots-container">
                    <span className="dot"></span>
                    <span className="dot" style={{ animationDelay: '0.2s' }}></span>
                    <span className="dot" style={{ animationDelay: '0.4s' }}></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Reply Suggestion Chips */}
          <div className="quick-suggestions-bar">
            {isAr ? (
              <>
                <button type="button" className="suggestion-chip" onClick={() => sendMessage('عايز احجز مع دكتور أحمد')}>
                  ❓ حجز مع د. أحمد
                </button>
                <button type="button" className="suggestion-chip" onClick={() => sendMessage('عايز ميعاد كشف أسنان يوم الإثنين الساعة 4:30 مساءً')}>
                  📅 حجز الإثنين 4:30 م
                </button>
                <button type="button" className="suggestion-chip" onClick={() => sendMessage('عايز اكلم حد من السكرتارية')}>
                  👩‍💼 سكرتارية بشرية
                </button>
                <button type="button" className="suggestion-chip" onClick={() => sendMessage('عايز الغي الحجز')}>
                  ❌ إلغاء حجز
                </button>
                <button type="button" className="suggestion-chip reset-chip" onClick={handleReset}>
                  🔄 محادثة جديدة
                </button>
              </>
            ) : (
              <>
                <button type="button" className="suggestion-chip" onClick={() => sendMessage('I want to book an appointment with Dr. Ahmed')}>
                  ❓ Dr. Ahmed
                </button>
                <button type="button" className="suggestion-chip" onClick={() => sendMessage('I want to book dental consultation on Monday at 4:30 PM')}>
                  📅 Monday 4:30 PM
                </button>
                <button type="button" className="suggestion-chip" onClick={() => sendMessage('I want to speak with a human receptionist')}>
                  👩‍💼 Human Agent
                </button>
                <button type="button" className="suggestion-chip" onClick={() => sendMessage('I want to cancel my booking')}>
                  ❌ Cancel Booking
                </button>
                <button type="button" className="suggestion-chip reset-chip" onClick={handleReset}>
                  🔄 Reset Chat
                </button>
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="chat-window-input-area">
            {isRecording ? (
              /* Active Voice Recording Bar */
              <div className="voice-recording-bar animate-fade-in">
                <div className="recording-status">
                  <span className="recording-pulse-dot"></span>
                  <span className="recording-timer">{formatDuration(recordingDuration)}</span>
                </div>

                <div className="recording-waves-container">
                  <span className="wave-bar b1"></span>
                  <span className="wave-bar b2"></span>
                  <span className="wave-bar b3"></span>
                  <span className="wave-bar b4"></span>
                  <span className="wave-bar b5"></span>
                  <span className="wave-bar b6"></span>
                </div>

                <div className="recording-preview-text">
                  {liveTranscript ? `"${liveTranscript}"` : (isAr ? 'تحدث الآن، جاري الاستماع...' : 'Listening, speak now...')}
                </div>

                <div className="recording-actions">
                  <button 
                    type="button" 
                    className="recording-cancel-btn"
                    onClick={cancelRecording}
                    title={isAr ? 'إلغاء التسجيل' : 'Cancel Recording'}
                  >
                    <Trash2 size={16} />
                  </button>
                  <button 
                    type="button" 
                    className="recording-send-btn"
                    onClick={finishRecordingAndSend}
                    title={isAr ? 'إرسال التسجيل الصوتي' : 'Send Voice Note'}
                  >
                    <Check size={18} />
                  </button>
                </div>
              </div>
            ) : (
              /* Standard Text + Mic Input Form */
              <form className="chat-input-wrapper" onSubmit={handleFormSubmit}>
                <input
                  ref={inputRef}
                  type="text"
                  className="widget-input"
                  placeholder={isHumanTakeover ? t('chatPlaceholderHuman') : t('chatPlaceholderAI')}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleFormSubmit(e);
                    }
                  }}
                  disabled={isRecording || isTranscribing}
                  autoFocus
                />

                {/* Voice Note Trigger Button */}
                <button
                  type="button"
                  className={`widget-mic-btn ${isRecording ? 'recording' : ''}`}
                  onClick={startRecording}
                  disabled={isTyping || isTranscribing}
                  title={isAr ? 'تسجيل رسالة صوتية (تفريغ ذكي عبر Gemini)' : 'Record Voice Note (AI Speech-to-Text)'}
                >
                  <Mic size={18} />
                </button>

                {/* Send Button */}
                <button 
                  type="submit" 
                  className="widget-send-btn" 
                  disabled={isTyping || isTranscribing || !input.trim()}
                  title={t('chatSendTitle')}
                >
                  <Send size={18} style={{ transform: isAr ? 'rotate(180deg)' : 'none' }} />
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
