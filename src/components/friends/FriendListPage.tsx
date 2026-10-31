import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  ArrowUpDown,
  MoreHorizontal,
  UserPlus,
  MessageSquare,
  Video,
  UserX,
  Check,
  X,
  Mail,
  Clock,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Inbox,
  Send,
} from 'lucide-react';
import type { Screen } from '../../types';
import AddFriendModal from './AddFriendModal';
import Avatar from '../common/Avatar';
import {
  friendApi,
  type FriendUser,
  type FriendRequest,
} from '../../services/friendApi';
import { conversationApi } from '../../services/conversationApi';

interface FriendListPageProps {
  onNavigate?: (screen: Screen) => void;
  onLogout?: () => void;
  activeTab: 'friends' | 'requests';
  refreshVersion?: number;
}

export default function FriendListPage({
  onNavigate,
  onLogout,
  activeTab,
  refreshVersion = 0,
}: FriendListPageProps) {
  const navigate = useNavigate();

  // Navigation tab
  const [requestSubTab, setRequestSubTab] = useState<'received' | 'sent'>('received');

  // Friends data
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Friend requests data
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Modals & Menu
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);
  const [feedbackNotice, setFeedbackNotice] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackNotice({ type, text });
    setTimeout(() => setFeedbackNotice(null), 3500);
  };

  // Fetch friends
  const loadFriends = async () => {
    setLoadingFriends(true);
    try {
      const data = await friendApi.getFriends(searchQuery, sortOrder);
      setFriends(data);
    } catch (err) {
      console.error(err);
      showToast('Không thể tải danh sách bạn bè', 'error');
    } finally {
      setLoadingFriends(false);
    }
  };

  // Fetch friend requests
  const loadRequests = async () => {
    setLoadingRequests(true);
    try {
      const data = await friendApi.getFriendRequests();
      setReceivedRequests(data.received);
      setSentRequests(data.sent);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    loadFriends();
    loadRequests();
  }, [sortOrder, refreshVersion]);

  // Filtered friends
  const filteredFriends = useMemo(() => {
    let list = [...friends];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (f) =>
          f.fullName.toLowerCase().includes(q) ||
          f.username.toLowerCase().includes(q) ||
          f.email.toLowerCase().includes(q)
      );
    }
    return list;
  }, [friends, searchQuery]);

  // Group friends alphabetically by initial letter (A, B, C...)
  const groupedFriends = useMemo(() => {
    const groups: Record<string, FriendUser[]> = {};
    for (const friend of filteredFriends) {
      const name = friend.fullName.trim();
      // Get first letter
      const firstChar = (name[0] || '#').toUpperCase();
      // Normalize Vietnamese accents if needed or keep uppercase letter
      const letter = firstChar.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const key = /[A-Z]/.test(letter) ? letter : '#';
      if (!groups[key]) groups[key] = [];
      groups[key].push(friend);
    }

    // Sort letters
    const sortedKeys = Object.keys(groups).sort((a, b) =>
      sortOrder === 'asc' ? a.localeCompare(b) : b.localeCompare(a)
    );

    return sortedKeys.map((letter) => ({
      letter,
      items: groups[letter],
    }));
  }, [filteredFriends, sortOrder]);

  // Handle Accept Request
  const handleAcceptRequest = async (requestId: string, senderName: string) => {
    try {
      await friendApi.acceptFriendRequest(requestId);
      showToast(`Đã đồng ý kết bạn với ${senderName}`);
      loadRequests();
      loadFriends();
    } catch (err: any) {
      showToast(err.message || 'Không thể đồng ý kết bạn', 'error');
    }
  };

  // Handle Reject Request (Từ chối)
  const handleRejectRequest = async (requestId: string, senderName: string) => {
    try {
      await friendApi.rejectFriendRequest(requestId);
      showToast(`Đã từ chối lời mời kết bạn từ ${senderName}`);
      loadRequests();
    } catch (err: any) {
      showToast(err.message || 'Không thể từ chối lời mời', 'error');
    }
  };

  // Handle Cancel Sent Request (Thu hồi)
  const handleCancelSentRequest = async (requestId: string, receiverName: string) => {
    try {
      await friendApi.cancelFriendRequest(requestId);
      showToast(`Đã thu hồi lời mời kết bạn tới ${receiverName}`);
      loadRequests();
    } catch (err: any) {
      showToast(err.message || 'Không thể thu hồi lời mời', 'error');
    }
  };

  // Handle Unfriend (Hủy kết bạn)
  const handleUnfriend = async (friend: FriendUser) => {
    if (!window.confirm(`Bạn có chắc chắn muốn hủy kết bạn với ${friend.fullName}?`)) {
      return;
    }
    try {
      await friendApi.removeFriend(friend.userId);
      showToast(`Đã hủy kết bạn với ${friend.fullName}`);
      setActiveActionMenuId(null);
      loadFriends();
    } catch (err: any) {
      showToast(err.message || 'Không thể hủy kết bạn', 'error');
    }
  };

  // Handle Start Chat with friend
  const handleStartChat = async (friend: FriendUser) => {
    try {
      // Try to find or create conversation
      const convos = await conversationApi.list();
      const existing = convos.find((c) =>
        c.type === 'PRIVATE' && c.participants.some((p) => p.userId === friend.userId)
      );
      if (existing) {
        navigate('/dashboard', { state: { conversationId: existing.conversationId } });
      } else {
        const created = await conversationApi.create('PRIVATE', [friend.userId]);
        navigate('/dashboard', { state: { conversationId: created.conversationId } });
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không thể mở cuộc trò chuyện.', 'error');
    }
  };

  return (
    <>
      {/* Container - Styled closely matching Zalo dark contact page in Image 2 */}
      <div className="min-h-[calc(100vh-80px)] bg-[#f7faf9] p-6 text-[#233531]">
        <div className="mx-auto max-w-6xl">
          {/* Toast Notification */}
          {feedbackNotice && (
            <div
              className={`mb-4 flex items-center gap-2.5 rounded-xl border p-3.5 text-sm font-semibold shadow-lg ${
                feedbackNotice.type === 'success'
                  ? 'border-[#b7d8ce] bg-[#e2f1eb] text-[#306b63]'
                  : 'border-[#efc9c1] bg-[#fff4f1] text-[#a34e40]'
              }`}
            >
              {feedbackNotice.type === 'success' ? (
                <CheckCircle2 className="h-5 w-5 shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 shrink-0" />
              )}
              <span>{feedbackNotice.text}</span>
            </div>
          )}

          <div className="mb-5 flex items-center justify-between gap-3">
            <h1 className="text-lg font-bold text-[#233531]">{activeTab === 'friends' ? 'Danh sách bạn bè' : 'Lời mời kết bạn'}</h1>
            <button type="button" onClick={() => setIsAddModalOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-[#3e8077] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#306b63] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3e8077]">
              <UserPlus className="h-4 w-4" aria-hidden="true" />Thêm bạn
            </button>
          </div>

          {/* TAB 1: Danh sách bạn bè (Matching Image 2) */}
          {activeTab === 'friends' && (
            <div className="space-y-4">

              {/* Filter / Search Toolbar (Image 2) */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Search input: "Tìm bạn" */}
                <div className="relative min-w-0 flex-1 basis-full sm:basis-[280px]">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#647a79]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm bạn theo tên hoặc username"
                    className="w-full rounded-xl border border-[#dce9e5] bg-white py-2.5 pl-10 pr-4 text-xs font-semibold text-[#233531] placeholder:text-[#879991] outline-none focus:border-[#3e8077] focus:ring-2 focus:ring-[#3e8077]/20 transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#647a79] hover:text-[#233531]"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Sort dropdown: "Tên (A-Z)" */}
                <div className="relative flex items-center rounded-xl border border-[#dce9e5] bg-white px-3 py-2 text-xs font-semibold text-[#647a79]">
                  <ArrowUpDown className="mr-2 h-3.5 w-3.5 text-[#647a79]" />
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as any)}
                    className="bg-transparent text-xs text-[#233531] outline-none cursor-pointer"
                  >
                    <option value="asc" className="bg-white text-[#233531]">
                      Tên (A-Z)
                    </option>
                    <option value="desc" className="bg-white text-[#233531]">
                      Tên (Z-A)
                    </option>
                  </select>
                </div>

              </div>

              {/* Grouped Alphabetical Friend List (Image 2: A, B, C...) */}
              <div className="mt-4 rounded-2xl border border-[#dce9e5] bg-white p-4 shadow-sm">
                {loadingFriends ? (
                  <div className="space-y-3 py-3" aria-label="Đang tải danh sách bạn bè">{[1,2,3].map((item) => <div key={item} className="flex animate-pulse items-center gap-3 px-3 py-2"><span className="h-11 w-11 rounded-full bg-[#e2f1eb]" /><span className="h-4 w-40 rounded bg-[#e2f1eb]" /></div>)}</div>
                ) : groupedFriends.length === 0 ? (
                  <div className="py-8 text-center text-[#647a79]">
                    <Users className="mx-auto mb-2 h-7 w-7 text-[#8bb6a9]" aria-hidden="true" /><p className="text-sm font-semibold">{searchQuery.trim() ? 'Không tìm thấy bạn bè phù hợp.' : 'Bạn chưa có bạn bè nào.'}</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#e2ebe8]">
                    {groupedFriends.map((group) => (
                      <div key={group.letter} className="py-2 first:pt-0 last:pb-0">
                        {/* Alphabet Section Header (A, B, C...) */}
                        <div className="rounded-lg bg-[#e2f1eb] px-3 py-1.5 text-xs font-extrabold text-[#306b63] tracking-wider">
                          {group.letter}
                        </div>

                        {/* Friends in group */}
                        <div className="space-y-1">
                          {group.items.map((friend) => (
                            <div
                              key={friend.id || friend.userId}
                              className="group relative flex items-center justify-between border-b border-[#e2ebe8] px-3 py-2.5 hover:bg-[#f0f8f5] transition-colors last:border-0"
                            >
                              {/* Left: Avatar + Name */}
                              <button type="button"
                                onClick={() => handleStartChat(friend)}
                                className="flex min-w-0 flex-1 items-center gap-3.5 rounded-lg text-left focus-visible:outline-2 focus-visible:outline-[#3e8077]"
                              >
                                <Avatar src={friend.avatar} name={friend.fullName} size="md" />

                                <div className="min-w-0">
                                  <div className="truncate text-sm font-semibold text-[#233531] group-hover:text-[#306b63] transition-colors">
                                    {friend.fullName}
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-[#647a79]">
                                    <span>@{friend.username}</span>
                                    {friend.email && (
                                      <>
                                        <span>•</span>
                                        <span className="truncate max-w-[220px]">
                                          {friend.email}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </button>

                              {/* Right: Actions menu `...` button */}
                              <div className="relative flex shrink-0 items-center gap-1">
                                <button type="button" onClick={() => handleStartChat(friend)} aria-label={`Nhắn tin cho ${friend.fullName}`} className="flex h-10 w-10 items-center justify-center rounded-lg text-[#3e8077] hover:bg-[#e2f1eb] focus-visible:outline-2 focus-visible:outline-[#3e8077]"><MessageSquare className="h-4 w-4" /></button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setActiveActionMenuId(
                                      activeActionMenuId === friend.id ? null : friend.id
                                    )
                                  }
                                  className="flex h-10 w-10 items-center justify-center rounded-lg text-[#647a79] hover:bg-[#e2f1eb] hover:text-[#306b63] focus-visible:outline-2 focus-visible:outline-[#3e8077] transition-colors"
                                  aria-label="Tùy chọn"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </button>

                                {/* Dropdown menu */}
                                {activeActionMenuId === friend.id && (
                                  <div
                                    onMouseLeave={() => setActiveActionMenuId(null)}
                                    className="absolute right-0 top-11 z-30 w-44 rounded-xl border border-[#dce9e5] bg-white py-1.5 shadow-lg"
                                  >
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveActionMenuId(null);
                                        handleStartChat(friend);
                                      }}
                                      className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-xs font-semibold text-[#233531] hover:bg-[#f0f8f5] hover:text-[#233531]"
                                    >
                                      <MessageSquare className="h-3.5 w-3.5 text-[#3e8077]" />
                                      <span>Nhắn tin</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveActionMenuId(null);
                                        navigate('/dashboard');
                                      }}
                                      className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-xs font-semibold text-[#233531] hover:bg-[#f0f8f5] hover:text-[#233531]"
                                    >
                                      <Video className="h-3.5 w-3.5 text-emerald-400" />
                                      <span>Gọi video</span>
                                    </button>

                                    <div className="my-1 border-t border-[#dce9e5]" />

                                    <button
                                      type="button"
                                      onClick={() => handleUnfriend(friend)}
                                      className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-xs font-semibold text-[#a34e40] hover:bg-[#fff4f1] hover:text-[#a34e40]"
                                    >
                                      <UserX className="h-3.5 w-3.5" />
                                      <span>Hủy kết bạn</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Lời mời kết bạn (Received & Sent requests with Accept, Reject/Từ chối, Cancel) */}
          {activeTab === 'requests' && (
            <div className="space-y-4">
              {/* Sub-tabs for requests */}
              <div className="flex gap-2 border-b border-[#dce9e5] pb-3">
                <button
                  type="button"
                  onClick={() => setRequestSubTab('received')}
                  className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
                    requestSubTab === 'received'
                      ? 'bg-[#3e8077] text-[#233531] shadow-sm'
                      : 'text-[#647a79] hover:bg-white hover:text-[#233531]'
                  }`}
                >
                  <Inbox className="h-3.5 w-3.5" />
                  <span>Lời mời đã nhận</span>
                  <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px]">
                    {receivedRequests.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setRequestSubTab('sent')}
                  className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
                    requestSubTab === 'sent'
                      ? 'bg-[#3e8077] text-[#233531] shadow-sm'
                      : 'text-[#647a79] hover:bg-white hover:text-[#233531]'
                  }`}
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Lời mời đã gửi</span>
                  <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px]">
                    {sentRequests.length}
                  </span>
                </button>
              </div>

              {/* Sub-tab: Received Requests */}
              {requestSubTab === 'received' && (
                <div className="rounded-2xl border border-[#dce9e5] bg-white p-4">
                  {loadingRequests ? (
                    <div className="py-16 text-center text-xs text-[#647a79]">
                      Đang tải lời mời kết bạn…
                    </div>
                  ) : receivedRequests.length === 0 ? (
                    <div className="py-16 text-center text-[#647a79]">
                      <Inbox className="mx-auto h-8 w-8 text-[#8aa59b] mb-2" />
                      <p className="text-sm font-semibold">Chưa có dữ liệu</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {receivedRequests.map((req) => (
                        <div
                          key={req.id}
                          className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#dce9e5] bg-white p-4 transition-colors hover:border-[#343840]"
                        >
                          {/* Sender Info */}
                          <div className="flex items-center gap-3.5">
                            <Avatar src={req.sender.avatar} name={req.sender.fullName} size="lg" />
                            <div>
                              <h4 className="text-sm font-bold text-[#233531]">
                                {req.sender.fullName}
                              </h4>
                              <div className="flex items-center gap-2 text-xs text-[#647a79]">
                                <span>@{req.sender.username}</span>
                                {req.sender.email && (
                                  <>
                                    <span>•</span>
                                    <span>{req.sender.email}</span>
                                  </>
                                )}
                              </div>
                              <div className="mt-1 flex items-center gap-1 text-[11px] text-[#647a79]">
                                <Clock className="h-3 w-3" />
                                <span>
                                  {new Date(req.createdAt).toLocaleDateString('vi-VN')}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons: Đồng ý & Từ chối */}
                          <div className="flex items-center gap-2">
                            {/* Từ chối button */}
                            <button
                              type="button"
                              onClick={() =>
                                handleRejectRequest(req.id, req.sender.fullName)
                              }
                              className="flex items-center gap-1.5 rounded-xl border border-[#3b3f47] bg-white px-4 py-2 text-xs font-bold text-[#647a79] hover:bg-[#343842] hover:text-[#233531] transition-colors"
                            >
                              <X className="h-3.5 w-3.5 text-[#a34e40]" />
                              <span>Từ chối</span>
                            </button>

                            {/* Đồng ý button */}
                            <button
                              type="button"
                              onClick={() =>
                                handleAcceptRequest(req.id, req.sender.fullName)
                              }
                              className="flex items-center gap-1.5 rounded-xl bg-[#3e8077] px-4 py-2 text-xs font-bold text-white hover:bg-[#306b63] transition-colors shadow-sm shadow-[#3e8077]/15"
                            >
                              <Check className="h-3.5 w-3.5" />
                              <span>Đồng ý</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Sub-tab: Sent Requests */}
              {requestSubTab === 'sent' && (
                <div className="rounded-2xl border border-[#dce9e5] bg-white p-4">
                  {sentRequests.length === 0 ? (
                    <div className="py-16 text-center text-[#647a79]">
                      <Send className="mx-auto h-8 w-8 text-[#8aa59b] mb-2" />
                      <p className="text-sm font-semibold">Chưa có dữ liệu</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sentRequests.map((req) => (
                        <div
                          key={req.id}
                          className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#dce9e5] bg-white p-4 transition-colors hover:border-[#343840]"
                        >
                          <div className="flex items-center gap-3.5">
                            <Avatar src={req.receiver.avatar} name={req.receiver.fullName} size="lg" />
                            <div>
                              <h4 className="text-sm font-bold text-[#233531]">
                                {req.receiver.fullName}
                              </h4>
                              <div className="flex items-center gap-2 text-xs text-[#647a79]">
                                <span>@{req.receiver.username}</span>
                                {req.receiver.email && (
                                  <>
                                    <span>•</span>
                                    <span>{req.receiver.email}</span>
                                  </>
                                )}
                              </div>
                              <div className="mt-1 flex items-center gap-1 text-[11px] text-[#647a79]">
                                <Clock className="h-3 w-3" />
                                <span>
                                  Đã gửi ngày{' '}
                                  {new Date(req.createdAt).toLocaleDateString('vi-VN')}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Thu hồi button */}
                          <div>
                            <button
                              type="button"
                              onClick={() =>
                                handleCancelSentRequest(req.id, req.receiver.fullName)
                              }
                              className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-[#fff4f1] px-4 py-2 text-xs font-bold text-[#a34e40] hover:bg-[#fee9e3] transition-colors"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              <span>Thu hồi lời mời</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Friend Modal (matching Image 1) */}
      <AddFriendModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onFriendAdded={() => {
          loadFriends();
          loadRequests();
        }}
      />
    </>
  );
}



