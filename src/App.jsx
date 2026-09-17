import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import Hero from './components/Hero';
import Features from './components/Features';
import Footer from './components/Footer';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import TrainingActivity from './pages/TrainingActivity';
import EventLanding from './pages/EventLanding';
import AssessmentSurvey from './pages/AssessmentSurvey';
import CertificateDownload from './pages/CertificateDownload';

// Detect scanned QR: URL like /?e=<activityId>
const readEventFromUrl = () => {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('e');
};

function App() {
  // Trainee flow state (from QR scan)
  const initialEventId = readEventFromUrl();
  const [eventState, setEventState] = useState(
    initialEventId ? { step: 'landing', activityId: initialEventId, activity: null, registrant: null } : null
  );

  const [currentView, setCurrentView] = useState('home');
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light';
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const exitEventFlow = () => {
    // Clear ?e= param so refresh doesn't re-enter the flow
    if (typeof window !== 'undefined' && window.history.replaceState) {
      window.history.replaceState({}, '', window.location.pathname);
    }
    setEventState(null);
  };

  // Trainee QR flow — takes over the whole page
  if (eventState) {
    if (eventState.step === 'landing') {
      return (
        <EventLanding
          activityId={eventState.activityId}
          onVerified={(registrant, activity) =>
            setEventState({ step: 'survey', activityId: activity.id, activity, registrant })
          }
          onCancel={exitEventFlow}
        />
      );
    }
    if (eventState.step === 'survey') {
      return (
        <AssessmentSurvey
          activity={eventState.activity}
          registrant={eventState.registrant}
          onComplete={() =>
            setEventState({ ...eventState, step: 'cert' })
          }
          onCancel={exitEventFlow}
        />
      );
    }
    if (eventState.step === 'cert') {
      return (
        <CertificateDownload
          activity={eventState.activity}
          registrant={eventState.registrant}
          onBackHome={exitEventFlow}
        />
      );
    }
  }

  if (currentView === 'admin') {
    return (
      <div className="relative">
        <button 
          onClick={() => setCurrentView('home')}
          className="absolute top-6 left-6 z-50 px-4 py-2 bg-white/80 dark:bg-yrugray-800/80 hover:bg-gray-100 dark:hover:bg-yrugray-700 backdrop-blur border border-gray-200 dark:border-yrugray-700 rounded-lg text-sm text-gray-700 dark:text-yrugray-300 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-2 shadow-lg"
        >
          &larr; กลับสู่หน้าแรก
        </button>
        <AdminLogin onLogin={() => setCurrentView('dashboard')} />
      </div>
    );
  }

  if (currentView === 'dashboard') {
    return <AdminDashboard onLogout={() => setCurrentView('home')} />;
  }

  if (currentView === 'training') {
    return <TrainingActivity onBack={() => setCurrentView('home')} />;
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden transition-colors duration-300">
      {/* Abstract Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-yrupink-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-yrupink-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <header className="w-full glass sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView('home')}>
            <div className="w-8 h-8 bg-gradient-to-br from-yrupink-400 to-yrupink-700 rounded-lg flex items-center justify-center font-bold text-white shadow-lg">
              AI
            </div>
            <span className="font-bold text-xl tracking-wide text-gray-900 dark:text-white transition-colors duration-300">CENTER <span className="text-yrupink-400">YRU</span></span>
          </div>
          <nav className="hidden md:flex gap-8 text-sm font-medium text-gray-600 dark:text-yrugray-100 items-center transition-colors duration-300">
            <a href="#" className="hover:text-yrupink-500 dark:hover:text-yrupink-400 transition-colors">หน้าแรก</a>
            <a href="#features" className="hover:text-yrupink-500 dark:hover:text-yrupink-400 transition-colors">บริการ</a>
            <a href="#about" className="hover:text-yrupink-500 dark:hover:text-yrupink-400 transition-colors">เกี่ยวกับเรา</a>
            <a href="#contact" className="hover:text-yrupink-500 dark:hover:text-yrupink-400 transition-colors">ติดต่อเรา</a>
            
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-yrugray-800 transition-colors text-gray-500 dark:text-yrugray-400 ml-2"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Admin Login Button */}
            <button 
              onClick={() => setCurrentView('admin')}
              className="px-4 py-2 rounded-lg bg-yrupink-500/10 dark:bg-yrupink-600/20 text-yrupink-600 dark:text-yrupink-400 border border-yrupink-500/30 hover:bg-yrupink-500 hover:text-white dark:hover:bg-yrupink-600 dark:hover:text-white dark:hover:border-yrupink-500 transition-all duration-300 ml-2 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              เข้าสู่ระบบผู้ดูแล
            </button>
          </nav>
          <div className="md:hidden flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-yrugray-800 transition-colors text-gray-500 dark:text-yrugray-400"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button className="text-gray-900 dark:text-white">
              {/* Mobile menu icon */}
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center px-6 z-10 w-full max-w-7xl mx-auto">
        <Hero />
        <Features onViewTraining={() => setCurrentView('training')} />
      </main>

      <Footer />
    </div>
  );
}

export default App;
