import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Stethoscope, Globe, Sparkles, Users, MessageSquare, Terminal } from 'lucide-react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import HomePage from './pages/HomePage';
import DepartmentsPage from './pages/DepartmentsPage';
import ServicesPage from './pages/ServicesPage';
import DoctorsPage from './pages/DoctorsPage';
import AssistantPage from './pages/AssistantPage';
import DevDashboardPage from './pages/DevDashboardPage';
import Dashboard from './components/Dashboard';
import FloatingChatWidget from './components/FloatingChatWidget';

function Navigation({ onOpenChat }) {
  const location = useLocation();
  const { language, toggleLanguage, t } = useLanguage();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar glass">
      <div className="nav-brand">
        <Link to="/" className="brand-link">
          <div className="brand-icon-box">
            <Stethoscope size={24} color="#ffffff" />
          </div>
          <div className="brand-titles">
            <span className="brand-main">{t('brandTitle')}</span>
            <span className="brand-sub">{t('brandSubtitle')}</span>
          </div>
        </Link>
      </div>

      <div className="nav-links">
        <Link 
          to="/" 
          className={`nav-link ${isActive('/') ? 'active' : ''}`}
        >
          {t('navHome')}
        </Link>
        <Link 
          to="/departments" 
          className={`nav-link ${isActive('/departments') ? 'active' : ''}`}
        >
          {t('navDepartments')}
        </Link>
        <Link 
          to="/services" 
          className={`nav-link ${isActive('/services') ? 'active' : ''}`}
        >
          {t('navServices')}
        </Link>
        <Link 
          to="/doctors" 
          className={`nav-link ${isActive('/doctors') ? 'active' : ''}`}
        >
          {t('navDoctors')}
        </Link>
      </div>

      <div className="nav-cta">
        {/* Developer Matrix QA Dashboard link */}
        <Link 
          to="/dev-dashboard" 
          className="nav-matrix-dev-link"
          title="نظام الاختبارات والمحاكاة الذاتية للمطورين"
        >
          <Terminal size={15} />
          <span>Matrix Dev QA</span>
        </Link>

        {/* Nora AI Chat Trigger */}
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

function AppContent() {
  const location = useLocation();
  const [triggerMessage, setTriggerMessage] = useState(null);
  const { dir } = useLanguage();

  const handleTriggerChat = (msg) => {
    setTriggerMessage(msg);
  };

  // Check if current route is a staff management portal (Secretary, Admin, or Dev Dashboard)
  const isStaffPortal = ['/secretary', '/assistant', '/admin', '/dev-dashboard'].includes(location.pathname);

  return (
    <div className="app-container" dir={dir}>
      {/* Persistent Public Navigation - only shown on patient-facing pages */}
      {!isStaffPortal && <Navigation onOpenChat={handleTriggerChat} />}

      {/* Dynamic Page Content */}
      <main className={`main-content ${isStaffPortal ? 'staff-portal-main' : ''}`}>
        <Routes>
          <Route path="/" element={<HomePage onTriggerChat={handleTriggerChat} />} />
          <Route path="/departments" element={<DepartmentsPage onTriggerChat={handleTriggerChat} />} />
          <Route path="/services" element={<ServicesPage onTriggerChat={handleTriggerChat} />} />
          <Route path="/doctors" element={<DoctorsPage onTriggerChat={handleTriggerChat} />} />
          <Route path="/secretary" element={<AssistantPage />} />
          <Route path="/assistant" element={<AssistantPage />} />
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/dev-dashboard" element={<DevDashboardPage />} />
        </Routes>
      </main>

      {/* Floating Chat Widget - Only active for public patient pages */}
      {!isStaffPortal && (
        <FloatingChatWidget 
          externalTriggerMessage={triggerMessage}
          onClearTrigger={() => setTriggerMessage(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <Router>
        <AppContent />
      </Router>
    </LanguageProvider>
  );
}
