import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, MessageSquare, UserCheck, Send, 
  Search, Clock, Phone, Calendar, Bot, CheckCircle2, 
  AlertCircle, Sparkles, RefreshCw, Cpu, Key, X,
  Volume2, VolumeX, Bell, BellRing, Stethoscope, ExternalLink, ShieldCheck
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import DoctorScheduleMatrix from '../components/DoctorScheduleMatrix';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export default function AssistantPage() {
  const { language, t } = useLanguage();
  const isAr = language === 'ar';

  const [chats, setChats] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [filter, setFilter] = useState('all'); // all, takeover, ai
  const [searchTerm, setSearchTerm] = useState('');
  const [secretaryReply, setSecretaryReply] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [agentName, setAgentName] = useState(() => localStorage.getItem('smart_clinic_agent_name') || (isAr ? 'موظفة الاستقبال سارة' : 'Receptionist Sarah'));
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('smart_clinic_sec_sound') !== 'false');
  const [aiStatus, setAiStatus] = useState({ isLLMEnabled: false, activeProvider: 'none' });
  const [showAiModal, setShowAiModal] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [aiKeyInput, setAiKeyInput] = useState('');
  const [aiProvider, setAiProvider] = useState('gemini');
  const [isSavingKey, setIsSavingKey] = useState(false);

  const transcriptEndRef = useRef(null);
  const knownTakeoversRef = useRef(new Set());

  // Web Audio API chime sound generator
  const playAlertChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc1.type = 'sine';
      osc2.type = 'triangle';
      
      osc1.frequency.setValueAtTime(659.25, now); // E5
      osc1.frequency.setValueAtTime(880, now + 0.12); // A5
      
      osc2.frequency.setValueAtTime(329.63, now); // E4
      osc2.frequency.setValueAtTime(440, now + 0.12); // A4
      
      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
      
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.75);
      osc2.stop(now + 0.75);
    } catch (e) {
      console.warn('Audio chime failed:', e);
    }
  };

  // Auto scroll transcript to bottom
  const scrollToBottom = () => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchAiStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/ai/status`).then(r => r.json());
      if (res.success) setAiStatus(res);
    } catch (e) {}
  };

  // Fetch full details of a specific chat session (history + status)
  const fetchChatDetails = async (sessionId) => {
    if (!sessionId) return;
    try {
      const res = await fetch(`${API_URL}/admin/chats/${sessionId}`).then(r => r.json());
      if (res.success && res.data) {
        setSelectedChat(res.data);
      }
    } catch (err) {
      console.warn('Error fetching chat details:', err);
    }
  };

  // Fetch all chats & run takeover notification checks
  const fetchChats = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/chats`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setChats(data.data);

        // Check for urgent pending human takeover requests
        const pending = data.data.filter(c => (c.takeoverRequested || c.status === 'takeover_requested' || c.state?.takeoverRequested) && !c.isTakenOver);
        let hasNewRequest = false;
        pending.forEach(c => {
          if (!knownTakeoversRef.current.has(c.sessionId)) {
            knownTakeoversRef.current.add(c.sessionId);
            hasNewRequest = true;
          }
        });

        if (hasNewRequest && soundEnabled) {
          playAlertChime();
        }

        // If a chat is currently selected, refresh its full transcript
        if (selectedSessionId) {
          const current = data.data.find(c => c.sessionId === selectedSessionId);
          if (current && Array.isArray(current.history) && current.history.length > 0) {
            setSelectedChat(prev => ({ ...prev, ...current }));
          } else {
            fetchChatDetails(selectedSessionId);
          }
        }
      }
    } catch (err) {
      console.warn('Error fetching admin chats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load and periodic polling every 3 seconds
  useEffect(() => {
    fetchChats();
    fetchAiStatus();
    const interval = setInterval(fetchChats, 3000);
    return () => clearInterval(interval);
  }, [selectedSessionId, soundEnabled]);

  // Update browser tab title based on pending takeovers
  useEffect(() => {
    const pendingCount = chats.filter(c => (c.takeoverRequested || c.status === 'takeover_requested' || c.state?.takeoverRequested) && !c.isTakenOver).length;
    if (pendingCount > 0) {
      document.title = `(${pendingCount}) 🚨 طلب تدخل سكرتارية | سمارت كلينك AI`;
    } else {
      document.title = isAr ? 'غرفة السكرتارية والمتابعة الحية | سمارت كلينك AI' : 'Live Secretary Center | Smart Clinic AI';
    }
  }, [chats, isAr]);

  const handleSaveAiKey = async (e) => {
    e.preventDefault();
    if (!aiKeyInput.trim()) return;
    setIsSavingKey(true);
    try {
      const res = await fetch(`${API_URL}/ai/configure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: aiProvider, key: aiKeyInput.trim() })
      }).then(r => r.json());
      if (res.success) {
        setAiKeyInput('');
        setShowAiModal(false);
        fetchAiStatus();
        alert(isAr ? 'تم حفظ المفتاح وتفعيل الصياغة اللغوية الذكية بنجاح!' : 'API key saved and LLM formulation activated successfully!');
      } else {
        alert(res.message || 'Error saving key');
      }
    } catch (err) {
      alert('Network error');
    } finally {
      setIsSavingKey(false);
    }
  };

  // When selectedChat changes, scroll transcript to bottom
  useEffect(() => {
    scrollToBottom();
  }, [selectedChat?.history?.length, selectedSessionId]);

  // Select a chat
  const handleSelectChat = (chat) => {
    setSelectedSessionId(chat.sessionId);
    setSelectedChat(chat);
    fetchChatDetails(chat.sessionId);
  };

  // Instant Takeover for Urgent Request
  const handleInstantTakeover = async (sessionId) => {
    try {
      const res = await fetch(`${API_URL}/admin/chats/${sessionId}/takeover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isTakenOver: true,
          agentName: agentName
        })
      });
      const data = await res.json();
      if (data.success) {
        setSelectedSessionId(sessionId);
        await fetchChatDetails(sessionId);
        fetchChats();
      }
    } catch (err) {
      console.error('Instant takeover error:', err);
    }
  };

  // Toggle Human Takeover
  const handleToggleTakeover = async () => {
    if (!selectedSessionId || !selectedChat) return;
    const newStatus = !selectedChat.isTakenOver;

    try {
      const res = await fetch(`${API_URL}/admin/chats/${selectedSessionId}/takeover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isTakenOver: newStatus,
          agentName: agentName
        })
      });
      const data = await res.json();
      if (data.success) {
        setSelectedChat(prev => ({
          ...prev,
          isTakenOver: newStatus,
          agentName: newStatus ? agentName : null
        }));
        fetchChats();
      }
    } catch (err) {
      alert(isAr ? 'فشل تغيير حالة الاستلام' : 'Failed to update takeover status');
    }
  };

  // Send Secretary Message to Patient
  const handleSendMessage = async (customText) => {
    const textToSend = customText || secretaryReply;
    if (!textToSend.trim() || !selectedSessionId || isSending) return;

    setIsSending(true);
    try {
      const res = await fetch(`${API_URL}/admin/chats/${selectedSessionId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend.trim(),
          agentName: agentName
        })
      });
      const data = await res.json();
      if (data.success) {
        setSecretaryReply('');
        await fetchChatDetails(selectedSessionId);
        fetchChats();
      }
    } catch (err) {
      alert(isAr ? 'فشل إرسال الرسالة للمريض' : 'Failed to send message to patient');
    } finally {
      setIsSending(false);
    }
  };

  // Urgent Takeover Chats (Exclude chats with completed bookings)
  const urgentChats = chats.filter(c => {
    const hasCompleted = Boolean(
      c.state?.lastConfirmedBooking || 
      c.state?.bookingDraft?.confirmed || 
      (c.state?.confirmedAppointments && c.state.confirmedAppointments.length > 0)
    );
    return !hasCompleted && (c.takeoverRequested === true || c.status === 'takeover_requested' || c.state?.takeoverRequested === true) && !c.isTakenOver;
  });

  // Filtered Chats List
  const filteredChats = chats.filter(chat => {
    const hasTakeover = chat.isTakenOver || chat.takeoverRequested || chat.state?.takeoverRequested || chat.status === 'takeover_requested';
    const matchesFilter = 
      filter === 'all' ? true :
      filter === 'takeover' ? hasTakeover :
      filter === 'ai' ? !chat.isTakenOver : true;

    const term = searchTerm.toLowerCase().trim();
    const matchesSearch = !term ? true : (
      (chat.patientName && chat.patientName.toLowerCase().includes(term)) ||
      (chat.phone && chat.phone.includes(term)) ||
      (chat.doctor && chat.doctor.toLowerCase().includes(term)) ||
      (chat.lastMessage && chat.lastMessage.toLowerCase().includes(term))
    );

    return matchesFilter && matchesSearch;
  });

  const quickTemplates = isAr ? [
    'أهلاً بحضرتك يا فندم، معك موظفة الاستقبال سارة. كيف أقدر أساعدك؟',
    'تم استلام طلب حضرتك ومراجعته، وسنقوم بالتواصل معك فوراً.',
    'تم تأكيد موعد كشف حضرتك، وسنرسل لك كافة التفاصيل عبر الواتساب فوراً.',
    'بنعتذر لحضرتك عن الانتظار، جاري فحص الملف مع الدكتور وسنرد عليك في الحال.',
    'برجاء إرسال صورة روشتة أو تحاليل سابقة إن وُجدت لمراجعتها مع الطبيب.'
  ] : [
    'Hello! This is Sarah from the medical reception. How may I assist you today?',
    'Your request has been received and reviewed by management. We will follow up immediately.',
    'Your appointment has been verified. We have sent the confirmation to your WhatsApp.',
    'We apologize for the brief wait. Checking availability with the consultant right now.',
    'Please feel free to share any previous lab tests or prescriptions for review.'
  ];

  return (
    <div className="secretary-standalone-portal" style={{ minHeight: '100vh', background: 'var(--bg-main)', paddingBottom: '3rem' }}>
      
      {/* Dedicated Secretary Portal Header Bar */}
      <header className="staff-portal-header glass" style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        padding: '0.9rem 2rem',
        borderBottom: '1px solid var(--card-border)',
        backdropFilter: 'blur(16px)',
        background: 'rgba(255, 255, 255, 0.92)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'var(--primary-color)', padding: '0.5rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Stethoscope size={24} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-main)' }}>
                سمارت كلينك AI
              </span>
              <span style={{ background: '#ecfdf5', color: '#059669', fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '50px', border: '1px solid #a7f3d0' }}>
                بوابة السكرتارية الرسمية
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              غرفة المتابعة الحية والتدخل البشري الفوري
            </div>
          </div>
        </div>

        {/* Portal Quick Links & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
          {/* Sound Alert Toggle */}
          <button
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              localStorage.setItem('smart_clinic_sec_sound', String(next));
              if (next) playAlertChime();
            }}
            title={soundEnabled ? 'كتم رنين التنبيهات' : 'تشغيل رنين التنبيهات'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 0.9rem',
              borderRadius: '10px',
              border: soundEnabled ? '1px solid #10b981' : '1px solid #f87171',
              background: soundEnabled ? '#ecfdf5' : '#fef2f2',
              color: soundEnabled ? '#047857' : '#b91c1c',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {soundEnabled ? <Volume2 size={16} color="#059669" /> : <VolumeX size={16} color="#dc2626" />}
            <span>{soundEnabled ? 'صوت التنبيهات: شغال' : 'صوت التنبيهات: مكتوم'}</span>
          </button>

          {/* Active Agent Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#fff', padding: '0.45rem 0.8rem', borderRadius: '10px', border: '1px solid var(--card-border)' }}>
            <UserCheck size={16} color="var(--primary-color)" />
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>الموظف:</span>
            <input 
              type="text"
              value={agentName}
              onChange={(e) => {
                setAgentName(e.target.value);
                localStorage.setItem('smart_clinic_agent_name', e.target.value);
              }}
              style={{ border: 'none', background: 'transparent', fontWeight: 700, color: 'var(--primary-hover)', fontSize: '0.8rem', width: '150px', outline: 'none' }}
            />
          </div>

          {/* LLM Status Button */}
          <button 
            onClick={() => setShowAiModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 0.9rem',
              borderRadius: '10px',
              border: '1px solid var(--card-border)',
              background: aiStatus.isLLMEnabled ? '#ecfdf5' : '#fff',
              color: aiStatus.isLLMEnabled ? '#059669' : 'var(--text-main)',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}
          >
            <Cpu size={15} color={aiStatus.isLLMEnabled ? '#059669' : 'var(--primary-color)'} />
            <span>{aiStatus.isLLMEnabled ? `صياغة (${aiStatus.activeProvider.toUpperCase()})` : 'محرك محلي'}</span>
          </button>

          {/* Toggle Doctor Schedule Matrix */}
          <button 
            onClick={() => setShowSchedule(!showSchedule)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 1rem',
              borderRadius: '10px',
              background: showSchedule ? '#0d9488' : 'rgba(13, 148, 136, 0.1)',
              color: showSchedule ? '#ffffff' : 'var(--primary-hover)',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              border: '1px solid rgba(13, 148, 136, 0.2)',
              transition: 'all 0.2s'
            }}
          >
            <Calendar size={15} />
            <span>{showSchedule ? 'إخفاء جدول المواعيد' : 'جدول المواعيد الأسبوعي 📅'}</span>
          </button>

          {/* Link to Admin Portal */}
          <Link 
            to="/admin" 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 1rem',
              borderRadius: '10px',
              background: 'rgba(13, 148, 136, 0.1)',
              color: 'var(--primary-hover)',
              fontWeight: 700,
              fontSize: '0.82rem',
              textDecoration: 'none',
              border: '1px solid rgba(13, 148, 136, 0.2)'
            }}
          >
            <ShieldCheck size={15} />
            <span>لوحة الإدارة 📊</span>
          </Link>

          {/* Link to Public Website */}
          <Link 
            to="/" 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 0.9rem',
              borderRadius: '10px',
              background: '#f1f5f9',
              color: '#475569',
              fontWeight: 600,
              fontSize: '0.82rem',
              textDecoration: 'none',
              border: '1px solid #e2e8f0'
            }}
          >
            <ExternalLink size={14} />
            <span>موقع العيادة 🌐</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <div className="assistant-command-center animate-slide-up" style={{ padding: '1.5rem', maxWidth: '1480px', margin: '0 auto' }}>
        
        {/* Doctor Schedule Matrix Section */}
        {showSchedule && (
          <div style={{ marginBottom: '1.5rem' }}>
            <DoctorScheduleMatrix />
          </div>
        )}

        {/* Urgent Notification Banner for Pending Human Requests */}
        {urgentChats.length > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
            border: '2px solid #f43f5e',
            borderRadius: '16px',
            padding: '1rem 1.4rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            boxShadow: '0 8px 24px rgba(244, 63, 94, 0.15)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
              <div style={{ background: '#f43f5e', color: '#fff', padding: '0.55rem', borderRadius: '50%', display: 'flex', animation: 'bounce 1.5s infinite' }}>
                <BellRing size={22} />
              </div>
              <div>
                <div style={{ fontWeight: 800, color: '#9f1239', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>🚨 تنبيه عاجل: يوجد طلب تواصل وتدخل مع الإدارة/السكرتارية ({urgentChats.length} طلب غير مستلم)</span>
                </div>
                <div style={{ fontSize: '0.88rem', color: '#be123c', marginTop: '0.2rem' }}>
                  المريض: <strong>{urgentChats[0].patientName || 'مريض زائر'}</strong> {urgentChats[0].phone && urgentChats[0].phone !== 'غير متوفر' ? `(📞 ${urgentChats[0].phone})` : ''} - آخر رسالة: <em>"{urgentChats[0].lastMessage}"</em>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                handleInstantTakeover(urgentChats[0].sessionId);
              }}
              style={{
                background: '#f43f5e',
                color: '#fff',
                border: 'none',
                padding: '0.65rem 1.4rem',
                borderRadius: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                fontSize: '0.9rem',
                boxShadow: '0 4px 14px rgba(244, 63, 94, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <UserCheck size={18} />
              <span>استلام المحادثة فوراً والرد ⚡</span>
            </button>
          </div>
        )}

        {/* AI Key Configuration Modal */}
        {showAiModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(5px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div className="glass" style={{ background: '#fff', borderRadius: '20px', padding: '2rem', maxWidth: '500px', width: '100%', boxShadow: 'var(--shadow-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Cpu size={22} color="var(--primary-color)" />
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>ربط نموذج الذكاء الاصطناعي (LLM)</h3>
                </div>
                <button onClick={() => setShowAiModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}><X size={20} /></button>
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '1.2rem' }}>
                يستخدم النظام محرك العيادة الطبي لحساب المواعيد والأكواد بدقة 100%، ويستخدم نموذج الـ LLM لصياغة الردود بأسلوب مصري طبيعي ودافئ.
              </p>

              <form onSubmit={handleSaveAiKey}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                    اختر المزود:
                  </label>
                  <div style={{ display: 'flex', gap: '0.6rem' }}>
                    <button
                      type="button"
                      onClick={() => setAiProvider('gemini')}
                      style={{
                        flex: 1,
                        padding: '0.6rem',
                        borderRadius: '10px',
                        border: aiProvider === 'gemini' ? '2px solid var(--primary-color)' : '1px solid var(--card-border)',
                        background: aiProvider === 'gemini' ? 'var(--primary-light)' : '#fff',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Google Gemini
                    </button>
                    <button
                      type="button"
                      onClick={() => setAiProvider('openai')}
                      style={{
                        flex: 1,
                        padding: '0.6rem',
                        borderRadius: '10px',
                        border: aiProvider === 'openai' ? '2px solid var(--primary-color)' : '1px solid var(--card-border)',
                        background: aiProvider === 'openai' ? 'var(--primary-light)' : '#fff',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      OpenAI (ChatGPT)
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                    {aiProvider === 'gemini' ? 'Gemini API Key' : 'OpenAI API Key'}:
                  </label>
                  <input
                    type="password"
                    placeholder={aiProvider === 'gemini' ? 'AIzaSy...' : 'sk-...'}
                    value={aiKeyInput}
                    onChange={(e) => setAiKeyInput(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--card-border)', outline: 'none', fontSize: '0.9rem' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowAiModal(false)}
                    style={{ padding: '0.6rem 1.2rem', borderRadius: '10px', border: '1px solid var(--card-border)', background: '#fff', cursor: 'pointer' }}
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingKey || !aiKeyInput.trim()}
                    className="btn-primary"
                    style={{ padding: '0.6rem 1.5rem', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <Key size={16} />
                    <span>{isSavingKey ? 'جاري الحفظ...' : 'حفظ وتفعيل'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Main Grid: Chat List + Transcript & Response Controls */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(330px, 390px) 1fr', gap: '1.5rem', alignItems: 'start' }}>
          
          {/* Chat List Column */}
          <div className="glass" style={{ borderRadius: '20px', padding: '1.2rem', maxHeight: '820px', display: 'flex', flexDirection: 'column' }}>
            
            {/* Search bar */}
            <div style={{ position: 'relative', marginBottom: '1rem' }}>
              <Search size={16} style={{ position: 'absolute', top: '12px', right: '12px', color: 'var(--text-muted)' }} />
              <input 
                type="text"
                placeholder="بحث باسم المريض أو الهاتف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 2.2rem 0.6rem 0.8rem',
                  borderRadius: '12px',
                  border: '1px solid var(--card-border)',
                  background: 'rgba(255, 255, 255, 0.95)',
                  outline: 'none',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            {/* Status Filter Chips */}
            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem' }}>
              {[
                { id: 'all', label: 'الكل' },
                { id: 'takeover', label: `تدخل بشري (${urgentChats.length}) 🔴` },
                { id: 'ai', label: 'ذكاء اصطناعي 🟢' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  style={{
                    flex: 1,
                    padding: '0.45rem 0.5rem',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: filter === f.id ? 'var(--primary-color)' : 'rgba(255,255,255,0.7)',
                    color: filter === f.id ? '#fff' : 'var(--text-main)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Conversations List */}
            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.2rem' }}>
              {filteredChats.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  <MessageSquare size={32} style={{ margin: '0 auto 0.5rem auto', opacity: 0.4 }} />
                  <p style={{ fontSize: '0.9rem' }}>لا توجد محادثات مطابقة حالياً</p>
                </div>
              ) : (
                filteredChats.map(chat => {
                  const isSelected = selectedSessionId === chat.sessionId;
                  const hasCompleted = Boolean(
                    chat.state?.lastConfirmedBooking || 
                    chat.state?.bookingDraft?.confirmed || 
                    (chat.state?.confirmedAppointments && chat.state.confirmedAppointments.length > 0)
                  );
                  const isUrgent = !hasCompleted && (chat.takeoverRequested === true || chat.status === 'takeover_requested' || chat.state?.takeoverRequested === true) && !chat.isTakenOver;
                  const isTakenOver = chat.isTakenOver;

                  return (
                    <div
                      key={chat.sessionId}
                      onClick={() => handleSelectChat(chat)}
                      style={{
                        padding: '0.95rem 1rem',
                        borderRadius: '14px',
                        marginBottom: '0.65rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        border: isUrgent 
                          ? '2px solid #f43f5e'
                          : isSelected 
                            ? '2px solid var(--primary-color)' 
                            : '1px solid rgba(13, 148, 136, 0.12)',
                        background: isUrgent
                          ? '#fff1f2'
                          : isSelected 
                            ? 'rgba(204, 251, 241, 0.5)' 
                            : 'rgba(255, 255, 255, 0.85)',
                        boxShadow: isUrgent ? '0 4px 12px rgba(244, 63, 94, 0.15)' : isSelected ? 'var(--shadow-sm)' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                        <strong style={{ fontSize: '0.95rem', color: isUrgent ? '#9f1239' : 'var(--text-main)' }}>
                          {chat.patientName || 'مريض زائر'}
                        </strong>
                        {isUrgent ? (
                          <span style={{ background: '#f43f5e', color: '#fff', fontSize: '0.7rem', fontWeight: 800, padding: '0.2rem 0.55rem', borderRadius: '50px' }}>
                            طلب تدخل عاجل 🔴
                          </span>
                        ) : isTakenOver ? (
                          <span style={{ background: '#fef3c7', color: '#b45309', fontSize: '0.7rem', fontWeight: 800, padding: '0.2rem 0.55rem', borderRadius: '50px' }}>
                            مستلمة بالسكرتارية 👩‍💼
                          </span>
                        ) : (
                          <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '0.7rem', fontWeight: 800, padding: '0.2rem 0.55rem', borderRadius: '50px' }}>
                            نورا AI 🟢
                          </span>
                        )}
                      </div>

                      <p style={{ fontSize: '0.82rem', color: isUrgent ? '#be123c' : 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '0.4rem' }}>
                        {chat.lastMessage || 'محادثة جديدة...'}
                      </p>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <span>🩺 {chat.doctor || 'عام'}</span>
                        {chat.phone && chat.phone !== 'غير متوفر' && <span>📞 {chat.phone}</span>}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Selected Chat Transcript & Response Actions Column */}
          <div className="glass" style={{ borderRadius: '20px', padding: '1.5rem', minHeight: '700px', display: 'flex', flexDirection: 'column' }}>
            {selectedChat ? (
              <>
                {/* Header Details */}
                <div style={{ borderBottom: '1px solid var(--card-border)', paddingBottom: '1.2rem', marginBottom: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
                      <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        {selectedChat.patientName || 'مريض زائر'}
                      </h2>
                      {selectedChat.phone && selectedChat.phone !== 'غير متوفر' && (
                        <span style={{ background: 'var(--primary-light)', color: 'var(--primary-hover)', padding: '0.25rem 0.7rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 700 }}>
                          📞 {selectedChat.phone}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      <span>معرف الجلسة: <code>{selectedChat.sessionId}</code></span>
                      <span style={{ margin: '0 0.5rem' }}>•</span>
                      <span>العيادة: <strong>{selectedChat.doctor || 'غير محدد'}</strong></span>
                    </div>
                  </div>

                  {/* Takeover Action Toggle */}
                  <div>
                    <button
                      onClick={handleToggleTakeover}
                      style={{
                        padding: '0.65rem 1.4rem',
                        borderRadius: '12px',
                        border: 'none',
                        fontWeight: 800,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: selectedChat.isTakenOver ? '#ef4444' : '#0d9488',
                        color: '#fff',
                        boxShadow: 'var(--shadow-sm)'
                      }}
                    >
                      {selectedChat.isTakenOver ? (
                        <>
                          <Bot size={18} />
                          <span>إعادة للرد الآلي (نورا)</span>
                        </>
                      ) : (
                        <>
                          <UserCheck size={18} />
                          <span>استلام المحادثة (تدخل بشري)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Status Banner */}
                {selectedChat.isTakenOver ? (
                  <div style={{ background: '#fef3c7', border: '1px solid #fde68a', color: '#92400e', padding: '0.7rem 1.2rem', borderRadius: '12px', fontSize: '0.88rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                    <UserCheck size={18} color="#b45309" />
                    <span>المحادثة مستلمة حالياً بواسطة: <strong>{selectedChat.agentName || agentName}</strong> (أنت تتحدث مباشرة مع المريض الآن)</span>
                  </div>
                ) : (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '0.7rem 1.2rem', borderRadius: '12px', fontSize: '0.88rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                    <Sparkles size={18} color="#16a34a" />
                    <span>نورا (الذكاء الاصطناعي) تدير المحادثة آلياً وبتوجيه طبي دقيق</span>
                  </div>
                )}

                {/* Chat History Transcript - Solves Messages Not Showing Bug */}
                <div 
                  className="chat-transcript-area" 
                  style={{ 
                    flex: 1, 
                    overflowY: 'auto', 
                    background: 'rgba(255, 255, 255, 0.8)', 
                    borderRadius: '16px', 
                    padding: '1.2rem', 
                    marginBottom: '1rem', 
                    minHeight: '400px', 
                    maxHeight: '480px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.8rem',
                    border: '1px solid var(--card-border)'
                  }}
                >
                  {(!selectedChat.history || selectedChat.history.length === 0) ? (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                      <p style={{ fontSize: '0.95rem', fontWeight: 600 }}>لا توجد رسائل مسجلة في هذه المحادثة حتى الآن.</p>
                      <p style={{ fontSize: '0.82rem', marginTop: '0.3rem' }}>يمكنك إرسال رد مباشر إلى المريض من شريط الرسائل بالأسفل.</p>
                    </div>
                  ) : (
                    selectedChat.history.map((msg, index) => {
                      const isUser = msg.sender === 'user';
                      const isHumanSec = msg.sender === 'human_agent';

                      return (
                        <div 
                          key={index} 
                          style={{ 
                            display: 'flex', 
                            justifyContent: isUser ? 'flex-start' : 'flex-end',
                            width: '100%'
                          }}
                        >
                          <div 
                            style={{ 
                              maxWidth: '78%', 
                              padding: '0.85rem 1.2rem', 
                              borderRadius: '16px',
                              background: isUser 
                                ? 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)' 
                                : isHumanSec 
                                  ? '#fffbeb' 
                                  : '#f8fafc',
                              color: isUser ? '#ffffff' : 'var(--text-main)',
                              border: isHumanSec 
                                ? '2px solid #f59e0b' 
                                : isUser 
                                  ? 'none' 
                                  : '1px solid #e2e8f0',
                              boxShadow: '0 3px 10px rgba(0,0,0,0.06)'
                            }}
                          >
                            <div style={{ 
                              fontSize: '0.78rem', 
                              fontWeight: 800, 
                              marginBottom: '0.3rem', 
                              color: isUser ? '#ccfbf1' : isHumanSec ? '#b45309' : 'var(--primary-color)' 
                            }}>
                              {isUser ? `👤 ${selectedChat.patientName || 'المريض'}` : isHumanSec ? `👩‍💼 ${msg.agentName || agentName} (تدخل بشري)` : '🤖 نورا (AI)'}
                            </div>
                            <div style={{ fontSize: '0.92rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                              {msg.text}
                            </div>
                            {msg.timestamp && (
                              <div style={{ fontSize: '0.7rem', opacity: 0.75, marginTop: '0.35rem', textAlign: isUser ? 'right' : 'left' }}>
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={transcriptEndRef} />
                </div>

                {/* Quick Template Chips */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.9rem' }}>
                  {quickTemplates.map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(tmpl)}
                      style={{
                        background: 'rgba(255,255,255,0.92)',
                        border: '1px solid var(--card-border)',
                        padding: '0.4rem 0.8rem',
                        borderRadius: '20px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        color: 'var(--text-main)',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = 'var(--primary-light)'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.92)'}
                    >
                      💬 {tmpl.length > 40 ? tmpl.slice(0, 40) + '...' : tmpl}
                    </button>
                  ))}
                </div>

                {/* Secretary Reply Box */}
                <div style={{ display: 'flex', gap: '0.7rem' }}>
                  <input
                    type="text"
                    placeholder="اكتب رداً رسمياً ومباشراً للمريض..."
                    value={secretaryReply}
                    onChange={(e) => setSecretaryReply(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    style={{
                      flex: 1,
                      padding: '0.85rem 1.2rem',
                      borderRadius: '12px',
                      border: '1px solid var(--card-border)',
                      background: '#fff',
                      outline: 'none',
                      fontSize: '0.92rem'
                    }}
                  />
                  <button
                    className="btn-primary"
                    onClick={() => handleSendMessage()}
                    disabled={isSending || !secretaryReply.trim()}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.85rem 1.6rem',
                      borderRadius: '12px',
                      fontWeight: 800
                    }}
                  >
                    <Send size={16} style={{ transform: 'rotate(180deg)' }} />
                    <span>{isSending ? 'جاري الإرسال...' : 'إرسال رد السكرتارية'}</span>
                  </button>
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', textAlign: 'center', padding: '4rem 2rem' }}>
                <Users size={54} style={{ opacity: 0.3, marginBottom: '1.2rem' }} />
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.6rem', color: 'var(--text-main)' }}>اختر محادثة من القائمة لمتابعتها</h3>
                <p style={{ maxWidth: '420px', fontSize: '0.92rem', lineHeight: '1.6' }}>
                  يمكنك متابعة رسائل المرضى والرد الآلي لحظة بلحظة، أو التدخل البشري واستلام المحادثة فورياً عند طلب المريض للإدارة أو السكرتارية.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
