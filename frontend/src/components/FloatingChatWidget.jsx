import { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, X, Minus, RotateCcw, Send, Sparkles, 
  CheckCircle2, Clock, Calendar, User, Phone, AlertCircle, Loader2, Bot
} from 'lucide-react';

const STORAGE_KEY = 'smart_clinic_receptionist_session_v2';
const API_URL = 'http://localhost:5000/api';

const INITIAL_MESSAGE = {
  id: 'init-1',
  sender: 'bot',
  text: 'أهلاً بحضرتك في سمارت كلينك! أنا "نورا" موظفة الاستقبال الطبية الافتراضية. يشرفني أعرف اسم حضرتك الكريم الأول عشان أقدر أساعدك؟',
  timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
};

export default function FloatingChatWidget({ externalTriggerMessage, onClearTrigger }) {
  // Session Persistence State
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [sessionId, setSessionId] = useState('');
  const [sessionState, setSessionState] = useState({});
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [reasoning, setReasoning] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 1. Load Session from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.sessionId) setSessionId(parsed.sessionId);
        if (parsed.messages && parsed.messages.length > 0) setMessages(parsed.messages);
        if (parsed.sessionState) setSessionState(parsed.sessionState);
        if (typeof parsed.isOpen === 'boolean') setIsOpen(parsed.isOpen);
      } else {
        const newId = 'session_' + Math.random().toString(36).substring(2, 10);
        setSessionId(newId);
      }
    } catch (e) {
      console.warn('Could not restore chat session from localStorage:', e);
      setSessionId('session_' + Date.now());
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

  // Handle external trigger (e.g. from service booking buttons)
  useEffect(() => {
    if (externalTriggerMessage) {
      setIsOpen(true);
      sendMessage(externalTriggerMessage);
      if (onClearTrigger) onClearTrigger();
    }
  }, [externalTriggerMessage]);

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
    setMessages([INITIAL_MESSAGE]);
    setSessionState({});
    setInput('');
    setReasoning('');
    localStorage.removeItem(STORAGE_KEY);
  };

  // Send message function
  const sendMessage = async (textToSend) => {
    const text = (textToSend || input).trim();
    if (!text || isTyping) return;

    const userMsg = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setReasoning('جاري معالجة الطلب...');

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          sessionId: sessionId || 'default_session',
          sessionData: sessionState
        })
      });

      const data = await response.json();

      if (data.success) {
        // If there were reasoning steps, show them
        if (data.reasoningSteps && data.reasoningSteps.length > 0) {
          setReasoning(data.reasoningSteps[data.reasoningSteps.length - 1]);
        }

        setTimeout(() => {
          setReasoning('');
          const botMsg = {
            id: 'bot-' + Date.now(),
            sender: 'bot',
            text: data.reply,
            card: data.card,
            timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
          };

          setMessages(prev => [...prev, botMsg]);
          if (data.state) {
            setSessionState(data.state);
          }
          setIsTyping(false);

          // If widget is closed, increment unread badge
          if (!isOpen) {
            setUnreadCount(prev => prev + 1);
          }
        }, 600);
      } else {
        setReasoning('');
        setMessages(prev => [
          ...prev,
          {
            id: 'err-' + Date.now(),
            sender: 'bot',
            text: 'بعتذر لحضرتك جداً، حصل عطل بسيط في الاتصال. ممكن تعيد كتابة رسالتك؟',
            timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        setIsTyping(false);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setReasoning('');
      setMessages(prev => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          sender: 'bot',
          text: 'بعتذر لحضرتك، تعذر الاتصال بالخادم. يرجى التأكد من تشغيل السيرفر والمحاولة مرة أخرى.',
          timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setIsTyping(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  const toggleWidget = () => {
    setIsOpen(prev => {
      const next = !prev;
      if (next) setUnreadCount(0);
      return next;
    });
  };

  return (
    <div className="floating-chat-root" dir="rtl">
      {/* 1. Trigger Floating Action Button (Collapsed View) */}
      {!isOpen && (
        <div className="floating-fab-container">
          <button 
            className="floating-chat-fab animate-pulse-glow"
            onClick={toggleWidget}
            title="تحدث مع موظفة الاستقبال الافتراضية"
            aria-label="فتح المحادثة"
          >
            <div className="fab-avatar-wrapper">
              <Bot size={28} className="fab-icon" />
              <span className="online-indicator-dot"></span>
            </div>
            {unreadCount > 0 && (
              <span className="fab-badge">{unreadCount}</span>
            )}
          </button>
          <div className="fab-tooltip-pill glass" onClick={toggleWidget}>
            <Sparkles size={14} className="sparkle-icon" />
            <span>نورا • الاستقبال الذكي</span>
          </div>
        </div>
      )}

      {/* 2. Expanded Floating Chat Window */}
      {isOpen && (
        <div className="floating-chat-window glass animate-slide-up">
          {/* Header */}
          <div className="chat-window-header">
            <div className="header-info">
              <div className="header-avatar-box">
                <Bot size={22} color="#ffffff" />
                <span className="header-online-dot"></span>
              </div>
              <div className="header-text">
                <h3>نورا • موظفة الاستقبال</h3>
                <p>متصلة الآن • سمارت كلينك AI</p>
              </div>
            </div>

            <div className="header-actions">
              <button 
                className="header-btn" 
                onClick={handleReset} 
                title="بدء محادثة جديدة"
              >
                <RotateCcw size={16} />
              </button>
              <button 
                className="header-btn" 
                onClick={() => setIsOpen(false)} 
                title="تصغير النافذة"
              >
                <Minus size={18} />
              </button>
              <button 
                className="header-btn close-btn" 
                onClick={() => setIsOpen(false)} 
                title="إغلاق"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Quick Context Pill (Shows Patient Name if known) */}
          {sessionState.patientName && (
            <div className="patient-context-pill">
              <User size={13} />
              <span>المريض: <strong>{sessionState.patientName}</strong></span>
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
                  <div className="bubble-text">{msg.text}</div>

                  {/* Rich Confirmation Card (if any) */}
                  {msg.card && msg.card.type === 'booking_confirmed' && (
                    <div className="confirmation-card booking-card animate-slide-up">
                      <div className="card-header">
                        <CheckCircle2 size={18} color="#10b981" />
                        <strong>بطاقة تأكيد الحجز الطبي</strong>
                      </div>
                      <div className="card-body">
                        <div><User size={14} /> <span>المريض:</span> <strong>{msg.card.patientName}</strong></div>
                        <div><Calendar size={14} /> <span>الموعد:</span> <strong>{msg.card.date}</strong></div>
                        <div><Clock size={14} /> <span>الساعة:</span> <strong>{msg.card.time}</strong></div>
                        <div><Bot size={14} /> <span>الطبيب:</span> <strong>{msg.card.doctor}</strong></div>
                        <div><Phone size={14} /> <span>واتساب:</span> <strong>{msg.card.phone}</strong></div>
                      </div>
                      <div className="card-footer">
                        <span className="badge-confirmed">تم الحجز وتأكيد الواتساب ✓</span>
                      </div>
                    </div>
                  )}

                  {msg.card && msg.card.type === 'waitlist_confirmed' && (
                    <div className="confirmation-card waitlist-card animate-slide-up">
                      <div className="card-header">
                        <AlertCircle size={18} color="#f59e0b" />
                        <strong>بطاقة قائمة الانتظار الذكية</strong>
                      </div>
                      <div className="card-body">
                        <div><User size={14} /> <span>المريض:</span> <strong>{msg.card.patientName}</strong></div>
                        <div><Calendar size={14} /> <span>المطلوب:</span> <strong>{msg.card.requestedDate} ({msg.card.requestedTime})</strong></div>
                        <div><Bot size={14} /> <span>الطبيب:</span> <strong>{msg.card.doctor}</strong></div>
                        <div><Phone size={14} /> <span>الواتساب للتنبيه:</span> <strong>{msg.card.phone}</strong></div>
                      </div>
                      <div className="card-footer">
                        <span className="badge-waitlist">أولوية أولى للإخطار الفوري ⚡</span>
                      </div>
                    </div>
                  )}

                  <span className="bubble-timestamp">{msg.timestamp}</span>
                </div>
              </div>
            ))}

            {/* Live Reasoning Indicator */}
            {isTyping && (
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
            <button 
              type="button" 
              className="suggestion-chip"
              onClick={() => sendMessage('عايز احجز مع دكتور أحمد')}
            >
              ❓ حجز مع د. أحمد (اختبار جمع المعاملات)
            </button>
            <button 
              type="button" 
              className="suggestion-chip"
              onClick={() => sendMessage('عايز ميعاد كشف أسنان يوم الإثنين الساعة 4:30 مساءً')}
            >
              📅 حجز الإثنين 4:30 م (محجوز - ب)
            </button>
            <button 
              type="button" 
              className="suggestion-chip"
              onClick={() => sendMessage('عايز ميعاد كشف أسنان يوم الإثنين الساعة 5:30 مساءً')}
            >
              ✅ حجز الإثنين 5:30 م (متاح - أ)
            </button>
            <button 
              type="button" 
              className="suggestion-chip reset-chip"
              onClick={handleReset}
            >
              🔄 محادثة جديدة (عزل الجلسة)
            </button>
          </div>

          {/* Input Area */}
          <div className="chat-window-input-area">
            <form className="chat-input-wrapper" onSubmit={handleFormSubmit}>
              <input
                type="text"
                className="widget-input"
                placeholder="اكتب رسالتك هنا لنورا..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isTyping}
              />
              <button 
                type="submit" 
                className="widget-send-btn" 
                disabled={isTyping || !input.trim()}
                title="إرسال"
              >
                <Send size={18} style={{ transform: 'rotate(180deg)' }} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
