import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Globe,
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
  const [suggestions, setSuggestions] = useState<FriendUser[]>([]);
  const [searchResults, setSearchResults] = useState<FriendUser[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [pendingSentIds, setPendingSentIds] = useState<Set<number>>(new Set());
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Load suggestions when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSearchResults(null);
      setActionNotice(null);
      loadSuggestions();
    }
  }, [isOpen]);

  const loadSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const list = await friendApi.getSuggestions();
      setSuggestions(list);
    } catch {
      // fallback
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    setSearching(true);
    setActionNotice(null);
    try {
      const results = await friendApi.searchUsers(searchQuery);
      setSearchResults(results);
    } catch (err) {
      console.error(err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (user: FriendUser) => {
    try {
      await friendApi.sendFriendRequest(user);
      setPendingSentIds((prev) => new Set(prev).add(user.userId));
      setActionNotice(`Đã gửi lời mời kết bạn tới ${user.fullName}`);
      setTimeout(() => setActionNotice(null), 3500);

      // Refresh suggestions status
      setSuggestions((prev) =>
        prev.map((s) =>
          s.userId === user.userId ? { ...s, requestStatus: 'SENT' } : s
        )
      );

      if (searchResults) {
        setSearchResults((prev) =>
          (prev ?? []).map((u) =>
            u.userId === user.userId ? { ...u, requestStatus: 'SENT' } : u
          )
        );
      }

      onFriendAdded?.();
    } catch (err: any) {
      setActionNotice(err.message || 'Không thể gửi lời mời kết bạn');
    }
  };

  if (!isOpen) return null;

  const displayedSuggestions = showAllSuggestions
    ? suggestions
    : suggestions.slice(0, 3);

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
          aria-labelledby="add-friend-title"
          className="relative z-10 flex max-h-[calc(100dvh-24px)] w-full max-w-[600px] flex-col overflow-hidden rounded-[20px] border border-[#dce9e5] bg-white text-[#233531] shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#e2ebe8] px-5 py-5 sm:px-7">
            <div><h2 id="add-friend-title" className="text-lg font-bold text-[#233531]">
              Thêm bạn
            </h2><p className="mt-1 text-sm text-[#647a79]">Tìm kiếm bằng email hoặc username để gửi lời mời kết bạn.</p></div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center rounded-xl text-[#647a79] hover:bg-[#f2f8f6] focus-visible:outline-2 focus-visible:outline-[#3e8077] transition-colors"
              aria-label="Đóng"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="min-h-0 overflow-y-auto p-5 sm:p-7">
            {/* Search Input Box */}
            <form onSubmit={handleSearch} className="space-y-3">
              <div className="relative flex h-[52px] items-center rounded-xl border border-[#b7d8ce] bg-[#f8fbfa] px-3.5 transition-all focus-within:border-[#3e8077] focus-within:ring-2 focus-within:ring-[#3e8077]/15">
                <Search className="h-4 w-4 shrink-0 text-[#647a79]" aria-hidden="true" />

                {/* Input */}
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (!e.target.value.trim()) setSearchResults(null);
                  }}
                  placeholder="Nhập email hoặc username..."
                  onKeyDown={(event) => { if (event.key === 'Enter') void handleSearch(); }}
                  autoFocus
                  className="w-full bg-transparent px-3 py-2 text-sm text-[#233531] placeholder:text-[#82918c] outline-none"
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
            <div className="mt-5 max-h-[300px] overflow-y-auto pr-1">
              {searching ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <LoaderCircle className="h-7 w-7 animate-spin text-[#0068ff]" />
                  <p className="mt-2 text-xs">Đang tìm kiếm người dùng…</p>
                </div>
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
                                  Kết bạn
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
                /* Suggestions View ("Có thể bạn quen") - Exactly like Image 1 */
                <div>
                  <div className="mb-3.5 flex items-center gap-2 text-xs font-semibold text-gray-300">
                    <Globe className="h-4 w-4 text-[#0068ff]" />
                    <span>Có thể bạn quen</span>
                  </div>

                  {loadingSuggestions ? (
                    <div className="flex justify-center py-8">
                      <LoaderCircle className="h-6 w-6 animate-spin text-[#0068ff]" />
                    </div>
                  ) : suggestions.length === 0 ? (
                    <p className="py-5 text-center text-sm text-[#647a79]">Chưa có gợi ý kết bạn</p>
                  ) : (
                    <div className="space-y-3.5">
                      {displayedSuggestions.map((user) => {
                        const isPending =
                          user.requestStatus === 'SENT' ||
                          pendingSentIds.has(user.userId);
                        return (
                          <div
                            key={user.id || user.userId}
                            className="flex items-center justify-between py-1"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar src={user.avatar} name={user.fullName} size="sm" />
                              <div>
                                <h4 className="text-sm font-bold text-white">
                                  {user.fullName}
                                </h4>
                    <p className="text-xs text-[#647a79]">{user.sourceHint || (user.username ? `@${user.username}` : '')}</p>
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
                                  className="rounded-lg border border-[#0068ff] px-4 py-1.5 text-xs font-bold text-[#0068ff] hover:bg-[#0068ff] hover:text-white transition-all"
                                >
                                  Kết bạn
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {suggestions.length > 3 && !showAllSuggestions && (
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => setShowAllSuggestions(true)}
                            className="text-xs font-semibold text-[#0068ff] hover:underline"
                          >
                            Xem thêm
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer - Matching Image 1 (Hủy & Tìm kiếm) */}
          <div className="flex items-center justify-end gap-3 border-t border-[#dce9e5] bg-white px-6 py-3.5">
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 rounded-xl border border-[#b7d8ce] bg-white px-5 text-sm font-semibold text-[#306b63] hover:bg-[#f8fbfa] transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => handleSearch()}
              disabled={!searchQuery.trim() || searching}
              className="flex min-h-11 items-center gap-1.5 rounded-xl bg-[#3e8077] px-5 text-sm font-bold text-white hover:bg-[#306b63] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
