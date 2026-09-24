import { useState } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Home, ArrowLeft } from 'lucide-react';

import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage';
import LanguagePacks from './components/LanguagePacks';
import VideoCall from './components/VideoCall';
import { Button, BrandLogo } from './components/common';

import type { Contact, Screen } from './types';

function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-bg px-4 text-center">
      <div className="mb-6">
        <BrandLogo />
      </div>
      <div className="max-w-md rounded-2xl border border-brand-border bg-white p-8 shadow-sm">
        <span className="inline-block rounded-full bg-brand-primary-light px-3 py-1 text-xs font-bold text-brand-primary">
          404 Not Found
        </span>
        <h1 className="mt-4 text-2xl font-extrabold text-brand-text">
          Trang không tồn tại
        </h1>
        <p className="mt-2 text-sm text-brand-text-muted">
          Đường dẫn bạn truy cập không tồn tại hoặc đã được di chuyển.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => navigate(-1)}
          >
            Quay lại
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Home className="h-4 w-4" />}
            onClick={() => navigate('/')}
          >
            Trang chủ
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeCallContact, setActiveCallContact] = useState<Contact | null>(null);

  const screenToPath: Record<Screen, string> = {
    landing: '/',
    login: '/login',
    dashboard: '/dashboard',
    call: '/call',
    languages: '/languages',
  };

  const handleNavigate = (screen: Screen) => {
    navigate(screenToPath[screen] || '/');
  };

  const handleLoginSuccess = () => {
    navigate('/dashboard');
  };

  const handleLogout = () => {
    setActiveCallContact(null);
    navigate('/');
  };

  const handleStartCall = (contact: Contact) => {
    setActiveCallContact(contact);
    navigate('/call');
  };

  const handleEndCall = () => {
    setActiveCallContact(null);
    navigate('/dashboard');
  };

  return (
    <div id="applet-viewport-root" className="min-h-screen overflow-x-hidden bg-brand-bg">
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <LandingPage onNavigate={handleNavigate} />
              </motion.div>
            }
          />

          <Route
            path="/login"
            element={
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
              >
                <AuthPage
                  onNavigate={handleNavigate}
                  onLoginSuccess={handleLoginSuccess}
                />
              </motion.div>
            }
          />

          <Route
            path="/dashboard"
            element={
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Dashboard
                  onNavigate={handleNavigate}
                  onLogout={handleLogout}
                  onStartCall={handleStartCall}
                />
              </motion.div>
            }
          />

          <Route
            path="/call"
            element={
              activeCallContact ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.25 }}
                >
                  <VideoCall
                    contact={activeCallContact}
                    onEndCall={handleEndCall}
                  />
                </motion.div>
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />

          <Route
            path="/languages"
            element={
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <LanguagePacks onNavigate={handleNavigate} />
              </motion.div>
            }
          />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AnimatePresence>
    </div>
  );
}