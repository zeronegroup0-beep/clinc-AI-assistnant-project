import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, Calendar, BarChart3, Clock, CheckCircle2, AlertCircle, RefreshCw, 
  ShieldCheck, MessageSquare, UserCheck, Send, Ban, Plus, Trash2, XCircle,
  Phone, Sparkles, User, AlertTriangle, Stethoscope, ExternalLink
} from 'lucide-react';
import DoctorScheduleMatrix from './DoctorScheduleMatrix';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('chats'); // 'chats' | 'appointments' | 'blacklist'
  const [appointments, setAppointments] = useState([]);
  const [waitlist, setWaitlist] = useState([]);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [selectedChatDetails, setSelectedChatDetails] = useState(null);
  const [humanReplyText, setHumanReplyText] = useState('');
  const [blacklist, setBlacklist] = useState([]);
  const [newBlacklistWord, setNewBlacklistWord] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const apiUrl = import.meta.env.VITE_API_URL || '/api';

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [aptRes, wtlRes, chatsRes, blRes] = await Promise.all([
        fetch(`${apiUrl}/appointments`).then(r => r.json()),
        fetch(`${apiUrl}/waitlist`).then(r => r.json()),
        fetch(`${apiUrl}/admin/chats`).then(r => r.json()).catch(() => ({ success: false, data: [] })),
        fetch(`${apiUrl}/admin/blacklist`).then(r => r.json()).catch(() => ({ success: false, data: [] }))
      ]);

      if (aptRes.success) setAppointments(aptRes.data || []);
      if (wtlRes.success) setWaitlist(wtlRes.data || []);
      if (chatsRes.success) setChats(chatsRes.data || []);
      if (blRes.success) setBlacklist(blRes.data || []);

      // Refresh selected chat if open
      if (selectedChat) {
        fetchChatDetails(selectedChat.sessionId);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
      setError('تعذر الاتصال بالخادم لجلب البيانات الحية');
    } finally {
      setLoading(false);
    }
  };

  const fetchChatDetails = async (sessionId) => {
    try {
      const res = await fetch(`${apiUrl}/admin/chats/${sessionId}`).then(r => r.json());
      if (res.success && res.data) {
        setSelectedChatDetails(res.data);
      }
    } catch (err) {
      console.error('Error fetching chat details:', err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
    fetchChatDetails(chat.sessionId);
  };

  const handleToggleTakeover = async (sessionId, currentTakenOver) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${apiUrl}/admin/chats/${sessionId}/takeover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isTakenOver: !currentTakenOver,
          agentName: 'موظفة الاستقبال سارة'
        })
      }).then(r => r.json());

      if (res.success) {
        setSuccessMsg(res.message);
        setTimeout(() => setSuccessMsg(null), 4000);
        fetchChatDetails(sessionId);
        fetchData();
      }
    } catch (err) {
      setError('فشل تعديل وضع الاستلام');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendHumanMessage = async (e) => {
    e.preventDefault();
    if (!humanReplyText.trim() || !selectedChat) return;

    setActionLoading(true);
    try {
      const res = await fetch(`${apiUrl}/admin/chats/${selectedChat.sessionId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: humanReplyText.trim(),
          agentName: 'موظفة الاستقبال سارة'
        })
      }).then(r => r.json());

      if (res.success) {
        setHumanReplyText('');
        fetchChatDetails(selectedChat.sessionId);
        fetchData();
      }
    } catch (err) {
      setError('فشل إرسال الرسالة إلى المريض');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddBlacklist = async (e) => {
    e.preventDefault();
    if (!newBlacklistWord.trim()) return;

    try {
      const res = await fetch(`${apiUrl}/admin/blacklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: newBlacklistWord.trim() })
      }).then(r => r.json());

      if (res.success) {
        setBlacklist(res.data);
        setNewBlacklistWord('');
        setSuccessMsg(res.message);
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err) {
      setError('فشل إضافة الكلمة');
    }
  };

  const handleDeleteBlacklist = async (word) => {
    try {
      const res = await fetch(`${apiUrl}/admin/blacklist/${encodeURIComponent(word)}`, {
        method: 'DELETE'
      }).then(r => r.json());

      if (res.success) {
        setBlacklist(res.data);
      }
    } catch (err) {
      setError('فشل حذف الكلمة');
    }
  };

  const handleCancelAppointment = async (bookingId, phone) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في إلغاء هذا الحجز؟')) return;
    try {
      const res = await fetch(`${apiUrl}/appointments/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, phone })
      }).then(r => r.json());

      if (res.success) {
        setSuccessMsg(res.message);
        setTimeout(() => setSuccessMsg(null), 4000);
        fetchData();
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError('فشل إلغاء الحجز');
    }
  };

  return (
    <div className="admin-standalone-portal" dir="rtl" style={{ minHeight: '100vh', background: 'var(--bg-main)', paddingBottom: '3rem' }}>
      
      {/* Dedicated Admin Portal Header Bar */}
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
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: '#0f766e', padding: '0.5rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={24} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-main)' }}>
                سمارت كلينك AI
              </span>
              <span style={{ background: '#f0fdf4', color: '#15803d', fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '50px', border: '1px solid #bbf7d0' }}>
                لوحة الإدارة العامة
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              إدارة الحجوزات وقوائم الانتظار وفلترة الكلمات والرقابة الطبية
            </div>
          </div>
        </div>

        {/* Portal Quick Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <button className="refresh-btn glass" onClick={fetchData} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.9rem', borderRadius: '10px', fontSize: '0.82rem', cursor: 'pointer' }}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>تحديث البيانات</span>
          </button>

          {/* Link to Secretary Portal */}
          <Link 
            to="/secretary" 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 1rem',
              borderRadius: '10px',
              background: 'var(--primary-color)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.82rem',
              textDecoration: 'none',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <Users size={15} />
            <span>غرفة السكرتارية الحية 👩‍💼</span>
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

      <div className="dashboard-container" style={{ padding: '0 2rem' }}>
        {/* Header */}
        <div className="dashboard-header" style={{ marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>مركز العمليات والتحكم الإداري</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              مراقبة وتنسيق المواعيد والأكواد وقوائم الانتظار وفلاتر المحادثات
            </p>
          </div>
        </div>

      {error && (
        <div className="admin-alert-banner" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.75rem 1rem', borderRadius: '10px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.75rem 1rem', borderRadius: '10px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="dashboard-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="stat-card glass">
          <div className="stat-card-header">
            <span className="stat-title">المحادثات النشطة</span>
            <MessageSquare size={22} color="#0d9488" />
          </div>
          <span className="stat-value">{chats.length}</span>
          <span className="stat-sub">مرضى يتحدثون مع الوكيل الآن</span>
        </div>

        <div className="stat-card glass">
          <div className="stat-card-header">
            <span className="stat-title">الحجوزات المؤكدة</span>
            <Calendar size={22} color="var(--primary-color)" />
          </div>
          <span className="stat-value">{appointments.filter(a => a.status !== 'cancelled').length}</span>
          <span className="stat-sub">أكواد فريدة (SC-XXXXX)</span>
        </div>

        <div className="stat-card glass">
          <div className="stat-card-header">
            <span className="stat-title">قائمة الانتظار</span>
            <Clock size={22} color="#f59e0b" />
          </div>
          <span className="stat-value">{waitlist.length}</span>
          <span className="stat-sub">في انتظار إشعار الواتساب</span>
        </div>

        <div className="stat-card glass">
          <div className="stat-card-header">
            <span className="stat-title">القائمة السوداء للكلمات</span>
            <Ban size={22} color="#ef4444" />
          </div>
          <span className="stat-value">{blacklist.length}</span>
          <span className="stat-sub">كلمات ممنوعة تخضع للفلترة</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
        <button 
          onClick={() => setActiveTab('chats')} 
          style={{ 
            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', 
            background: 'none', border: 'none', 
            borderBottom: activeTab === 'chats' ? '2px solid var(--primary-color)' : '2px solid transparent',
            color: activeTab === 'chats' ? 'var(--primary-color)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'chats' ? 700 : 500, cursor: 'pointer' 
          }}
        >
          <MessageSquare size={18} />
          <span>المراقبة الحية والتدخل البشري (Live Monitor)</span>
          <span style={{ background: '#0d9488', color: '#fff', fontSize: '0.75rem', padding: '0.1rem 0.5rem', borderRadius: '999px' }}>{chats.length}</span>
        </button>

        <button 
          onClick={() => setActiveTab('schedule')} 
          style={{ 
            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', 
            background: 'none', border: 'none', 
            borderBottom: activeTab === 'schedule' ? '2px solid var(--primary-color)' : '2px solid transparent',
            color: activeTab === 'schedule' ? 'var(--primary-color)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'schedule' ? 700 : 500, cursor: 'pointer' 
          }}
        >
          <Calendar size={18} />
          <span>جدول المواعيد الأسبوعي (Doctor Matrix)</span>
        </button>

        <button 
          onClick={() => setActiveTab('appointments')} 
          style={{ 
            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', 
            background: 'none', border: 'none', 
            borderBottom: activeTab === 'appointments' ? '2px solid var(--primary-color)' : '2px solid transparent',
            color: activeTab === 'appointments' ? 'var(--primary-color)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'appointments' ? 700 : 500, cursor: 'pointer' 
          }}
        >
          <Clock size={18} />
          <span>سجل الحجوزات وقوائم الانتظار</span>
        </button>

        <button 
          onClick={() => setActiveTab('blacklist')} 
          style={{ 
            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', 
            background: 'none', border: 'none', 
            borderBottom: activeTab === 'blacklist' ? '2px solid var(--primary-color)' : '2px solid transparent',
            color: activeTab === 'blacklist' ? 'var(--primary-color)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'blacklist' ? 700 : 500, cursor: 'pointer' 
          }}
        >
          <Ban size={18} />
          <span>إدارة القائمة السوداء (Forbidden Words)</span>
        </button>
      </div>

      {/* TAB 1: Live Chat Monitor & Human Takeover */}
      {activeTab === 'chats' && (
        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '1.5rem', minHeight: '520px' }}>
          {/* Chat Sessions Sidebar */}
          <div className="glass" style={{ borderRadius: '16px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '600px', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', margin: 0 }}>
              المحادثات الجارية ({chats.length})
            </h3>
            {chats.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                لا توجد محادثات نشطة حالياً
              </div>
            ) : (
              chats.map((c) => {
                const isSelected = selectedChat && selectedChat.sessionId === c.sessionId;
                return (
                  <div
                    key={c.sessionId}
                    onClick={() => handleSelectChat(c)}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(13, 148, 136, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      border: isSelected ? '1px solid #0d9488' : '1px solid transparent',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{c.patientName}</strong>
                      <span style={{ 
                        fontSize: '0.7rem', 
                        fontWeight: 600, 
                        padding: '0.15rem 0.4rem', 
                        borderRadius: '4px',
                        background: c.isTakenOver ? '#f59e0b' : '#10b981',
                        color: '#fff'
                      }}>
                        {c.isTakenOver ? 'تدخل بشري' : 'رد آلي (نورا)'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.lastMessage || 'بدء المحادثة...'}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{c.doctor || 'عام'}</span>
                      <span>{c.phone !== 'غير متوفر' ? c.phone : ''}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Chat Details & Takeover View */}
          <div className="glass" style={{ borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '600px' }}>
            {selectedChatDetails ? (
              <>
                {/* Chat Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem' }}>{selectedChatDetails.patientName || 'مريض زائر'}</h3>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      رقم الهاتف: {selectedChatDetails.phone || 'لم يُسجل بعد'} • الطبيب: {selectedChatDetails.doctor || 'عام'}
                    </span>
                  </div>

                  {/* Takeover Action Button */}
                  <button
                    onClick={() => handleToggleTakeover(selectedChatDetails.sessionId, selectedChatDetails.isTakenOver)}
                    disabled={actionLoading}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.6rem 1.25rem',
                      borderRadius: '10px',
                      border: 'none',
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: selectedChatDetails.isTakenOver ? '#ef4444' : '#0d9488',
                      color: '#fff'
                    }}
                  >
                    {selectedChatDetails.isTakenOver ? (
                      <>
                        <Sparkles size={16} />
                        <span>إعادة للرد الآلي (نورا)</span>
                      </>
                    ) : (
                      <>
                        <UserCheck size={16} />
                        <span>استلام المحادثة (تدخل بشري)</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Messages Transcript */}
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.5rem', marginBottom: '1rem' }}>
                  {(selectedChatDetails.history || []).map((msg, idx) => {
                    const isUser = msg.sender === 'user' || msg.user;
                    const isHuman = msg.sender === 'human_agent';
                    const content = msg.text || msg.bot || msg.user || '';

                    return (
                      <div
                        key={idx}
                        style={{
                          alignSelf: isUser ? 'flex-end' : 'flex-start',
                          maxWidth: '80%',
                          padding: '0.85rem 1.1rem',
                          borderRadius: '14px',
                          background: isUser ? 'var(--primary-color)' : (isHuman ? '#f59e0b' : '#f8fafc'),
                          color: isUser || isHuman ? '#ffffff' : '#0f172a',
                          border: isUser ? 'none' : (isHuman ? '1px solid #d97706' : '1px solid #cbd5e1'),
                          fontSize: '0.92rem',
                          lineHeight: 1.55,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                        }}
                      >
                        <div style={{ 
                          fontSize: '0.75rem', 
                          color: isUser || isHuman ? 'rgba(255,255,255,0.9)' : '#0d9488', 
                          marginBottom: '0.35rem', 
                          fontWeight: 700 
                        }}>
                          {isUser ? 'المريض' : (isHuman ? `موظفة الاستقبال سارة` : 'نورا (الوكيل الطبي الذكي)')}
                        </div>
                        <div style={{ whiteSpace: 'pre-wrap', color: isUser || isHuman ? '#ffffff' : '#1e293b' }}>{content}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Human Reply Input Box */}
                {selectedChatDetails.isTakenOver ? (
                  <form onSubmit={handleSendHumanMessage} style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                    <input
                      type="text"
                      value={humanReplyText}
                      onChange={(e) => setHumanReplyText(e.target.value)}
                      placeholder="اكتب ردك المباشر للمريض هنا..."
                      style={{
                        flex: 1,
                        padding: '0.75rem 1rem',
                        borderRadius: '10px',
                        border: '1px solid var(--border-color)',
                        background: 'rgba(255,255,255,0.05)',
                        color: 'var(--text-primary)',
                        fontSize: '0.95rem'
                      }}
                    />
                    <button
                      type="submit"
                      disabled={actionLoading || !humanReplyText.trim()}
                      style={{
                        padding: '0.75rem 1.5rem',
                        background: '#0d9488',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '10px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <Send size={16} />
                      <span>إرسال</span>
                    </button>
                  </form>
                ) : (
                  <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    المحادثة تحت إدارة الرد الآلي (نورا). اضغط على زر "استلام المحادثة" للرد كإنسان.
                  </div>
                )}
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, flexDirection: 'column', gap: '1rem', color: 'var(--text-muted)' }}>
                <MessageSquare size={48} opacity={0.3} />
                <span>اختر محادثة من القائمة لعرض تفاصيلها والتدخل البشري</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Doctor Schedule Matrix */}
      {activeTab === 'schedule' && (
        <div className="animate-slide-up" style={{ marginBottom: '2rem' }}>
          <DoctorScheduleMatrix onBookingSuccess={() => fetchData()} />
        </div>
      )}

      {/* TAB 3: Appointments & Waitlist */}
      {activeTab === 'appointments' && (
        <div className="admin-tables-grid">
          {/* Appointments Table */}
          <div className="admin-table-card glass animate-slide-up">
            <div className="table-card-title">
              <Calendar size={18} color="var(--primary-color)" />
              <h3>الحجوزات الحالية للعيادة ({appointments.length})</h3>
            </div>

            <div className="table-wrapper">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>كود الحجز</th>
                    <th>المريض</th>
                    <th>الطبيب</th>
                    <th>الموعد</th>
                    <th>الهاتف</th>
                    <th>الحالة</th>
                    <th>إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="empty-cell">لا توجد حجوزات مسجلة بعد</td>
                    </tr>
                  ) : (
                    appointments.map((apt, i) => (
                      <tr key={apt.id || i}>
                        <td><strong style={{ color: '#0d9488' }}>{apt.id || apt.bookingId}</strong></td>
                        <td><strong>{apt.patientName}</strong></td>
                        <td>{apt.doctor}</td>
                        <td>{apt.date} - {apt.time}</td>
                        <td dir="ltr" style={{ textAlign: 'right' }}>{apt.phone}</td>
                        <td>
                          <span className={`status-badge ${apt.status === 'cancelled' ? 'cancelled' : 'confirmed'}`}>
                            {apt.status === 'cancelled' ? <XCircle size={12} /> : <CheckCircle2 size={12} />}
                            <span>{apt.status === 'cancelled' ? 'ملغى' : 'مؤكد'}</span>
                          </span>
                        </td>
                        <td>
                          {apt.status !== 'cancelled' && (
                            <button
                              onClick={() => handleCancelAppointment(apt.id || apt.bookingId, apt.phone)}
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                            >
                              إلغاء الحجز
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Waitlist Table */}
          <div className="admin-table-card glass animate-slide-up">
            <div className="table-card-title">
              <Clock size={18} color="#f59e0b" />
              <h3>قائمة الانتظار الذكية ({waitlist.length})</h3>
            </div>

            <div className="table-wrapper">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>كود الانتظار</th>
                    <th>المريض</th>
                    <th>الموعد المطلوب</th>
                    <th>الطبيب</th>
                    <th>الهاتف للتنبيه</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {waitlist.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="empty-cell">قائمة الانتظار فارغة حالياً</td>
                    </tr>
                  ) : (
                    waitlist.map((wtl, i) => (
                      <tr key={wtl.id || i}>
                        <td><strong style={{ color: '#f59e0b' }}>{wtl.id}</strong></td>
                        <td><strong>{wtl.patientName}</strong></td>
                        <td>{wtl.requestedDate} - {wtl.requestedTime}</td>
                        <td>{wtl.doctor}</td>
                        <td dir="ltr" style={{ textAlign: 'right' }}>{wtl.phone}</td>
                        <td>
                          <span className="status-badge pending">
                            <Clock size={12} />
                            <span>في الانتظار</span>
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Dynamic Blacklist Manager */}
      {activeTab === 'blacklist' && (
        <div className="glass" style={{ borderRadius: '16px', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Ban size={20} color="#ef4444" />
                <span>إدارة القائمة السوداء للكلمات المحظورة ({blacklist.length})</span>
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                أي كلمة في هذه القائمة تُحظر من التقاطها كاسم مريض فورياً وتمنع التشتت والهلوسة
              </p>
            </div>

            <form onSubmit={handleAddBlacklist} style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={newBlacklistWord}
                onChange={(e) => setNewBlacklistWord(e.target.value)}
                placeholder="إضافة كلمة ممنوعة جديدة..."
                style={{
                  padding: '0.6rem 1rem',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem'
                }}
              />
              <button
                type="submit"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.6rem 1rem',
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Plus size={16} />
                <span>إضافة</span>
              </button>
            </form>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', maxHeight: '420px', overflowY: 'auto', padding: '0.5rem' }}>
            {blacklist.map((word, idx) => (
              <span
                key={idx}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: 'rgba(239, 68, 68, 0.12)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: 600
                }}
              >
                <span>{word}</span>
                <Trash2
                  size={14}
                  style={{ cursor: 'pointer', opacity: 0.8 }}
                  onClick={() => handleDeleteBlacklist(word)}
                />
              </span>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
