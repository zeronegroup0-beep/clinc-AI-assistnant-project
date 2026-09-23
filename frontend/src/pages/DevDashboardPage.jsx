import React, { useState, useEffect } from 'react';
import { 
  Activity, Play, CheckCircle2, XCircle, AlertTriangle, Clock, 
  Cpu, Terminal, ArrowRight, ShieldCheck, Database, RefreshCw, 
  ExternalLink, Sparkles, MessageSquare, User, Bot, HelpCircle,
  Eye, ChevronRight, X, Filter, Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DevDashboardPage() {
  const [data, setData] = useState(null);
  const [memoryBank, setMemoryBank] = useState([]);
  const [loading, setLoading] = useState(true);
  const [runningSim, setRunningSim] = useState(false);
  const [activeTab, setActiveTab] = useState('simulations'); // 'simulations' | 'memory-bank'
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'PASSED' | 'FAILED'
  const [selectedSession, setSelectedSession] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);

  // Fetch QA Logs
  const fetchLogs = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetch('/api/dev/logs');
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      } else {
        setErrorMsg('لم يتم العثور على سجلات سابقة.');
      }
    } catch (err) {
      console.error('Error fetching QA logs:', err);
      setErrorMsg('تعذر الاتصال بخادم الـ API لجلب السجلات.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Memory Bank
  const fetchMemoryBank = async () => {
    try {
      const res = await fetch('/api/dev/memory-bank');
      const json = await res.json();
      if (json.success && json.data) {
        setMemoryBank(json.data);
      }
    } catch (err) {
      console.error('Error fetching memory bank:', err);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchMemoryBank();
  }, []);

  // Trigger Live Simulation
  const handleRunSimulation = async () => {
    try {
      setRunningSim(true);
      setErrorMsg(null);
      const res = await fetch('/api/dev/run-simulation', { method: 'POST' });
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      } else {
        setErrorMsg(json.message || 'فشل تشغيل المحاكاة.');
      }
    } catch (err) {
      console.error('Simulation error:', err);
      setErrorMsg('حدث خطأ أثناء الاتصال بالخادم لتشغيل المحاكاة.');
    } finally {
      setRunningSim(false);
    }
  };

  const summary = data?.summary || {
    totalRuns: 0,
    passed: 0,
    failed: 0,
    passRate: '0%',
    passRateNum: 0,
    activeModels: ['gemini-3.6-flash', 'Nora-Hybrid-RuleCore'],
    durationMs: 0,
    avgTurns: 0,
    lastRun: null
  };

  const sessions = data?.sessions || [];

  const filteredSessions = sessions.filter(s => {
    if (filterStatus === 'PASSED' && s.status !== 'PASSED') return false;
    if (filterStatus === 'FAILED' && s.status !== 'FAILED') return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchScen = s.scenario?.toLowerCase().includes(q);
      const matchPersona = s.persona?.name?.toLowerCase().includes(q);
      const matchCritique = s.critique?.toLowerCase().includes(q);
      return matchScen || matchPersona || matchCritique;
    }
    return true;
  });

  return (
    <div className="matrix-dashboard-root" dir="rtl">
      {/* Top Cyber Grid Header */}
      <header className="matrix-header">
        <div className="matrix-header-left">
          <div className="matrix-badge">
            <span className="matrix-ping-dot"></span>
            <span>DEVELOPER MATRIX AUDIT SYSTEM v2.5</span>
          </div>
          <h1 className="matrix-title">
            <Terminal size={26} className="matrix-title-icon" />
            <span>لوحة تحكم المطورين // نظام المحاكاة الذاتية لنورا AI</span>
          </h1>
          <p className="matrix-subtitle">
            Autonomous Self-Play Engine, Few-Shot Memory Bank & Multi-Turn Verification Matrix
          </p>
        </div>

        <div className="matrix-header-actions">
          <button 
            className="matrix-btn matrix-btn-ghost" 
            onClick={fetchLogs}
            disabled={loading || runningSim}
            title="تحديث البيانات"
          >
            <RefreshCw size={16} className={loading ? 'spin-icon' : ''} />
            <span>تحديث</span>
          </button>

          <button 
            className="matrix-btn matrix-btn-primary"
            onClick={handleRunSimulation}
            disabled={runningSim}
          >
            {runningSim ? (
              <>
                <RefreshCw size={16} className="spin-icon" />
                <span>جاري تشغيل المعركة الذاتية...</span>
              </>
            ) : (
              <>
                <Zap size={16} />
                <span>تشغيل محاكاة اللعب الذاتي (Live)</span>
              </>
            )}
          </button>

          <Link to="/" className="matrix-btn matrix-btn-outline">
            <span>العودة للعيادة</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      {/* Error alert if any */}
      {errorMsg && (
        <div className="matrix-alert-box">
          <AlertTriangle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <section className="matrix-stats-grid">
        <div className="matrix-stat-card glow-emerald">
          <div className="matrix-stat-header">
            <span className="matrix-stat-label">معدل النجاح الإجمالي</span>
            <CheckCircle2 size={20} className="matrix-icon-emerald" />
          </div>
          <div className="matrix-stat-value emerald-text">
            {summary.passRate || '0%'}
          </div>
          <div className="matrix-stat-footer">
            <span>{summary.passed} سيناريوهات ناجحة من أصل {summary.totalRuns}</span>
          </div>
        </div>

        <div className="matrix-stat-card glow-indigo">
          <div className="matrix-stat-header">
            <span className="matrix-stat-label">الموديلات النشطة</span>
            <Cpu size={20} className="matrix-icon-indigo" />
          </div>
          <div className="matrix-stat-value indigo-text font-mono" style={{ fontSize: '1.25rem' }}>
            {summary.activeModels?.[0] || 'gemini-3.6-flash'}
          </div>
          <div className="matrix-stat-footer">
            <span>+ {summary.activeModels?.[1] || 'Rule Engine'} (Hybrid Dual-Engine)</span>
          </div>
        </div>

        <div className="matrix-stat-card glow-blue">
          <div className="matrix-stat-header">
            <span className="matrix-stat-label">متوسط الأدوار / السيناريو</span>
            <MessageSquare size={20} className="matrix-icon-blue" />
          </div>
          <div className="matrix-stat-value blue-text">
            {summary.avgTurns || 2.5} <span className="stat-unit">أدوار</span>
          </div>
          <div className="matrix-stat-footer">
            <span>محادثات تفاوضية متكاملة 3-5 Turns</span>
          </div>
        </div>

        <div className="matrix-stat-card glow-amber">
          <div className="matrix-stat-header">
            <span className="matrix-stat-label">زمن تنفيذ المحاكاة الكاملة</span>
            <Clock size={20} className="matrix-icon-amber" />
          </div>
          <div className="matrix-stat-value amber-text font-mono">
            {(summary.durationMs / 1000).toFixed(2)}s
          </div>
          <div className="matrix-stat-footer">
            <span>آخر تشغيل: {summary.lastRun ? new Date(summary.lastRun).toLocaleTimeString('ar-EG') : 'منذ قليل'}</span>
          </div>
        </div>
      </section>

      {/* Tabs Navigation */}
      <div className="matrix-tabs-bar">
        <button 
          className={`matrix-tab-btn ${activeTab === 'simulations' ? 'active' : ''}`}
          onClick={() => setActiveTab('simulations')}
        >
          <Activity size={18} />
          <span>نتائج سيناريوهات المحاكاة ({sessions.length})</span>
        </button>

        <button 
          className={`matrix-tab-btn ${activeTab === 'memory-bank' ? 'active' : ''}`}
          onClick={() => setActiveTab('memory-bank')}
        >
          <Database size={18} />
          <span>بنك الذاكرة المرجعي (Gold Standards) ({memoryBank.length})</span>
        </button>
      </div>

      {/* TAB 1: Simulations View */}
      {activeTab === 'simulations' && (
        <section className="matrix-section">
          {/* Controls Bar */}
          <div className="matrix-controls-bar">
            <div className="matrix-search-box">
              <input 
                type="text" 
                placeholder="ابحث في السيناريوهات، الشخصيات، أو النقد..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="matrix-search-input"
              />
            </div>

            <div className="matrix-filter-buttons">
              <button 
                className={`matrix-pill ${filterStatus === 'ALL' ? 'active' : ''}`}
                onClick={() => setFilterStatus('ALL')}
              >
                الكل ({sessions.length})
              </button>
              <button 
                className={`matrix-pill pill-passed ${filterStatus === 'PASSED' ? 'active' : ''}`}
                onClick={() => setFilterStatus('PASSED')}
              >
                ناجح ({summary.passed})
              </button>
              <button 
                className={`matrix-pill pill-failed ${filterStatus === 'FAILED' ? 'active' : ''}`}
                onClick={() => setFilterStatus('FAILED')}
              >
                راسب ({summary.failed})
              </button>
            </div>
          </div>

          {/* Scenarios Table */}
          <div className="matrix-table-container">
            <table className="matrix-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>الحالة</th>
                  <th>السيناريو المستهدف</th>
                  <th>الشخصية الافتراضية (Persona)</th>
                  <th style={{ width: '100px' }}>الدرجة</th>
                  <th style={{ width: '90px' }}>الأدوار</th>
                  <th>تقييم المحاكاة (Critique)</th>
                  <th style={{ width: '120px' }}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredSessions.map((s, idx) => {
                  const isPassed = s.status === 'PASSED';
                  return (
                    <tr key={s.id || idx} className={isPassed ? 'row-passed' : 'row-failed'}>
                      <td>
                        <span className={`matrix-status-badge ${isPassed ? 'status-pass' : 'status-fail'}`}>
                          {isPassed ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                          <span>{isPassed ? 'PASS' : 'FAIL'}</span>
                        </span>
                      </td>
                      <td>
                        <div className="matrix-scen-name">{s.scenario}</div>
                        <div className="matrix-scen-id font-mono">{s.id}</div>
                      </td>
                      <td>
                        <div className="matrix-persona-name">
                          <User size={13} className="inline-icon" />
                          <span>{s.persona?.name}</span>
                        </div>
                        <div className="matrix-persona-style">{s.persona?.style}</div>
                      </td>
                      <td>
                        <div className={`matrix-score-pill ${s.score >= 90 ? 'score-high' : s.score >= 70 ? 'score-mid' : 'score-low'}`}>
                          {s.score}%
                        </div>
                      </td>
                      <td>
                        <span className="matrix-turns-count font-mono">{s.turnsCount} turns</span>
                      </td>
                      <td>
                        <div className="matrix-critique-text" title={s.critique}>
                          {s.critique}
                        </div>
                        {s.failures && s.failures.length > 0 && (
                          <div className="matrix-failure-tag">
                            ⚠️ {s.failures[0]}
                          </div>
                        )}
                      </td>
                      <td>
                        <button 
                          className="matrix-btn-inspect"
                          onClick={() => setSelectedSession(s)}
                        >
                          <Eye size={14} />
                          <span>فحص السجل</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredSessions.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: '#9CA3AF' }}>
                      لا توجد سيناريوهات مطابقة للشروط المحددة.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 2: Memory Bank View */}
      {activeTab === 'memory-bank' && (
        <section className="matrix-section">
          <div className="matrix-info-banner">
            <Sparkles size={20} className="matrix-icon-emerald" />
            <div>
              <strong>بنك الذاكرة المرجعي (Few-Shot Gold Standards Memory Bank):</strong>
              <p>يتم تحميل هذه السيناريوهات الذهبية وحقن أكثر 3 أمثلة مطابقة ديناميكياً داخل البرومبت الموجه لـ Gemini 3.6 Flash قبل كل رد لتحقيق أعلى درجات الدقة والاستقرار.</p>
            </div>
          </div>

          <div className="matrix-memory-grid">
            {memoryBank.map((item, idx) => (
              <div key={item.id || idx} className="matrix-memory-card">
                <div className="matrix-memory-header">
                  <span className="matrix-memory-scen-tag">{item.scenario}</span>
                  <span className="matrix-memory-id font-mono">GOLD-{idx + 1}</span>
                </div>

                <div className="matrix-memory-body">
                  <div className="matrix-memory-block">
                    <span className="matrix-block-label">مدخل المريض (User Query):</span>
                    <p className="matrix-user-quote">"{item.user_input}"</p>
                  </div>

                  <div className="matrix-memory-block">
                    <span className="matrix-block-label">الإجراء المتوقع (Expected Action):</span>
                    <span className="matrix-action-tag font-mono">{item.expected_action}</span>
                  </div>

                  <div className="matrix-memory-block">
                    <span className="matrix-block-label">الكلمات المفتاحية الإلزامية في الرد:</span>
                    <div className="matrix-keywords-wrap">
                      {item.ideal_response_keywords?.map((kw, kidx) => (
                        <span key={kidx} className="matrix-kw-chip">{kw}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* MODAL: Scenario Inspector & Replay Modal */}
      {selectedSession && (
        <div className="matrix-modal-overlay" onClick={() => setSelectedSession(null)}>
          <div className="matrix-modal-card" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="matrix-modal-header">
              <div className="matrix-modal-title-wrap">
                <span className={`matrix-status-badge ${selectedSession.status === 'PASSED' ? 'status-pass' : 'status-fail'}`}>
                  {selectedSession.status} ({selectedSession.score}%)
                </span>
                <h3 className="matrix-modal-title">{selectedSession.scenario}</h3>
              </div>
              <button 
                className="matrix-modal-close-btn"
                onClick={() => setSelectedSession(null)}
              >
                <X size={20} />
              </button>
            </div>

            {/* Persona Summary Card */}
            <div className="matrix-persona-dossier">
              <div className="dossier-col">
                <span className="dossier-label">المريض الافتراضي:</span>
                <strong className="dossier-val">{selectedSession.persona?.name}</strong>
              </div>
              <div className="dossier-col">
                <span className="dossier-label">النمط السلوكي:</span>
                <span className="dossier-val">{selectedSession.persona?.style}</span>
              </div>
              <div className="dossier-col" style={{ gridColumn: 'span 2' }}>
                <span className="dossier-label">الهدف التنافسي:</span>
                <span className="dossier-val">{selectedSession.persona?.objective}</span>
              </div>
            </div>

            {/* Replay Conversation Transcript */}
            <div className="matrix-transcript-container">
              <h4 className="matrix-transcript-title">
                <MessageSquare size={16} />
                <span>سجل المحادثة التنافسية خطوة بخطوة (Full Multi-Turn Transcript)</span>
              </h4>

              <div className="matrix-turns-feed">
                {selectedSession.turns?.map((t) => (
                  <div key={t.turn} className="matrix-turn-item">
                    <div className="matrix-turn-badge font-mono">TURN {t.turn}</div>

                    {/* Patient Turn */}
                    <div className="matrix-chat-msg patient-msg">
                      <div className="chat-avatar user-av">
                        <User size={16} />
                      </div>
                      <div className="chat-bubble">
                        <div className="chat-meta">المحاكي الافتراضي ({selectedSession.persona?.name})</div>
                        <div className="chat-body">{t.userMessage}</div>
                      </div>
                    </div>

                    {/* Nora Turn */}
                    <div className="matrix-chat-msg nora-msg">
                      <div className="chat-avatar nora-av">
                        <Bot size={16} />
                      </div>
                      <div className="chat-bubble">
                        <div className="chat-meta">
                          <span>نورا (موظفة الاستقبال الذكية)</span>
                          {t.latencyMs !== undefined && (
                            <span className="chat-latency font-mono">{t.latencyMs}ms</span>
                          )}
                        </div>
                        <div className="chat-body">{t.botReply}</div>

                        {/* Issued Card preview if any */}
                        {t.card && (
                          <div className="matrix-card-preview font-mono">
                            <div className="card-badge">ISSUED CARD: {t.card.type}</div>
                            <pre>{JSON.stringify(t.card, null, 2)}</pre>
                          </div>
                        )}

                        {/* Reasoning Steps Accordion */}
                        {t.reasoningSteps && t.reasoningSteps.length > 0 && (
                          <details className="matrix-reasoning-details">
                            <summary className="font-mono">
                              🧠 خطوات التفكير وضوابط الأمان ({t.reasoningSteps.length})
                            </summary>
                            <ul>
                              {t.reasoningSteps.map((step, sidx) => (
                                <li key={sidx}>{step}</li>
                              ))}
                            </ul>
                          </details>
                        )}
                      </div>
                    </div>

                    {/* Turn Score Pill */}
                    <div className="matrix-turn-evaluation">
                      <span className={`turn-eval-status ${t.assertionsPassed ? 'pass' : 'fail'}`}>
                        {t.assertionsPassed ? '✓ متوافق مع كافة المعايير' : '✗ به ملاحظات'}
                      </span>
                      <span className="turn-eval-score font-mono">{t.score || 100}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Evaluator Verdict Box */}
            <div className="matrix-verdict-box">
              <div className="verdict-header">
                <ShieldCheck size={18} className="matrix-icon-emerald" />
                <strong>التقرير النهائي لمدقق الجودة (QA Evaluator Verdict):</strong>
              </div>
              <p className="verdict-text">{selectedSession.critique}</p>

              {selectedSession.failures && selectedSession.failures.length > 0 && (
                <div className="verdict-failures-list">
                  <strong>الإخفاقات المسجلة:</strong>
                  <ul>
                    {selectedSession.failures.map((f, fidx) => (
                      <li key={fidx}>{f}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
