import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Stethoscope, MessageCircle, Calendar, Sparkles } from 'lucide-react';
import HomePage from './pages/HomePage';
import ServicesPage from './pages/ServicesPage';
import DoctorsPage from './pages/DoctorsPage';
import Dashboard from './components/Dashboard';
import FloatingChatWidget from './components/FloatingChatWidget';

function Navigation({ onOpenChat }) {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar glass" dir="rtl">
      <div className="nav-brand">
        <Link to="/" className="brand-link">
          <div className="brand-icon-box">
            <Stethoscope size={24} color="#ffffff" />
          </div>
          <div className="brand-titles">
            <span className="brand-main">سمارت كلينك AI</span>
            <span className="brand-sub">العيادة الذكية المتكاملة</span>
          </div>
        </Link>
      </div>

      <div className="nav-links">
        <Link 
          to="/" 
          className={`nav-link ${isActive('/') ? 'active' : ''}`}
        >
          الرئيسية
        </Link>
        <Link 
          to="/services" 
          className={`nav-link ${isActive('/services') ? 'active' : ''}`}
        >
          الخدمات والأسعار
        </Link>
        <Link 
          to="/doctors" 
          className={`nav-link ${isActive('/doctors') ? 'active' : ''}`}
        >
          فريق الأطباء
        </Link>
        <Link 
          to="/admin" 
          className={`nav-link admin-pill ${isActive('/admin') ? 'active' : ''}`}
        >
          لوحة الإدارة
        </Link>
      </div>

      <div className="nav-cta">
        <button 
          className="nav-chat-trigger-btn"
          onClick={() => onOpenChat && onOpenChat('السلام عليكم، عايز استفسر عن المواعيد')}
        >
          <Sparkles size={16} />
          <span>تحدث مع نورا (الاستقبال)</span>
        </button>
      </div>
    </nav>
  );
}

export default function App() {
  const [triggerMessage, setTriggerMessage] = useState(null);

  const handleTriggerChat = (msg) => {
    setTriggerMessage(msg);
  };

  return (
    <Router>
      <div className="app-container" dir="rtl">
        {/* Persistent Top Navigation */}
        <Navigation onOpenChat={handleTriggerChat} />

        {/* Dynamic Page Content */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage onTriggerChat={handleTriggerChat} />} />
            <Route path="/services" element={<ServicesPage onTriggerChat={handleTriggerChat} />} />
            <Route path="/doctors" element={<DoctorsPage onTriggerChat={handleTriggerChat} />} />
            <Route path="/admin" element={<Dashboard />} />
          </Routes>
        </main>

        {/* Floating Chat Widget - Persists across all pages */}
        <FloatingChatWidget 
          externalTriggerMessage={triggerMessage}
          onClearTrigger={() => setTriggerMessage(null)}
        />
      </div>
    </Router>
  );
}
