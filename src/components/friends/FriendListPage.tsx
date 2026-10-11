import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  ArrowUpDown,
  Filter,
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
import AppLayout from '../../layouts/AppLayout';
import type { Screen } from '../../types';
import AddFriendModal from './AddFriendModal';
import {
  friendApi,
  type FriendUser,
  type FriendRequest,
} from '../../services/friendApi';
import { conversationApi } from '../../services/conversationApi';

interface FriendListPageProps {
  onNavigate?: (screen: Screen) => void;
  onLogout?: () => void;
}

export default function FriendListPage({
  onNavigate,
  onLogout,
}: FriendListPageProps) {
  const navigate = useNavigate();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');
  const [requestSubTab, setRequestSubTab] = useState<'received' | 'sent'>('received');

  // Friends data
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online'>('all');

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
  }, [sortOrder]);

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
    if (statusFilter === 'online') {
      list = list.filter((f) => f.status === 'online');
    }
    return list;
  }, [friends, searchQuery, statusFilter]);

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
      const convos = await conversationApi.list().catch(() => []);
      const existing = convos.find((c) =>
        c.type === 'PRIVATE' && c.participants.some((p) => p.userId === friend.userId)
      );
      if (existing) {
        navigate('/dashboard', { state: { conversationId: existing.conversationId } });
      } else {
        const created = await conversationApi.create('PRIVATE', [friend.userId]).catch(() => null);
        if (created) {
          navigate('/dashboard', { state: { conversationId: created.conversationId } });
        } else {
          navigate('/dashboard');
        }
      }
    } catch {
      navigate('/dashboard');
    }
  };

  return (
    <AppLayout
      activeScreen="friends"
      title={
        <div className="flex items-center gap-2.5">
          <Users className="h-6 w-6 text-brand-primary" />
          <span>Danh bạ & Bạn bè</span>
        </div>
      }
      subtitle="Quản lý danh sách bạn bè, tìm kiếm theo email / username và xử lý lời mời kết bạn"
      onNavigate={onNavigate}
      onLogout={onLogout}
    >
      {/* Container - Styled closely matching Zalo dark contact page in Image 2 */}
      <div className="min-h-[calc(100vh-80px)] bg-[#18191c] p-6 text-[#e1e4ea]">
        <div className="mx-auto max-w-6xl">
          {/* Top Bar with Tabs and Add Friend Button */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[#282a2e] pb-4">
            {/* Tabs */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('friends')}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                  activeTab === 'friends'
                    ? 'bg-[#2b2e34] text-white shadow-sm border border-[#3b3f46]'
                    : 'text-gray-400 hover:bg-[#202226] hover:text-gray-200'
                }`}
              >
                <Users className="h-4 w-4 text-[#0068ff]" />
                <span>Danh sách bạn bè</span>
                <span className="rounded-full bg-[#1b1c20] px-2 py-0.5 text-xs text-gray-300 border border-[#32353b]">
                  {friends.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('requests')}
                className={`relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                  activeTab === 'requests'
                    ? 'bg-[#2b2e34] text-white shadow-sm border border-[#3b3f46]'
                    : 'text-gray-400 hover:bg-[#202226] hover:text-gray-200'
                }`}
              >
                <Inbox className="h-4 w-4 text-[#0068ff]" />
                <span>Lời mời kết bạn</span>
                {receivedRequests.length > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1.5 text-[11px] font-extrabold text-white">
                    {receivedRequests.length}
                  </span>
                )}
              </button>
            </div>

            {/* Action button "Thêm bạn" - Exactly like Image 1 trigger */}
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-[#0068ff] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-[#0068ff]/25 hover:bg-[#0057d9] transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <UserPlus className="h-4 w-4" />
              <span>Thêm bạn</span>
            </button>
          </div>

          {/* Toast Notification */}
          {feedbackNotice && (
            <div
              className={`mb-4 flex items-center gap-2.5 rounded-xl border p-3.5 text-sm font-semibold shadow-lg ${
                feedbackNotice.type === 'success'
                  ? 'border-emerald-500/30 bg-emerald-950/40 text-emerald-400'
                  : 'border-rose-500/30 bg-rose-950/40 text-rose-400'
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

          {/* TAB 1: Danh sách bạn bè (Matching Image 2) */}
          {activeTab === 'friends' && (
            <div className="space-y-4">
              {/* Header: Bạn bè (count) - Exactly from Image 2 */}
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-300">
                  Bạn bè ({friends.length})
                </h3>
              </div>

              {/* Filter / Search Toolbar (Image 2) */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Search input: "Tìm bạn" */}
                <div className="relative min-w-[280px] flex-1">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm bạn theo tên, email hoặc username"
                    className="w-full rounded-xl border border-[#2b2e34] bg-[#202226] py-2.5 pl-10 pr-4 text-xs font-semibold text-white placeholder-gray-500 outline-none focus:border-[#0068ff] focus:ring-2 focus:ring-[#0068ff]/20 transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Sort dropdown: "Tên (A-Z)" */}
                <div className="relative flex items-center rounded-xl border border-[#2b2e34] bg-[#202226] px-3 py-2 text-xs font-semibold text-gray-300">
                  <ArrowUpDown className="mr-2 h-3.5 w-3.5 text-gray-400" />
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as any)}
                    className="bg-transparent text-xs text-gray-200 outline-none cursor-pointer"
                  >
                    <option value="asc" className="bg-[#202226] text-white">
                      Tên (A-Z)
                    </option>
                    <option value="desc" className="bg-[#202226] text-white">
                      Tên (Z-A)
                    </option>
                  </select>
                </div>

                {/* Filter dropdown: "Tất cả" */}
                <div className="relative flex items-center rounded-xl border border-[#2b2e34] bg-[#202226] px-3 py-2 text-xs font-semibold text-gray-300">
                  <Filter className="mr-2 h-3.5 w-3.5 text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="bg-transparent text-xs text-gray-200 outline-none cursor-pointer"
                  >
                    <option value="all" className="bg-[#202226] text-white">
                      Tất cả
                    </option>
                    <option value="online" className="bg-[#202226] text-white">
                      Đang trực tuyến
                    </option>
                  </select>
                </div>
              </div>

              {/* Grouped Alphabetical Friend List (Image 2: A, B, C...) */}
              <div className="mt-4 rounded-2xl border border-[#23252a] bg-[#1a1c20] p-4 shadow-sm">
                {loadingFriends ? (
                  <div className="py-20 text-center text-gray-400 text-sm">
                    Đang tải danh sách bạn bè…
                  </div>
                ) : groupedFriends.length === 0 ? (
                  <div className="py-16 text-center text-gray-400">
                    <p className="text-sm font-semibold">
                      Không tìm thấy bạn bè phù hợp
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Thử tìm kiếm với từ khóa khác hoặc bấm &quot;Thêm bạn&quot; để kết nối.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#24272c]">
                    {groupedFriends.map((group) => (
                      <div key={group.letter} className="py-2 first:pt-0 last:pb-0">
                        {/* Alphabet Section Header (A, B, C...) */}
                        <div className="py-1.5 text-xs font-extrabold text-gray-400 tracking-wider">
                          {group.letter}
                        </div>

                        {/* Friends in group */}
                        <div className="space-y-1">
                          {group.items.map((friend) => (
                            <div
                              key={friend.id || friend.userId}
                              className="group relative flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-[#23262c] transition-colors"
                            >
                              {/* Left: Avatar + Name */}
                              <div
                                onClick={() => handleStartChat(friend)}
                                className="flex flex-1 items-center gap-3.5 cursor-pointer"
                              >
                                <div className="relative">
                                  <img
                                    src={
                                      friend.avatar ||
                                      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'
                                    }
                                    alt={friend.fullName}
                                    className="h-10 w-10 rounded-full object-cover border border-[#32363e]"
                                  />
                                  <span
                                    className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#18191c] ${
                                      friend.status === 'online'
                                        ? 'bg-emerald-500'
                                        : friend.status === 'busy'
                                        ? 'bg-amber-500'
                                        : 'bg-gray-500'
                                    }`}
                                  />
                                </div>

                                <div className="min-w-0">
                                  <div className="truncate text-sm font-semibold text-white group-hover:text-[#60a5fa] transition-colors">
                                    {friend.fullName}
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-gray-400">
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
                              </div>

                              {/* Right: Actions menu `...` button */}
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setActiveActionMenuId(
                                      activeActionMenuId === friend.id ? null : friend.id
                                    )
                                  }
                                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-[#2e3138] hover:text-white transition-colors"
                                  aria-label="Tùy chọn"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </button>

                                {/* Dropdown menu */}
                                {activeActionMenuId === friend.id && (
                                  <div
                                    onMouseLeave={() => setActiveActionMenuId(null)}
                                    className="absolute right-0 top-9 z-30 w-44 rounded-xl border border-[#33373f] bg-[#22252b] py-1.5 shadow-2xl"
                                  >
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveActionMenuId(null);
                                        handleStartChat(friend);
                                      }}
                                      className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-xs font-semibold text-gray-200 hover:bg-[#2d3139] hover:text-white"
                                    >
                                      <MessageSquare className="h-3.5 w-3.5 text-[#0068ff]" />
                                      <span>Nhắn tin</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveActionMenuId(null);
                                        navigate('/dashboard');
                                      }}
                                      className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-xs font-semibold text-gray-200 hover:bg-[#2d3139] hover:text-white"
                                    >
                                      <Video className="h-3.5 w-3.5 text-emerald-400" />
                                      <span>Gọi video</span>
                                    </button>

                                    <div className="my-1 border-t border-[#2e3138]" />

                                    <button
                                      type="button"
                                      onClick={() => handleUnfriend(friend)}
                                      className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-xs font-semibold text-rose-400 hover:bg-rose-950/40 hover:text-rose-300"
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
              <div className="flex gap-2 border-b border-[#282a2e] pb-3">
                <button
                  type="button"
                  onClick={() => setRequestSubTab('received')}
                  className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
                    requestSubTab === 'received'
                      ? 'bg-[#0068ff] text-white shadow-sm'
                      : 'text-gray-400 hover:bg-[#202226] hover:text-white'
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
                      ? 'bg-[#0068ff] text-white shadow-sm'
                      : 'text-gray-400 hover:bg-[#202226] hover:text-white'
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
                <div className="rounded-2xl border border-[#23252a] bg-[#1a1c20] p-4">
                  {loadingRequests ? (
                    <div className="py-16 text-center text-xs text-gray-400">
                      Đang tải lời mời kết bạn…
                    </div>
                  ) : receivedRequests.length === 0 ? (
                    <div className="py-16 text-center text-gray-400">
                      <Inbox className="mx-auto h-8 w-8 text-gray-600 mb-2" />
                      <p className="text-sm font-semibold">
                        Không có lời mời kết bạn nào
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Khi người khác gửi lời mời cho bạn, chúng sẽ xuất hiện ở đây.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {receivedRequests.map((req) => (
                        <div
                          key={req.id}
                          className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#282b31] bg-[#202328] p-4 transition-colors hover:border-[#343840]"
                        >
                          {/* Sender Info */}
                          <div className="flex items-center gap-3.5">
                            <img
                              src={
                                req.sender.avatar ||
                                'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'
                              }
                              alt={req.sender.fullName}
                              className="h-12 w-12 rounded-full object-cover border border-[#393e48]"
                            />
                            <div>
                              <h4 className="text-sm font-bold text-white">
                                {req.sender.fullName}
                              </h4>
                              <div className="flex items-center gap-2 text-xs text-gray-400">
                                <span>@{req.sender.username}</span>
                                {req.sender.email && (
                                  <>
                                    <span>•</span>
                                    <span>{req.sender.email}</span>
                                  </>
                                )}
                              </div>
                              {req.message && (
                                <p className="mt-1 rounded-md bg-[#18191c] px-2.5 py-1 text-xs text-gray-300">
                                  &ldquo;{req.message}&rdquo;
                                </p>
                              )}
                              <div className="mt-1 flex items-center gap-1 text-[11px] text-gray-500">
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
                              className="flex items-center gap-1.5 rounded-xl border border-[#3b3f47] bg-[#282b32] px-4 py-2 text-xs font-bold text-gray-300 hover:bg-[#343842] hover:text-white transition-colors"
                            >
                              <X className="h-3.5 w-3.5 text-rose-400" />
                              <span>Từ chối</span>
                            </button>

                            {/* Đồng ý button */}
                            <button
                              type="button"
                              onClick={() =>
                                handleAcceptRequest(req.id, req.sender.fullName)
                              }
                              className="flex items-center gap-1.5 rounded-xl bg-[#0068ff] px-4 py-2 text-xs font-bold text-white hover:bg-[#0057d9] transition-colors shadow-sm shadow-[#0068ff]/30"
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
                <div className="rounded-2xl border border-[#23252a] bg-[#1a1c20] p-4">
                  {sentRequests.length === 0 ? (
                    <div className="py-16 text-center text-gray-400">
                      <Send className="mx-auto h-8 w-8 text-gray-600 mb-2" />
                      <p className="text-sm font-semibold">
                        Chưa có lời mời kết bạn nào đã gửi
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Bấm &quot;Thêm bạn&quot; để tìm và gửi lời mời kết nối.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sentRequests.map((req) => (
                        <div
                          key={req.id}
                          className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#282b31] bg-[#202328] p-4 transition-colors hover:border-[#343840]"
                        >
                          <div className="flex items-center gap-3.5">
                            <img
                              src={
                                req.receiver.avatar ||
                                'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'
                              }
                              alt={req.receiver.fullName}
                              className="h-12 w-12 rounded-full object-cover border border-[#393e48]"
                            />
                            <div>
                              <h4 className="text-sm font-bold text-white">
                                {req.receiver.fullName}
                              </h4>
                              <div className="flex items-center gap-2 text-xs text-gray-400">
                                <span>@{req.receiver.username}</span>
                                {req.receiver.email && (
                                  <>
                                    <span>•</span>
                                    <span>{req.receiver.email}</span>
                                  </>
                                )}
                              </div>
                              <div className="mt-1 flex items-center gap-1 text-[11px] text-gray-500">
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
                              className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-950/20 px-4 py-2 text-xs font-bold text-rose-300 hover:bg-rose-950/50 transition-colors"
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
    </AppLayout>
  );
}
