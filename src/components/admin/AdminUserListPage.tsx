import { useState } from 'react';
import {
  Users,
  UserCheck,
  ShieldAlert,
  Award,
  Search,
  Filter,
  UserPlus,
  Edit3,
  Lock,
  Unlock,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Mail,
  User as UserIcon,
} from 'lucide-react';
import AppLayout from '../../layouts/AppLayout';
import type { Screen, UserProfile } from '../../types';

interface AdminUserListPageProps {
  onNavigate?: (screen: Screen) => void;
  onLogout?: () => void;
}

const MOCK_ADMIN_USERS: UserProfile[] = [
  {
    id: 'usr_01',
    name: 'Thanh Liêm',
    email: 'thanhliem@signbridge.vn',
    phone: '0988 123 456',
    role: 'admin',
    plan: 'pro',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150',
    bio: 'Quản trị viên hệ thống SignBridge',
    status: 'active',
    joinedDate: '15/01/2025',
    lastActive: 'Vừa xong',
  },
  {
    id: 'usr_02',
    name: 'Phạm Anh Thư',
    email: 'thu.pa@fpt.edu.vn',
    phone: '0912 345 678',
    role: 'admin',
    plan: 'pro',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
    bio: 'Thành viên nhóm phát triển SignBridge',
    status: 'active',
    joinedDate: '10/02/2025',
    lastActive: '5 phút trước',
  },
  {
    id: 'usr_03',
    name: 'Nguyễn Văn Minh',
    email: 'minh.nv@example.com',
    phone: '0977 888 999',
    role: 'moderator',
    plan: 'pro',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    bio: 'Kiểm duyệt viên dữ liệu bộ ký hiệu',
    status: 'active',
    joinedDate: '20/02/2025',
    lastActive: '1 giờ trước',
  },
  {
    id: 'usr_04',
    name: 'Lê Thi Hoài',
    email: 'hoai.lt@gmail.com',
    phone: '0933 111 222',
    role: 'user',
    plan: 'free',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    bio: 'Học viên ngôn ngữ ký hiệu',
    status: 'active',
    joinedDate: '01/03/2025',
    lastActive: 'Hôm qua',
  },
  {
    id: 'usr_05',
    name: 'Trần Quốc Bảo',
    email: 'bao.tq@yahoo.com',
    phone: '0905 666 777',
    role: 'user',
    plan: 'free',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
    bio: 'Người dùng thử nghiệm phiên dịch',
    status: 'suspended',
    joinedDate: '12/03/2025',
    lastActive: '3 ngày trước',
  },
  {
    id: 'usr_06',
    name: 'Hoàng Kim Dung',
    email: 'dung.hk@signbridge.vn',
    phone: '0989 333 444',
    role: 'moderator',
    plan: 'enterprise',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150',
    bio: 'Phiên dịch viên chuyên nghiệp VSL',
    status: 'active',
    joinedDate: '18/03/2025',
    lastActive: '2 giờ trước',
  },
];

export default function AdminUserListPage({ onNavigate, onLogout }: AdminUserListPageProps) {
  const [users, setUsers] = useState<UserProfile[]>(MOCK_ADMIN_USERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals state
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);

  // New user form state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'user' | 'moderator'>('user');
  const [newPlan, setNewPlan] = useState<'free' | 'pro' | 'enterprise'>('free');

  // Toast / Feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Filter users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone.includes(searchQuery);

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Toggle user status
  const handleToggleStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const nextStatus = u.status === 'active' ? 'suspended' : 'active';
          showToast(
            nextStatus === 'suspended'
              ? `Đã khóa tài khoản ${u.name}`
              : `Đã mở khóa tài khoản ${u.name}`
          );
          return { ...u, status: nextStatus };
        }
        return u;
      })
    );
  };

  // Add new user submit
  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    const newUser: UserProfile = {
      id: `usr_${Date.now()}`,
      name: newName.trim(),
      email: newEmail.trim(),
      phone: '0900 000 000',
      role: newRole,
      plan: newPlan,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
      bio: 'Người dùng mới tạo',
      status: 'active',
      joinedDate: 'Hôm nay',
      lastActive: 'Mới tạo',
    };

    setUsers([newUser, ...users]);
    setIsAddUserOpen(false);
    setNewName('');
    setNewEmail('');
    showToast(`Đã thêm thành công tài khoản mới cho ${newUser.name}!`);
  };

  // Save edit role / plan submit
  const handleEditUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setUsers((prev) =>
      prev.map((u) => (u.id === editingUser.id ? editingUser : u))
    );

    showToast(`Đã cập nhật thông tin vai trò cho ${editingUser.name}!`);
    setEditingUser(null);
  };

  // Delete user
  const handleDeleteConfirm = () => {
    if (!deletingUser) return;

    setUsers((prev) => prev.filter((u) => u.id !== deletingUser.id));
    showToast(`Đã xóa thành công người dùng ${deletingUser.name}.`);
    setDeletingUser(null);
  };

  const totalUsers = users.length;
  const activeCount = users.filter((u) => u.status === 'active').length;
  const proCount = users.filter((u) => u.plan === 'pro' || u.plan === 'enterprise').length;
  const suspendedCount = users.filter((u) => u.status === 'suspended').length;

  return (
    <AppLayout
      title="Quản lý người dùng"
      subtitle="Danh sách & Phân quyền thành viên hệ thống SignBridge (Task FE-THU-10)"
      onNavigate={onNavigate}
      onLogout={onLogout}
    >
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-emerald-700 shadow-sm animate-fade-in">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Top Summary Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-brand-border bg-white p-5 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-brand-text-muted">
                Tổng người dùng
              </div>
              <div className="text-2xl font-black text-brand-text mt-1">{totalUsers}</div>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-primary-light text-brand-primary">
              <Users className="h-6 w-6" />
            </div>
          </div>

          <div className="rounded-2xl border border-brand-border bg-white p-5 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-brand-text-muted">
                Đang hoạt động
              </div>
              <div className="text-2xl font-black text-emerald-600 mt-1">{activeCount}</div>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <UserCheck className="h-6 w-6" />
            </div>
          </div>

          <div className="rounded-2xl border border-brand-border bg-white p-5 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-brand-text-muted">
                Thành viên Pro
              </div>
              <div className="text-2xl font-black text-brand-primary mt-1">{proCount}</div>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-brand-primary">
              <Award className="h-6 w-6" />
            </div>
          </div>

          <div className="rounded-2xl border border-brand-border bg-white p-5 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-brand-text-muted">
                Tài khoản bị khóa
              </div>
              <div className="text-2xl font-black text-rose-600 mt-1">{suspendedCount}</div>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <ShieldAlert className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Filter & Action Controls Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 rounded-2xl border border-brand-border bg-white p-4 shadow-sm">
          <div className="flex flex-1 flex-col sm:flex-row items-center gap-3 w-full">
            {/* Search Box */}
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-text-muted" />
              <input
                type="text"
                placeholder="Tìm tên, email, sđt..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-brand-border bg-brand-bg py-2.5 pl-10 pr-4 text-xs font-semibold text-brand-text outline-none focus:bg-white focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            {/* Role Filter */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="h-4 w-4 text-brand-text-muted hidden sm:block" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full sm:w-auto rounded-xl border border-brand-border bg-brand-bg px-3 py-2.5 text-xs font-semibold text-brand-text outline-none focus:ring-2 focus:ring-brand-primary cursor-pointer"
              >
                <option value="all">Tất cả vai trò</option>
                <option value="admin">Quản trị viên (Admin)</option>
                <option value="moderator">Kiểm duyệt (Moderator)</option>
                <option value="user">Người dùng (User)</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto rounded-xl border border-brand-border bg-brand-bg px-3 py-2.5 text-xs font-semibold text-brand-text outline-none focus:ring-2 focus:ring-brand-primary cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang hoạt động</option>
                <option value="suspended">Tạm khóa</option>
              </select>
            </div>
          </div>

          {/* Add User Button */}
          <button
            type="button"
            onClick={() => setIsAddUserOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-2.5 text-xs font-bold uppercase text-white shadow-md hover:bg-brand-primary-hover cursor-pointer w-full md:w-auto"
          >
            <UserPlus className="h-4 w-4" />
            Thêm người dùng mới
          </button>
        </div>

        {/* User Data Table */}
        <div className="overflow-hidden rounded-2xl border border-brand-border bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-border bg-gray-50/80 text-[10px] font-extrabold uppercase tracking-wider text-brand-text-muted">
                  <th className="py-4 px-6">Thành viên</th>
                  <th className="py-4 px-4">Vai trò</th>
                  <th className="py-4 px-4">Gói cước</th>
                  <th className="py-4 px-4">Trạng thái</th>
                  <th className="py-4 px-4">Ngày tham gia</th>
                  <th className="py-4 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border text-xs">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-brand-text-muted font-semibold">
                      Không tìm thấy người dùng nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50/60 transition-colors">
                      {/* User Info */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={u.avatar}
                            alt={u.name}
                            className="h-10 w-10 rounded-full border border-gray-200 object-cover shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <div className="font-bold text-brand-text flex items-center gap-1.5">
                              {u.name}
                              {u.role === 'admin' && (
                                <ShieldCheck className="h-3.5 w-3.5 text-brand-primary shrink-0" />
                              )}
                            </div>
                            <div className="text-[11px] text-brand-text-muted">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${
                            u.role === 'admin'
                              ? 'bg-purple-100 text-purple-700'
                              : u.role === 'moderator'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>

                      {/* Plan Badge */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                            u.plan === 'pro' || u.plan === 'enterprise'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {u.plan}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                            u.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              u.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          {u.status === 'active' ? 'Hoạt động' : 'Tạm khóa'}
                        </span>
                      </td>

                      {/* Joined Date */}
                      <td className="py-4 px-4 text-brand-text-muted font-medium">
                        {u.joinedDate}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Edit Role Button */}
                          <button
                            type="button"
                            title="Sửa phân quyền"
                            onClick={() => setEditingUser(u)}
                            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-brand-primary transition-colors cursor-pointer"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>

                          {/* Lock / Unlock Toggle Button */}
                          <button
                            type="button"
                            title={u.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                            onClick={() => handleToggleStatus(u.id)}
                            className={`rounded-lg p-2 transition-colors cursor-pointer ${
                              u.status === 'active'
                                ? 'text-gray-500 hover:bg-rose-50 hover:text-rose-600'
                                : 'text-rose-600 hover:bg-emerald-50 hover:text-emerald-600'
                            }`}
                          >
                            {u.status === 'active' ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            title="Xóa người dùng"
                            onClick={() => setDeletingUser(u)}
                            className="rounded-lg p-2 text-gray-500 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer & Pagination */}
          <div className="flex items-center justify-between border-t border-brand-border px-6 py-4 bg-gray-50/50 text-xs text-brand-text-muted">
            <div>
              Hiển thị <strong>1 - {filteredUsers.length}</strong> trên tổng <strong>{totalUsers}</strong> người dùng
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled
                className="rounded-lg border border-brand-border bg-white px-3 py-1.5 text-xs font-bold text-gray-400 disabled:opacity-50 cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4 inline" /> Trước
              </button>
              <button
                type="button"
                className="rounded-lg border border-brand-border bg-white px-3 py-1.5 text-xs font-bold text-brand-text hover:bg-gray-100 cursor-pointer"
              >
                Sau <ChevronRight className="h-4 w-4 inline" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: ADD NEW USER */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-brand-primary" /> Thêm người dùng mới
              </h3>
              <button
                type="button"
                onClick={() => setIsAddUserOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddUserSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Họ và tên</label>
                <input
                  type="text"
                  required
                  placeholder="Nguyễn Văn A"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 font-semibold outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Địa chỉ Email</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 font-semibold outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Vai trò</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2.5 font-semibold outline-none focus:border-brand-primary cursor-pointer"
                  >
                    <option value="user">User</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Gói dịch vụ</label>
                  <select
                    value={newPlan}
                    onChange={(e) => setNewPlan(e.target.value as any)}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2.5 font-semibold outline-none focus:border-brand-primary cursor-pointer"
                  >
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-brand-primary px-5 py-2.5 font-bold text-white hover:bg-brand-primary-hover shadow-md cursor-pointer"
                >
                  Tạo tài khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT ROLE */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-extrabold text-gray-900">
                Sửa quyền hạn: {editingUser.name}
              </h3>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleEditUserSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Vai trò thành viên</label>
                <select
                  value={editingUser.role}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, role: e.target.value as any })
                  }
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 font-semibold outline-none focus:border-brand-primary cursor-pointer"
                >
                  <option value="user">User (Người dùng thường)</option>
                  <option value="moderator">Moderator (Kiểm duyệt viên)</option>
                  <option value="admin">Admin (Quản trị viên toàn quyền)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Gói cước</label>
                <select
                  value={editingUser.plan}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, plan: e.target.value as any })
                  }
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 font-semibold outline-none focus:border-brand-primary cursor-pointer"
                >
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-brand-primary px-5 py-2.5 font-bold text-white hover:bg-brand-primary-hover cursor-pointer"
                >
                  Lưu phân quyền
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DELETE CONFIRMATION */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              <Trash2 className="h-6 w-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-gray-900">Xác nhận xóa tài khoản?</h3>
              <p className="mt-1 text-xs text-gray-500">
                Bạn có chắc chắn muốn xóa người dùng <strong>{deletingUser.name}</strong> ({deletingUser.email}) khỏi hệ thống không? Hành động này không thể hoàn tác.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="w-1/2 rounded-xl border border-gray-200 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="w-1/2 rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white hover:bg-rose-700 cursor-pointer shadow-md"
              >
                Xóa ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
