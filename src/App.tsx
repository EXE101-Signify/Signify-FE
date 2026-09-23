import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage';
import LanguagePacks from './components/LanguagePacks';
import VideoCall from './components/VideoCall';

import type { Contact, Screen } from './types';

export default function App() {
  const [currentScreen, setCurrentScreen] =
    useState<Screen>('landing');

  const [activeCallContact, setActiveCallContact] =
    useState<Contact | null>(null);

  const handleLoginSuccess = () => {
    setCurrentScreen('dashboard');
  };

  const handleLogout = () => {
    setActiveCallContact(null);
    setCurrentScreen('landing');
  };

  const handleStartCall = (contact: Contact) => {
    setActiveCallContact(contact);
    setCurrentScreen('call');
  };

  const handleEndCall = () => {
    setActiveCallContact(null);
    setCurrentScreen('dashboard');
  };

  return (
    <div
      id="applet-viewport-root"
      className="min-h-screen overflow-x-hidden bg-brand-bg"
    >
      <AnimatePresence mode="wait">
        {currentScreen === 'landing' && (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <LandingPage onNavigate={setCurrentScreen} />
          </motion.div>
        )}

        {currentScreen === 'login' && (
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
          >
            <AuthPage
              onNavigate={setCurrentScreen}
              onLoginSuccess={handleLoginSuccess}
            />
          </motion.div>
        )}

        {currentScreen === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Dashboard
              onNavigate={setCurrentScreen}
              onLogout={handleLogout}
              onStartCall={handleStartCall}
            />
          </motion.div>
        )}

        {currentScreen === 'call' && activeCallContact && (
          <motion.div
            key="call"
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
        )}

        {currentScreen === 'languages' && (
          <motion.div
            key="languages"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <LanguagePacks onNavigate={setCurrentScreen} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}