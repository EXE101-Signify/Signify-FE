import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Search,
  Check,
  UserPlus,
  LoaderCircle,
  UserCheck,
} from 'lucide-react';
import { friendApi, type FriendUser } from '../../services/friendApi';
import Avatar from '../common/Avatar';

interface AddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFriendAdded?: () => void;
}

export default function AddFriendModal({
  isOpen,
  onClose,
  onFriendAdded,
}: AddFriendModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FriendUser[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [pendingSentIds, setPendingSentIds] = useState<Set<number>>(new Set());
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Reset search when the modal opens.
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSearchResults(null);
      setActionNotice(null);
      setSearchError(null);
    }
  }, [isOpen]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    setSearching(true);
    setActionNotice(null);
    setSearchError(null);
    try {
      const results = await friendApi.searchUsers(searchQuery);
      setSearchResults(results);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Không thể tìm kiếm người dùng.');
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (user: FriendUser) => {
    try {
      const status = await friendApi.sendFriendRequest(user);
      if (status === 'SENT') setPendingSentIds((prev) => new Set(prev).add(user.userId));
      setActionNotice(status === 'FRIEND' ? `Đã kết bạn với ${user.fullName}` : `Đã gửi lời mời kết bạn tới ${user.fullName}`);
      setTimeout(() => setActionNotice(null), 3500);

      if (searchResults) {
        setSearchResults((prev) =>
          (prev ?? []).map((u) =>
            u.userId === user.userId ? { ...u, requestStatus: status === 'SENT' ? 'SENT' : 'NONE', isFriend: status === 'FRIEND' } : u
          )
        );
      }

      onFriendAdded?.();
    } catch (err: any) {
      setActionNotice(err.message || 'Không thể gửi lời mời kết bạn');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
        />

        {/* Modal Window styled exactly like Zalo dark popup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          role="dialog"
          aria-modal="true"
          className="relative z-10 w-full max-w-[490px] overflow-hidden rounded-2xl border border-[#32363e] bg-[#20242a] text-[#e1e4ea] shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#2e333b] px-6 py-4">
            <h2 className="text-base font-bold text-white tracking-wide">
              Thêm bạn
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-[#2b3038] hover:text-white transition-colors"
              aria-label="Đóng"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            {/* Search Input Box */}
            <form onSubmit={handleSearch} className="space-y-3">
              <div className="relative flex items-center rounded-xl border border-[#393e48] bg-[#181a1e] px-3.5 py-1.5 focus-within:border-[#0068ff] focus-within:ring-2 focus-within:ring-[#0068ff]/20 transition-all">
                <Search className="h-4 w-4 shrink-0 text-[#60a5fa]" aria-hidden="true" />

                {/* Input */}
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (!e.target.value.trim()) setSearchResults(null);
                  }}
                  placeholder="Nhập email hoặc username..."
                  maxLength={150}
                  autoFocus
                  className="w-full bg-transparent px-3 py-2 text-sm text-white placeholder-gray-500 outline-none"
                />

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults(null);
                    }}
                    className="p-1 text-gray-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </form>

            {/* Notification alert banner */}
            {actionNotice && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 flex items-center gap-2 rounded-lg bg-[#0068ff]/15 border border-[#0068ff]/30 px-3.5 py-2 text-xs font-semibold text-[#60a5fa]"
              >
                <Check className="h-4 w-4 shrink-0 text-[#60a5fa]" />
                <span>{actionNotice}</span>
              </motion.div>
            )}

            {/* Content: Search Results OR Suggestions */}
            <div className="mt-5 min-h-[220px] max-h-[300px] overflow-y-auto pr-1">
              {searching ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <LoaderCircle className="h-7 w-7 animate-spin text-[#0068ff]" />
                  <p className="mt-2 text-xs">Đang tìm kiếm người dùng…</p>
                </div>
              ) : searchError ? (
                <div role="alert" className="rounded-xl border border-red-300 p-4 text-sm text-red-300">{searchError}</div>
              ) : searchResults !== null ? (
                /* Search Results View */
                <div>
                  <div className="mb-3 flex items-center justify-between text-xs font-semibold text-gray-400">
                    <span>Kết quả tìm kiếm ({searchResults.length})</span>
                    <button
                      type="button"
                      onClick={() => setSearchResults(null)}
                      className="text-[#60a5fa] hover:underline"
                    >
                      Quay lại gợi ý
                    </button>
                  </div>

                  {searchResults.length === 0 ? (
                    <div className="rounded-xl border border-[#32363e] bg-[#1a1c20] p-6 text-center">
                      <p className="text-sm font-medium text-gray-300">
                        Không tìm thấy người dùng
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {searchResults.map((user) => {
                        const isPending =
                          user.requestStatus === 'SENT' ||
                          pendingSentIds.has(user.userId);
                        return (
                          <div
                            key={user.id || user.userId}
                            className="flex items-center justify-between rounded-xl border border-[#2e333b] bg-[#1a1d22] p-3 hover:border-[#3d434d] transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar src={user.avatar} name={user.fullName} size="md" />
                              <div>
                                <h4 className="text-sm font-bold text-white">
                                  {user.fullName}
                                </h4>
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                  <span>@{user.username}</span>
                                  {user.email && (
                                    <>
                                      <span>•</span>
                                      <span className="truncate max-w-[170px]">
                                        {user.email}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div>
                              {user.isFriend ? (
                                <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
                                  <UserCheck className="h-3.5 w-3.5" />
                                  Bạn bè
                                </span>
                              ) : isPending ? (
                                <span className="inline-flex items-center gap-1 rounded-lg bg-gray-700/60 px-3 py-1.5 text-xs font-semibold text-gray-300">
                                  <Check className="h-3.5 w-3.5 text-[#60a5fa]" />
                                  Đã gửi
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleSendRequest(user)}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#0068ff] bg-transparent px-3.5 py-1.5 text-xs font-bold text-[#0068ff] hover:bg-[#0068ff] hover:text-white transition-all shadow-xs"
                                >
                                  <UserPlus className="h-3.5 w-3.5" />
                                  {user.requestStatus === 'RECEIVED' ? 'Chấp nhận' : 'Kết bạn'}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex min-h-[180px] items-center justify-center px-4 text-center text-sm text-gray-400">
                  Nhập email hoặc username rồi chọn Tìm kiếm để kết bạn.
                </div>
              )}
            </div>
          </div>

          {/* Footer - Matching Image 1 (Hủy & Tìm kiếm) */}
          <div className="flex items-center justify-end gap-3 border-t border-[#2e333b] bg-[#1a1d22] px-6 py-3.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-[#2e333c] px-5 py-2 text-xs font-bold text-gray-200 hover:bg-[#383d47] hover:text-white transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => handleSearch()}
              disabled={!searchQuery.trim() || searching}
              className="flex items-center gap-1.5 rounded-lg bg-[#0068ff] px-5 py-2 text-xs font-bold text-white hover:bg-[#0057d9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-[#0068ff]/20"
            >
              {searching ? (
                <>
                  <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                  Đang tìm…
                </>
              ) : (
                'Tìm kiếm'
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
