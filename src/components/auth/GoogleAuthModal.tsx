import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ShieldCheck, UserPlus, X, AlertCircle } from 'lucide-react';
import GoogleIcon from './GoogleIcon';

export interface GoogleUserInfo {
  name: string;
  email: string;
  avatar: string;
}

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: GoogleUserInfo) => void;
}

const MOCK_ACCOUNTS: GoogleUserInfo[] = [
  {
    name: 'Thanh Liêm',
    email: 'thanhliem@signbridge.vn',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150',
  },
  {
    name: 'Phạm Anh Thư',
    email: 'thu.pa@fpt.edu.vn',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
  },
];

export default function GoogleAuthModal({
  isOpen,
  onClose,
  onSuccess,
}: GoogleAuthModalProps) {
  const [selectedAccount, setSelectedAccount] = useState<GoogleUserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSelect = (account: GoogleUserInfo) => {
    setSelectedAccount(account);
    setError('');
  };

  const handleConfirmLogin = (account: GoogleUserInfo) => {
    setIsLoading(true);
    setError('');

    // Simulate OAuth token exchange and authentication logic
    setTimeout(() => {
      setIsLoading(false);
      onSuccess(account);
      onClose();
    }, 900);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail || !customEmail.includes('@')) {
      setError('Vui lòng nhập địa chỉ email Google hợp lệ.');
      return;
    }

    const newAccount: GoogleUserInfo = {
      name: customEmail.split('@')[0],
      email: customEmail.trim(),
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
    };

    handleConfirmLogin(newAccount);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl border border-gray-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div className="flex items-center gap-2.5">
              <GoogleIcon className="h-5 w-5" />
              <span className="text-sm font-semibold text-gray-800">
                Đăng nhập bằng Google
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-6">
            <div className="text-center mb-6">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary-light/50 text-brand-primary mb-3">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-gray-900">
                Chọn tài khoản
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                để tiếp tục tới ứng dụng <span className="font-extrabold text-brand-primary">SignBridge</span>
              </p>
            </div>

            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-600 border border-red-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {!isCustomMode ? (
              <div className="space-y-3">
                {MOCK_ACCOUNTS.map((account) => {
                  const isSelected = selectedAccount?.email === account.email;
                  return (
                    <button
                      key={account.email}
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleSelect(account)}
                      className={`flex w-full items-center justify-between rounded-xl border p-3.5 text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-brand-primary bg-brand-primary-light/10 ring-2 ring-brand-primary/20'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={account.avatar}
                          alt={account.name}
                          className="h-10 w-10 rounded-full border border-gray-200 object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <div className="text-xs font-bold text-gray-900">
                            {account.name}
                          </div>
                          <div className="text-[11px] text-gray-500">
                            {account.email}
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-primary text-white">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                      )}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setIsCustomMode(true)}
                  className="flex w-full items-center gap-3 rounded-xl border border-dashed border-gray-300 p-3.5 text-left text-xs font-semibold text-gray-600 hover:border-brand-primary hover:text-brand-primary transition-all cursor-pointer"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                    <UserPlus className="h-4 w-4" />
                  </div>
                  <span>Sử dụng một tài khoản Google khác</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleCustomSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                    Email tài khoản Google
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="user@gmail.com"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-xs font-semibold text-gray-900 outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCustomMode(false)}
                    className="w-1/2 rounded-xl border border-gray-200 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
                  >
                    Quay lại
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 rounded-xl bg-brand-primary py-2.5 text-xs font-bold text-white hover:bg-brand-primary-hover cursor-pointer"
                  >
                    Xác nhận
                  </button>
                </div>
              </form>
            )}

            {selectedAccount && !isCustomMode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-5 border-t border-gray-100 pt-4"
              >
                <p className="text-[11px] text-gray-500 mb-3">
                  Bằng cách tiếp tục, Google sẽ chia sẻ tên, địa chỉ email và ảnh hồ sơ của bạn với <strong>SignBridge</strong>.
                </p>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleConfirmLogin(selectedAccount)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all cursor-pointer disabled:opacity-60"
                >
                  {isLoading ? 'Đang xác thực OAuth...' : `Tiếp tục với danh nghĩa ${selectedAccount.name}`}
                </button>
              </motion.div>
            )}
          </div>

          <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 text-center text-[10px] text-gray-400">
            Ứng dụng SignBridge tuân thủ Quy định bảo mật Google OAuth
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
