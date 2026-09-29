import {
  useState,
  type ReactNode,
} from 'react';
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, Home } from 'lucide-react';

import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import LanguagePacks from './components/LanguagePacks';
import VideoCall from './components/VideoCall';
import ForgotPasswordPage from './components/auth/ForgotPasswordPage';
import RegisterPage from './components/auth/RegisterPage';
import ResetPasswordPage from './components/auth/ResetPasswordPage';
import VerifyOtpPage from './components/auth/VerifyOtpPage';
import { BrandLogo, Button } from './components/common';

import type { Contact, Screen } from './types';

interface ProtectedRouteProps {
  isAuthenticated: boolean;
  children: ReactNode;
}

function ProtectedRoute({
  isAuthenticated,
  children,
}: ProtectedRouteProps) {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-bg px-4 text-center">
      <div className="mb-6">
        <BrandLogo />
      </div>

      <div className="max-w-md rounded-xl border border-brand-border bg-white p-8">
        <span className="inline-block rounded-md bg-brand-primary-light px-3 py-1 text-xs font-semibold text-brand-primary">
          404
        </span>

        <h1 className="mt-4 text-2xl font-semibold text-brand-text">
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
            size="sm"
            leftIcon={<Home className="h-4 w-4" />}
            onClick={() => navigate('/')}
          >
            Trang chính
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeCallContact, setActiveCallContact] =
    useState<Contact | null>(null);

  const [isAuthenticated, setIsAuthenticated] = useState(
    () =>
      window.sessionStorage.getItem(
        'signify-authenticated',
      ) === 'true',
  );

  const screenToPath: Record<Screen, string> = {
    landing: '/login',
    login: '/login',
    dashboard: '/dashboard',
    call: '/call',
    languages: '/languages',
  };

  const handleNavigate = (screen: Screen) => {
    navigate(screenToPath[screen] || '/login');
  };

  const handleLoginSuccess = () => {
    window.sessionStorage.setItem(
      'signify-authenticated',
      'true',
    );

    setIsAuthenticated(true);
    navigate('/dashboard', { replace: true });
  };

  const handleLogout = () => {
    window.sessionStorage.removeItem(
      'signify-authenticated',
    );

    setIsAuthenticated(false);
    setActiveCallContact(null);
    navigate('/login', { replace: true });
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
    <div
      id="applet-viewport-root"
      className="min-h-screen overflow-x-hidden bg-brand-bg"
    >
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <Navigate
                to={
                  isAuthenticated
                    ? '/dashboard'
                    : '/login'
                }
                replace
              />
            }
          />

          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <AuthPage
                    onNavigate={handleNavigate}
                    onLoginSuccess={handleLoginSuccess}
                  />
                </motion.div>
              )
            }
          />

          <Route
            path="/register"
            element={
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <RegisterPage />
              </motion.div>
            }
          />

          <Route
            path="/forgot-password"
            element={
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <ForgotPasswordPage />
              </motion.div>
            }
          />

          <Route
            path="/verify-otp"
            element={
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <VerifyOtpPage />
              </motion.div>
            }
          />

          <Route
            path="/reset-password"
            element={
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <ResetPasswordPage />
              </motion.div>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute
                isAuthenticated={isAuthenticated}
              >
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
              </ProtectedRoute>
            }
          />

          <Route
            path="/call"
            element={
              <ProtectedRoute
                isAuthenticated={isAuthenticated}
              >
                {activeCallContact ? (
                  <motion.div
                    initial={{
                      opacity: 0,
                      scale: 0.98,
                    }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                    }}
                    exit={{
                      opacity: 0,
                      scale: 1.02,
                    }}
                    transition={{ duration: 0.25 }}
                  >
                    <VideoCall
                      contact={activeCallContact}
                      onEndCall={handleEndCall}
                    />
                  </motion.div>
                ) : (
                  <Navigate to="/dashboard" replace />
                )}
              </ProtectedRoute>
            }
          />

          <Route
            path="/languages"
            element={
              <ProtectedRoute
                isAuthenticated={isAuthenticated}
              >
                <motion.div
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.2 }}
                >
                  <LanguagePacks
                    onNavigate={handleNavigate}
                  />
                </motion.div>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AnimatePresence>
    </div>
  );
}