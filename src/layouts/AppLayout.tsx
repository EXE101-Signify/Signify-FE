import type { ReactNode } from 'react';
import {
  BookOpen,
  Languages,
  LayoutDashboard,
  LogOut,
  Users,
} from 'lucide-react';

import type { Screen } from '../types';
import { BrandLogo, PageHeader } from '../components/common';

type AppScreen = Extract<Screen, 'dashboard' | 'languages'>;

interface AppLayoutProps {
  activeScreen: AppScreen;
  title: ReactNode;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
  onContactsClick?: () => void;
}

const getNavItemClass = (active: boolean) =>
  `flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-xs font-bold uppercase tracking-wider transition-all ${
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
  return (
    <div className="min-h-screen bg-brand-bg font-sans text-brand-text">
      <aside className="fixed inset-y-0 left-0 z-40 flex w-66 flex-col justify-between border-r border-brand-border bg-white p-5 shadow-sm">
        <div className="space-y-8">
          <BrandLogo />

          <nav className="space-y-1.5" aria-label="Điều hướng chính">
            <button
              type="button"
              className={getNavItemClass(
                activeScreen === 'dashboard',
              )}
              onClick={() => onNavigate('dashboard')}
            >
              <LayoutDashboard
                className="h-4 w-4"
                aria-hidden="true"
              />
              Tổng quan
            </button>

            <button
              type="button"
              className={getNavItemClass(
                activeScreen === 'languages',
              )}
              onClick={() => onNavigate('languages')}
            >
              <Languages
                className="h-4 w-4"
                aria-hidden="true"
              />
              Gói ngôn ngữ
            </button>

            <button
              type="button"
              className={getNavItemClass(false)}
              onClick={onContactsClick}
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
              onClick={() => onNavigate('landing')}
            >
              <BookOpen
                className="h-4 w-4"
                aria-hidden="true"
              />
              Bảng giá và gói cước
            </button>
          </nav>
        </div>

        <div className="space-y-3 rounded-2xl border border-brand-border bg-brand-bg p-4">
          <div className="flex items-center gap-3">
            <img
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150"
              alt="Ảnh đại diện Thanh Liêm"
              className="h-9 w-9 rounded-full border border-brand-border-high object-cover"
              referrerPolicy="no-referrer"
            />

            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-bold text-brand-text">
                Thanh Liêm
              </div>

              <span className="mt-1 inline-flex rounded bg-brand-secondary px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-widest text-white">
                Pro
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-100 py-2.5 text-xs font-bold uppercase tracking-wider text-rose-700 transition-all hover:bg-rose-600 hover:text-white"
          >
            <LogOut
              className="h-3.5 w-3.5"
              aria-hidden="true"
            />
            Đăng xuất
          </button>
        </div>
      </aside>

      <div className="min-w-0 pl-66">
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