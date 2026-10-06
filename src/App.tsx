import {
  useEffect,
  useRef,
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
import ProfilePage from './components/profile/ProfilePage';
import AdminUserListPage from './components/admin/AdminUserListPage';
import SettingsPage from './components/settings/SettingsPage';
import NotificationsPage from './components/notifications/NotificationsPage';
import { BrandLogo, Button } from './components/common';
import { authApi } from './services/authApi';
import { clearStoredSession, getStoredAccessToken, getStoredUser } from './services/apiClient';
import { videoCallApi, type VideoCallRecord } from './services/videoCallApi';
import { parseCallEvent, type CallEvent } from './services/callEvents';
import { subscribeToStomp, type StompConnectionState } from './services/stompConnection';

import type { CallableContact, Contact, Screen } from './types';

function callErrorMessage(error: unknown): string {
  const status = (error as { status?: number })?.status;
  switch (status) {
    case 401: return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
    case 403: return 'Bạn không có quyền gọi trong cuộc trò chuyện này.';
    case 404: return 'Không tìm thấy cuộc gọi hoặc cuộc trò chuyện.';
    case 409: return 'Trạng thái cuộc gọi đã thay đổi. Vui lòng thử lại.';
    default: return error instanceof Error ? error.message : 'Không thể bắt đầu cuộc gọi.';
  }
}

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

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('signbridge_auth') === 'true';
  });

  const [activeCall, setActiveCall] = useState<{ contact: CallableContact; call: VideoCallRecord } | null>(null);
  const [callCreating, setCallCreating] = useState(false);
  const [callError, setCallError] = useState<string | null>(null);
  const creatingCall = useRef(false);
  const authGeneration = useRef(0);
  const creatingConversationId = useRef<number | null>(null);
  const activeCallRef = useRef<typeof activeCall>(null);
  const [pendingCalls, setPendingCalls] = useState<Record<number, CallEvent>>({});
  const [incomingBusy, setIncomingBusy] = useState(false);
  const [incomingError, setIncomingError] = useState<string | null>(null);
  const [callNotice, setCallNotice] = useState<string | null>(null);
  const [callSignalState, setCallSignalState] = useState<StompConnectionState>('offline');
  const incomingActionRef = useRef<number | null>(null);
  const pendingCallIds = useRef(new Set<number>());
  const seenEventIds = useRef(new Set<string>());
  const terminalCallIds = useRef(new Set<number>());
  const statusDuringRequest = useRef(new Map<number, CallEvent>());

  const setCurrentCall = (value: typeof activeCall) => {
    activeCallRef.current = value;
    setActiveCall(value);
  };

  useEffect(() => {
    if (!isAuthenticated || !getStoredAccessToken()) return;
    const generation = authGeneration.current;
    const remember = (eventId: string) => {
      if (seenEventIds.current.has(eventId)) return false;
      if (seenEventIds.current.size >= 500) seenEventIds.current.clear();
      seenEventIds.current.add(eventId);
      return true;
    };
    const stopIncoming = subscribeToStomp('/user/queue/calls/incoming', (body) => {
      if (generation !== authGeneration.current) return;
      const event = parseCallEvent(body, 'INCOMING_CALL');
      const userId = getStoredUser()?.userId;
      if (!event || event.receiverId !== userId || event.callerId === userId) return;
      if (!remember(event.eventId) || terminalCallIds.current.has(event.callId)) return;
      if (pendingCallIds.current.has(event.callId)) return;
      pendingCallIds.current.add(event.callId);
      setPendingCalls((current) => ({ ...current, [event.callId]: event }));
    }, setCallSignalState);
    const stopStatus = subscribeToStomp('/user/queue/calls/status', (body) => {
      if (generation !== authGeneration.current) return;
      const event = parseCallEvent(body, 'CALL_STATUS_CHANGED');
      const userId = getStoredUser()?.userId;
      if (!event || (event.callerId !== userId && event.receiverId !== userId)) return;
      if (!remember(event.eventId)) return;
      if (terminalCallIds.current.has(event.callId)
        && event.status !== 'COMPLETED' && event.status !== 'REJECTED'
        && event.status !== 'MISSED' && event.status !== 'BUSY') return;
      const currentCall = activeCallRef.current;
      const matchesActive = currentCall?.call.id === event.callId
        && currentCall.call.conversationId === event.conversationId
        && currentCall.call.callerId === event.callerId
        && currentCall.call.receiverId === event.receiverId;
      const matchesPending = pendingCallIds.current.has(event.callId);
      const matchesCreating = creatingCall.current && creatingConversationId.current === event.conversationId
        && event.callerId === userId;
      if (!matchesActive && !matchesPending && !matchesCreating && incomingActionRef.current !== event.callId) return;
      if (matchesCreating
        || incomingActionRef.current === event.callId) {
        const previous = statusDuringRequest.current.get(event.callId);
        if (!previous || event.timestamp >= previous.timestamp) statusDuringRequest.current.set(event.callId, event);
      }
      if (event.status === 'COMPLETED' || event.status === 'REJECTED' || event.status === 'MISSED' || event.status === 'BUSY') {
        if (terminalCallIds.current.size >= 500) terminalCallIds.current.clear();
        terminalCallIds.current.add(event.callId);
        pendingCallIds.current.delete(event.callId);
        setPendingCalls((current) => {
          if (!current[event.callId]) return current;
          const next = { ...current };
          delete next[event.callId];
          return next;
        });
      } else if (event.status === 'ACCEPTED' && incomingActionRef.current !== event.callId) {
        pendingCallIds.current.delete(event.callId);
        setPendingCalls((current) => {
          if (!current[event.callId]) return current;
          const next = { ...current };
          delete next[event.callId];
          return next;
        });
      }
      if (matchesActive && (event.status !== 'CALLING' || currentCall.call.status === 'CALLING')) {
        setCurrentCall({ ...currentCall, call: { ...currentCall.call, status: event.status } });
      }
    });
    return () => { stopIncoming(); stopStatus(); };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!activeCall || !['COMPLETED', 'REJECTED', 'MISSED', 'BUSY'].includes(activeCall.call.status)) return;
    setCurrentCall(null);
    if (location.pathname === '/call') navigate('/dashboard', { state: { toastMessage: 'Cuộc gọi đã kết thúc.' } });
  }, [activeCall?.call.status, location.pathname, navigate]);

  const screenToPath: Record<Screen, string> = {
    landing: '/login',
    login: '/login',
    dashboard: '/dashboard',
    call: '/call',
    languages: '/languages',
    profile: '/profile',
    settings: '/settings',
    notifications: '/notifications',
    'admin-users': '/admin/users',
  };

  const handleNavigate = (screen: Screen) => {
    const nextPath = screenToPath[screen] || '/login';
    if (location.pathname !== nextPath) {
      navigate(nextPath);
    }
  };

  const handleLoginSuccess = () => {
    authGeneration.current += 1;
    localStorage.setItem('signbridge_auth', 'true');
    setIsAuthenticated(true);
    navigate('/dashboard');
  };

  const handleLogout = () => {
    authGeneration.current += 1;
    creatingCall.current = false;
    creatingConversationId.current = null;
    incomingActionRef.current = null;
    setCallCreating(false);
    setIncomingBusy(false);
    setIncomingError(null);
    authApi.logout().catch(() => clearStoredSession());
    setIsAuthenticated(false);
    setCurrentCall(null);
    navigate('/login', { replace: true });
  };

  const handleStartCall = async (contact: CallableContact) => {
    if (creatingCall.current) return;
    if (!Number.isSafeInteger(contact.userId) || contact.userId <= 0
      || !Number.isSafeInteger(contact.conversationId) || contact.conversationId <= 0) {
      setCallError('Không thể gọi: thiếu mã người dùng hoặc cuộc trò chuyện hợp lệ.');
      return;
    }
    const generation = authGeneration.current;
    creatingCall.current = true;
    creatingConversationId.current = contact.conversationId;
    setCallCreating(true);
    setCallError(null);
    try {
      const call = await videoCallApi.create(contact.conversationId);
      if (generation !== authGeneration.current) return;
      if (call.conversationId !== contact.conversationId) {
        throw new Error('Máy chủ trả về cuộc gọi không khớp cuộc trò chuyện.');
      }
      const latest = statusDuringRequest.current.get(call.id);
      statusDuringRequest.current.delete(call.id);
      const resolved = latest && latest.conversationId === call.conversationId
        && latest.callerId === call.callerId && latest.receiverId === call.receiverId
        ? { ...call, status: latest.status } : call;
      if (['REJECTED', 'COMPLETED', 'MISSED', 'BUSY'].includes(resolved.status)) {
        setCallError('Cuộc gọi đã kết thúc trước khi kết nối.');
      } else {
        setCurrentCall({ contact, call: resolved });
        navigate('/call');
      }
    } catch (error) {
      if (generation !== authGeneration.current) return;
      setCallError(callErrorMessage(error));
    } finally {
      if (generation === authGeneration.current) {
        creatingCall.current = false;
        creatingConversationId.current = null;
        setCallCreating(false);
      }
    }
  };

  const handleEndCall = () => {
    setCurrentCall(null);
    navigate('/dashboard');
  };

  const handleCallUpdated = (call: VideoCallRecord) => {
    const current = activeCallRef.current;
    if (current?.call.id === call.id) setCurrentCall({ ...current, call });
  };

  const handleIncomingAction = async (event: CallEvent, action: 'accept' | 'reject') => {
    if (incomingActionRef.current !== null || !pendingCalls[event.callId] || !pendingCallIds.current.has(event.callId)) return;
    const generation = authGeneration.current;
    incomingActionRef.current = event.callId;
    setIncomingBusy(true);
    setIncomingError(null);
    setCallNotice(null);
    try {
      const result = await videoCallApi[action](event.callId);
      if (generation !== authGeneration.current) return;
      if (result.id !== event.callId || result.conversationId !== event.conversationId
        || result.callerId !== event.callerId || result.receiverId !== event.receiverId
        || result.status !== (action === 'accept' ? 'ACCEPTED' : 'REJECTED')) {
        throw new Error('Máy chủ trả về trạng thái cuộc gọi không hợp lệ.');
      }
      setPendingCalls((current) => {
        const next = { ...current };
        delete next[event.callId];
        return next;
      });
      pendingCallIds.current.delete(event.callId);
      const latest = statusDuringRequest.current.get(event.callId);
      statusDuringRequest.current.delete(event.callId);
      if (action === 'accept') {
        const status = latest && latest.timestamp >= event.timestamp ? latest.status : result.status;
        if (['COMPLETED', 'REJECTED', 'MISSED', 'BUSY'].includes(status)) {
          setIncomingError('Cuộc gọi đã kết thúc.');
        } else {
          const contact: CallableContact = {
            id: String(event.callerId), userId: event.callerId, conversationId: result.conversationId,
            name: `Người gọi #${event.callerId}`, role: 'Cuộc gọi video',
            status: 'offline', avatar: '', lastCall: '—',
          };
          setCurrentCall({ contact, call: { ...result, status } });
          navigate('/call');
        }
      } else {
        terminalCallIds.current.add(result.id);
        setCallNotice(`Đã từ chối cuộc gọi #${result.id}.`);
      }
    } catch (error) {
      if (generation !== authGeneration.current) return;
      const status = (error as { status?: number })?.status;
      if (status === 403 || status === 404 || status === 409) {
        pendingCallIds.current.delete(event.callId);
        setPendingCalls((current) => {
          const next = { ...current };
          delete next[event.callId];
          return next;
        });
      }
      setIncomingError(callErrorMessage(error));
    } finally {
      if (generation === authGeneration.current) {
        incomingActionRef.current = null;
        setIncomingBusy(false);
      }
    }
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
                <RegisterPage onLoginSuccess={handleLoginSuccess} />
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
                    callCreating={callCreating}
                    callError={callError}
                  />
                </motion.div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <ProfilePage
                  onNavigate={handleNavigate}
                  onLogout={handleLogout}
                />
              </motion.div>
            }
          />

          <Route
            path="/admin/users"
            element={
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <AdminUserListPage
                  onNavigate={handleNavigate}
                  onLogout={handleLogout}
                />
              </motion.div>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <SettingsPage onNavigate={handleNavigate} />
                </motion.div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/notifications"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <NotificationsPage onNavigate={handleNavigate} />
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
                {activeCall ? (
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
                      contact={activeCall.contact}
                      callId={activeCall.call.id}
                      call={activeCall.call}
                      onCallUpdated={handleCallUpdated}
                      onEndCall={handleEndCall}
                    />
                  </motion.div>
                ) : (
                  <Navigate
                    to="/dashboard"
                    replace
                    state={{
                      toastMessage:
                        'Vui lòng chọn một liên hệ từ danh bạ để bắt đầu cuộc gọi video!',
                    }}
                  />
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
      {incomingError && Object.values(pendingCalls).length === 0 && (
        <div role="alert" className="fixed bottom-4 right-4 z-50 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-800 shadow-xl">{incomingError}</div>
      )}
      {callNotice && <div role="status" className="fixed right-4 bottom-4 z-40 flex items-center gap-3 rounded-xl border border-brand-border bg-white p-3 text-xs font-bold text-brand-text shadow-md">{callNotice}<button type="button" onClick={() => setCallNotice(null)} aria-label="Đóng thông báo">×</button></div>}
      {Object.values(pendingCalls).length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 flex max-h-[70vh] flex-col gap-3 overflow-y-auto">
          {Object.values(pendingCalls).map((event) => (
            <div key={event.callId} className="w-72 rounded-2xl border border-brand-border bg-white p-4 text-brand-text shadow-xl" role="alertdialog" aria-label="Cuộc gọi video đến">
              <h2 className="text-sm font-extrabold">Cuộc gọi video đến</h2>
              <p className="mt-2 text-xs">Người gọi #{event.callerId} · Cuộc gọi #{event.callId}</p>
              {incomingError && <p role="alert" className="mt-2 text-xs text-brand-error">{incomingError}</p>}
              <div className="mt-4 flex gap-2">
                <button type="button" disabled={incomingBusy} onClick={() => handleIncomingAction(event, 'reject')} className="rounded-xl bg-brand-error px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Từ chối</button>
                <button type="button" disabled={incomingBusy} onClick={() => handleIncomingAction(event, 'accept')} className="rounded-xl bg-brand-primary px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Chấp nhận</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
