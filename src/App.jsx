import React, { useState, useEffect } from 'react';
import Hero from './components/Hero';
import Features from './components/Features';
import Footer from './components/Footer';
import ThemeToggle from './components/ThemeToggle';
import Navbar from './components/Navbar';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import TrainingActivity from './pages/TrainingActivity';
import EventLanding from './pages/EventLanding';
import AssessmentSurvey from './pages/AssessmentSurvey';
import CertificateDownload from './pages/CertificateDownload';
import { authApi } from './api';

// Detect scanned QR: URL like /?e=<activityId>
const readEventFromUrl = () => {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('e');
};

// Public certificate verify link: /?verify=<code>
const readVerifyFromUrl = () => {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('verify');
};

// Every top-level view is mirrored to the URL so F5 keeps the user exactly
// where they were. `dashboard` additionally requires a valid session (checked
// after the /auth/me bootstrap) — if there is none it falls back to the login
// screen, but the URL stays put.
const ALL_VIEWS = ['home', 'training', 'admin', 'dashboard'];
const readViewFromUrl = () => {
  if (typeof window === 'undefined') return 'home';
  const v = new URLSearchParams(window.location.search).get('view');
  return ALL_VIEWS.includes(v) ? v : 'home';
};

// Trainee flow (QR → verify → survey → cert) is persisted in sessionStorage so
// a refresh on any step stays on that step (same browser tab). We strip heavy
// fields (cover image / description) from the stored activity to stay well
// within the sessionStorage quota.
const EVENT_SS_KEY = 'yru_event_state';
const slimActivity = (a) =>
  a ? { id: a.id, slug: a.slug, title: a.title, start_date: a.start_date, location: a.location, status: a.status } : a;
const readEventState = () => {
  const slug = readEventFromUrl();
  if (!slug) return null;
  try {
    const saved = JSON.parse(sessionStorage.getItem(EVENT_SS_KEY) || 'null');
    if (saved && saved.activityId === slug) return saved;
  } catch { /* ignore */ }
  return { step: 'landing', activityId: slug, activity: null, registrant: null };
};

function App() {
  // Trainee flow state (from QR scan) — restored from sessionStorage on refresh
  const [eventState, setEventState] = useState(() => readEventState());
  // Public certificate verify view (?verify=<code>)
  const [verifyCode, setVerifyCode] = useState(() => readVerifyFromUrl());

  // Hydrate currentView from URL so refresh keeps the user on the same page.
  const [currentView, setCurrentView] = useState(() => readViewFromUrl());
  const [admin, setAdmin] = useState(null);       // set from /auth/me — survives reload
  const [authBooting, setAuthBooting] = useState(true);

  // Mirror state → URL on every change so refresh (F5) restores the exact page,
  // and the Back button walks the history. The trainee flow owns the URL via
  // ?e=<slug>; otherwise ?view=<view> (home = no param). Other params (?a, ?tab)
  // are preserved untouched.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (eventState) {
      params.set('e', eventState.activityId);
      params.delete('view');
    } else {
      params.delete('e');
      if (currentView !== 'home') params.set('view', currentView);
      else params.delete('view');
    }
    const qs = params.toString();
    const next = window.location.pathname + (qs ? `?${qs}` : '') + window.location.hash;
    if (next !== window.location.pathname + window.location.search + window.location.hash) {
      window.history.pushState({ view: currentView }, '', next);
    }
  }, [currentView, eventState]);

  // Persist the trainee flow in sessionStorage (slim activity) so a refresh on
  // the survey/cert step restores it instead of bouncing back to landing.
  useEffect(() => {
    try {
      if (eventState) {
        sessionStorage.setItem(EVENT_SS_KEY,
          JSON.stringify({ ...eventState, activity: slimActivity(eventState.activity) }));
      } else {
        sessionStorage.removeItem(EVENT_SS_KEY);
      }
    } catch { /* ignore quota/availability */ }
  }, [eventState]);

  // Browser Back / Forward → re-read URL and update state.
  useEffect(() => {
    const onPop = () => {
      setEventState(readEventState());
      setVerifyCode(readVerifyFromUrl());
      setCurrentView(readViewFromUrl());
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Bootstrap: hydrate the session from /auth/me. We do NOT force a view here —
  // the view comes from the URL; a 'dashboard' URL without a valid session
  // falls back to the login screen in the render below.
  useEffect(() => {
    if (eventState || verifyCode) { setAuthBooting(false); return; } // skip on public views
    let cancelled = false;
    authApi.me()
      .then(({ admin }) => { if (!cancelled) setAdmin(admin); })
      .catch(() => { /* no session */ })
      .finally(() => { if (!cancelled) setAuthBooting(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // While bootstrapping /auth/me, keep the screen minimal so we don't flash the
  // public home page for the ~200ms round-trip.
  if (authBooting && !eventState && !verifyCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-yrugray-950">
        <div className="w-8 h-8 border-2 border-yrupink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const exitEventFlow = () => {
    // Drop the saved flow; the URL effect clears ?e= so refresh won't re-enter.
    try { sessionStorage.removeItem(EVENT_SS_KEY); } catch { /* ignore */ }
    setEventState(null);
  };

  // Single navigation entry point shared by the public Navbar on every page.
  // target: 'home' | 'training' | 'admin'. An optional `hash` smooth-scrolls to
  // a section once the home page has rendered. Any trainee/verify sub-flow is
  // left before switching views so the navbar always returns to the real site.
  const goTo = (target, hash) => {
    try { sessionStorage.removeItem(EVENT_SS_KEY); } catch { /* ignore */ }
    setEventState(null);
    setVerifyCode(null);
    if (target === 'admin') {
      setCurrentView(admin ? 'dashboard' : 'admin');
      return;
    }
    setCurrentView(target === 'training' ? 'training' : 'home');
    if (hash) {
      setTimeout(() => {
        try { document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' }); } catch { /* ignore */ }
      }, 180);
    }
  };

  // Public certificate verify view (?verify=<code>) — takes over the page
  if (verifyCode) {
    const exitVerify = () => {
      const params = new URLSearchParams(window.location.search);
      params.delete('verify');
      const qs = params.toString();
      window.history.replaceState({}, '', window.location.pathname + (qs ? `?${qs}` : ''));
      setVerifyCode(null);
    };
    return (
      <CertificateDownload
        certificateCode={verifyCode}
        onBackHome={exitVerify}
        verify
        onNavigate={goTo}
        isAdmin={!!admin}
      />
    );
  }

  // Trainee QR flow — takes over the whole page
  if (eventState) {
    const navProps = { onNavigate: goTo, isAdmin: !!admin };
    const traineePage =
      eventState.step === 'landing' ? (
        <EventLanding
          {...navProps}
          activityId={eventState.activityId}
          onVerified={(registrant, activity) =>
            // Already submitted the assessment → skip the survey, jump to the
            // existing certificate. Otherwise start the survey as usual.
            setEventState(
              registrant.certificate_code
                ? { step: 'cert', activityId: activity.id, activity, registrant,
                    certificateCode: registrant.certificate_code }
                : { step: 'survey', activityId: activity.id, activity, registrant }
            )
          }
          onCancel={exitEventFlow}
        />
      ) : eventState.step === 'survey' ? (
        <AssessmentSurvey
          {...navProps}
          activity={eventState.activity}
          registrant={eventState.registrant}
          onComplete={(_answers, result) =>
            setEventState({ ...eventState, step: 'cert',
              certificateCode: result?.certificate?.certificate_code })
          }
          onCancel={exitEventFlow}
        />
      ) : eventState.step === 'cert' ? (
        <CertificateDownload
          {...navProps}
          activity={eventState.activity}
          registrant={eventState.registrant}
          certificateCode={eventState.certificateCode}
          onBackHome={exitEventFlow}
        />
      ) : null;

    return traineePage;
  }

  // Dashboard requires a live session; without one, show the login screen
  // (the URL keeps ?view=dashboard so a successful login lands right back).
  if (currentView === 'admin' || (currentView === 'dashboard' && !admin)) {
    return (
      <div className="relative">
        <button
          onClick={() => setCurrentView('home')}
          className="absolute top-6 left-6 z-50 px-4 py-2 bg-white/80 dark:bg-yrugray-800/80 hover:bg-gray-100 dark:hover:bg-yrugray-700 backdrop-blur border border-gray-200 dark:border-yrugray-700 rounded-lg text-sm text-gray-700 dark:text-yrugray-300 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-2 shadow-lg"
        >
          &larr; กลับสู่หน้าแรก
        </button>
        <div className="absolute top-6 right-6 z-50">
          <ThemeToggle variant="solid" />
        </div>
        <AdminLogin onLogin={(a) => { setAdmin(a); setCurrentView('dashboard'); }} />
      </div>
    );
  }

  if (currentView === 'dashboard' && admin) {
    return (
      <AdminDashboard
        admin={admin}
        onLogout={async () => {
          try { await authApi.logout(); } catch (_) { /* ignore */ }
          setAdmin(null);
          setCurrentView('home');
        }}
      />
    );
  }

  if (currentView === 'training') {
    return (
      <TrainingActivity
        onBack={() => setCurrentView('home')}
        onNavigate={goTo}
        isAdmin={!!admin}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden transition-colors duration-300">
      {/* Abstract Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-yrupink-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-yrupink-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <Navbar onNavigate={goTo} isAdmin={!!admin} active="home" />

      <main className="flex-grow flex flex-col items-center justify-center px-6 z-10 w-full max-w-7xl mx-auto">
        <Hero />
        <Features onViewTraining={() => setCurrentView('training')} />
      </main>

      <Footer />
    </div>
  );
}

export default App;
