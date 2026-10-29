import { useEffect, useMemo, useState } from 'react';
import { Lock, Search, ShieldCheck, Unlock, Users } from 'lucide-react';
import AppLayout from '../../layouts/AppLayout';
import Avatar from '../common/Avatar';
import type { Screen } from '../../types';
import { apiFetch } from '../../services/apiClient';

interface AdminUserListPageProps { onNavigate?: (screen: Screen) => void; onLogout?: () => void; }
interface ManagedUser {
  profile: { userId: number; username: string; role: 'USER' | 'ADMIN'; email?: string | null; fullName?: string | null; avatar?: string | null; };
  status: string;
  createdAt?: number | null;
}
interface UserPage { content: ManagedUser[]; totalElements: number; }

export default function AdminUserListPage({ onNavigate, onLogout }: AdminUserListPageProps) {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await apiFetch<UserPage>(`/api/admin/users?search=${encodeURIComponent(search)}&page=0&size=100`);
      setUsers(response.data?.content ?? []);
      setError('');
    } catch (loadError) {
      setUsers([]);
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải người dùng.');
    } finally { setLoading(false); }
  };

  useEffect(() => { void loadUsers(); }, [search]);

  const activeCount = useMemo(() => users.filter((user) => user.status === 'ACTIVE').length, [users]);

  const toggleStatus = async (user: ManagedUser) => {
    const id = user.profile.userId;
    try {
      await apiFetch(`/api/admin/users/${id}${user.status === 'ACTIVE' ? '' : '/unban'}`, {
        method: user.status === 'ACTIVE' ? 'DELETE' : 'PATCH',
      });
      await loadUsers();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Không thể cập nhật trạng thái người dùng.');
    }
  };

  return (
    <AppLayout title="Quản lý người dùng" subtitle="Danh sách người dùng từ máy chủ" onNavigate={onNavigate} onLogout={onLogout}>
      <section className="mx-auto max-w-6xl space-y-5 p-5 sm:p-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-2xl border border-brand-border bg-white p-5"><div><p className="text-xs text-brand-text-muted">Tổng người dùng</p><strong className="mt-1 block text-2xl">{users.length}</strong></div><Users className="h-6 w-6 text-brand-primary" /></div>
          <div className="flex items-center justify-between rounded-2xl border border-brand-border bg-white p-5"><div><p className="text-xs text-brand-text-muted">Đang hoạt động</p><strong className="mt-1 block text-2xl">{activeCount}</strong></div><ShieldCheck className="h-6 w-6 text-brand-primary" /></div>
        </div>
        <label className="relative block"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-text-muted" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm kiếm người dùng" className="w-full rounded-xl border border-brand-border bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-brand-primary" /></label>
        {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        <div className="overflow-x-auto rounded-2xl border border-brand-border bg-white">
          {loading ? <p className="p-12 text-center text-sm text-brand-text-muted">Đang tải…</p> : users.length === 0 ? <p className="p-12 text-center text-sm text-brand-text-muted">No data</p> : (
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-brand-border bg-brand-bg text-xs text-brand-text-muted"><tr><th className="px-5 py-3">Người dùng</th><th className="px-4 py-3">Vai trò</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3">Ngày tạo</th><th className="px-4 py-3 text-right">Thao tác</th></tr></thead>
              <tbody className="divide-y divide-brand-border">{users.map((user) => {
                const profile = user.profile;
                const name = profile.fullName || profile.username || 'No data';
                return <tr key={profile.userId}>
                  <td className="px-5 py-4"><div className="flex items-center gap-3"><Avatar src={profile.avatar || undefined} name={name} /><span><strong className="block">{name}</strong><small className="text-brand-text-muted">{profile.email || 'No data'}</small></span></div></td>
                  <td className="px-4 py-4">{profile.role || 'No data'}</td>
                  <td className="px-4 py-4">{user.status || 'No data'}</td>
                  <td className="px-4 py-4">{user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'No data'}</td>
                  <td className="px-4 py-4 text-right"><button type="button" onClick={() => void toggleStatus(user)} aria-label={user.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'} className="rounded-lg p-2 text-brand-text-muted hover:bg-brand-bg">{user.status === 'ACTIVE' ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}</button></td>
                </tr>;
              })}</tbody>
            </table>
          )}
        </div>
      </section>
    </AppLayout>
  );
}
