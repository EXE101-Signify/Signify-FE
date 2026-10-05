import type { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  BookOpen,
  Languages,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  User,
  Users,
} from 'lucide-react';

import type { Screen } from '../types';
import { BrandLogo, PageHeader } from '../components/common';

import { getStoredUser } from '../services/apiClient';

type AppScreen = Extract<Screen, 'dashboard' | 'languages' | 'profile' | 'admin-users'>;

interface AppLayoutProps {
  activeScreen?: AppScreen;
  title: ReactNode;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  onNavigate?: (screen: Screen) => void;
  onLogout?: () => void;
  onContactsClick?: () => void;
}

const getNavItemClass = (active: boolean) =>
  `flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
    active
      ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/15'
      : 'text-brand-text-muted hover:bg-brand-primary-light/40 hover:text-brand-primary'
  }`;

export default function AppLayout({
  activeScreen,
  title,
  subtitle,
  actions,
  children,
  onNavigate,
  onLogout,
  onContactsClick,
}: AppLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const currentUser = getStoredUser();
  const displayName = currentUser
    ? ([currentUser.firstName, currentUser.lastName].filter(Boolean).join(' ') || currentUser.username)
    : 'Thanh Liêm';
  const userRoleLabel = currentUser?.role === 'ADMIN' ? 'Pro Admin' : 'Thành viên Pro';
  const avatarSrc = currentUser?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150';

  const isCurrentScreen = (screen: AppScreen) => {
    if (activeScreen) return activeScreen === screen;
    if (screen === 'dashboard') return location.pathname === '/dashboard';
    if (screen === 'languages') return location.pathname === '/languages';
    if (screen === 'profile') return location.pathname === '/profile';
    if (screen === 'admin-users') return location.pathname === '/admin/users';
    return false;
  };

  const handleNav = (screen: Screen, path: string) => {
    if (onNavigate) {
      onNavigate(screen);
    }
    navigate(path);
  };

  const handleLogoutAction = () => {
    if (onLogout) {
      onLogout();
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg font-sans text-brand-text">
      <aside className="fixed inset-y-0 left-0 z-40 flex w-[264px] flex-col justify-between border-r border-brand-border bg-white p-5 shadow-sm">
        <div className="space-y-6">
          <BrandLogo />

          <nav className="space-y-1.5" aria-label="Điều hướng chính">
            <button
              type="button"
              className={getNavItemClass(isCurrentScreen('dashboard'))}
              onClick={() => handleNav('dashboard', '/dashboard')}
            >
              <LayoutDashboard
                className="h-4 w-4"
                aria-hidden="true"
              />
              Tổng quan
            </button>

            <button
              type="button"
              className={getNavItemClass(isCurrentScreen('languages'))}
              onClick={() => handleNav('languages', '/languages')}
            >
              <Languages
                className="h-4 w-4"
                aria-hidden="true"
              />
              Gói ngôn ngữ
            </button>

            <button
              type="button"
              className={getNavItemClass(isCurrentScreen('profile'))}
              onClick={() => handleNav('profile', '/profile')}
            >
              <User
                className="h-4 w-4"
                aria-hidden="true"
              />
              Hồ sơ cá nhân
            </button>

            <button
              type="button"
              className={getNavItemClass(isCurrentScreen('admin-users'))}
              onClick={() => handleNav('admin-users', '/admin/users')}
            >
              <ShieldCheck
                className="h-4 w-4"
                aria-hidden="true"
              />
              Quản lý Admin
            </button>

            <button
              type="button"
              className={getNavItemClass(false)}
              onClick={onContactsClick || (() => handleNav('dashboard', '/dashboard'))}
            >
              <Users
                className="h-4 w-4"
                aria-hidden="true"
              />
              Danh bạ liên kết
            </button>

            <button
              type="button"
              className={getNavItemClass(false)}
              onClick={() => handleNav('landing', '/')}
            >
              <BookOpen
                className="h-4 w-4"
                aria-hidden="true"
              />
              Bảng giá & Gói cước
            </button>
          </nav>
        </div>

        <div className="space-y-3 rounded-2xl border border-brand-border bg-brand-bg p-4">
          <button
            type="button"
            onClick={() => handleNav('profile', '/profile')}
            className="flex items-center gap-3 w-full text-left cursor-pointer group"
          >
            <img
              src={avatarSrc}
              alt={`Ảnh đại diện ${displayName}`}
              className="h-9 w-9 rounded-full border border-brand-border-high object-cover group-hover:scale-105 transition-transform"
              referrerPolicy="no-referrer"
            />

            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-bold text-brand-text group-hover:text-brand-primary transition-colors">
                {displayName}
              </div>

              <span className="mt-0.5 inline-flex rounded bg-brand-secondary px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-widest text-white">
                {userRoleLabel}
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={handleLogoutAction}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-100 py-2.5 text-xs font-bold uppercase tracking-wider text-rose-700 transition-all hover:bg-rose-600 hover:text-white cursor-pointer"
          >
            <LogOut
              className="h-3.5 w-3.5"
              aria-hidden="true"
            />
            Đăng xuất
          </button>
        </div>
      </aside>

      <div className="min-w-0 pl-[264px]">
        <PageHeader
          title={title}
          subtitle={subtitle}
          actions={actions}
        />

        <main>{children}</main>
      </div>
    </div>
  );
}