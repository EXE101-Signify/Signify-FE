import { ArrowLeft, LogOut, Settings, UserRound } from 'lucide-react';
import type { Screen } from '../../types';
import { getStoredUser } from '../../services/apiClient';

interface SettingsPageProps {
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
}

export default function SettingsPage({ onNavigate, onLogout }: SettingsPageProps) {
  const user = getStoredUser();
  const name = user ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username : '';

  return (
    <main className="min-h-screen bg-[#f4f6f5] font-sans text-[#263934]">
      <header className="flex min-h-[72px] items-center justify-between border-b border-[#dce4e1] bg-white px-5 sm:px-8">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => onNavigate('dashboard')} aria-label="Quay lại tin nhắn" className="flex h-10 w-10 items-center justify-center rounded-xl text-[#536660] hover:bg-[#f0f4f2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3f7c72]"><ArrowLeft className="h-5 w-5" /></button>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e9f2ef] text-[#3f7c72]"><Settings className="h-5 w-5" /></span>
          <h1 className="text-lg font-bold">Cài đặt</h1>
        </div>
        <button type="button" onClick={onLogout} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 text-sm font-semibold text-rose-700 hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"><LogOut className="h-4 w-4" />Đăng xuất</button>
      </header>
      <section className="mx-auto max-w-2xl px-5 py-10 sm:px-8">
        <div className="rounded-2xl border border-[#dce4e1] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-[#e6ece9] pb-5">
            <UserRound className="h-5 w-5 text-[#3f7c72]" />
            <h2 className="font-bold">Tài khoản</h2>
          </div>
          {user ? (
            <dl className="grid gap-4 pt-5 sm:grid-cols-2">
              <div><dt className="text-xs text-[#73817c]">Tên người dùng</dt><dd className="mt-1 font-semibold">{name || 'No data'}</dd></div>
              <div><dt className="text-xs text-[#73817c]">Email</dt><dd className="mt-1 font-semibold">{user.email || 'No data'}</dd></div>
              <div><dt className="text-xs text-[#73817c]">Username</dt><dd className="mt-1 font-semibold">{user.username || 'No data'}</dd></div>
              <div><dt className="text-xs text-[#73817c]">Vai trò</dt><dd className="mt-1 font-semibold">{user.role || 'No data'}</dd></div>
            </dl>
          ) : <p className="pt-5 text-sm text-[#73817c]">No data</p>}
        </div>
      </section>
    </main>
  );
}
