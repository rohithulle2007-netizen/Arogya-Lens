import React from 'react';
import { NavLink } from 'react-router-dom';
import { Header } from '../common/Header';
import { BottomNav } from './BottomNav';
import { LayoutDashboard, History, TrendingUp, User, PlusCircle } from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  hideNav?: boolean;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  title,
  subtitle,
  showBack = false,
  onBack,
  hideNav = false,
}) => {
  const desktopNavItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'History', path: '/history', icon: History },
    { label: 'Hb Trends', path: '/trends', icon: TrendingUp },
    { label: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-900">
      {/* Top Header */}
      <div>
        <Header showBack={showBack} onBack={onBack} title={title} subtitle={subtitle} />

        {/* Desktop / Tablet Sub-Navbar */}
        {!hideNav && (
          <div className="hidden md:block bg-white border-b border-slate-200 sticky top-[57px] z-30 shadow-xs">
            <div className="max-w-2xl mx-auto px-4 flex items-center justify-between">
              <nav className="flex items-center gap-1 py-1.5">
                {desktopNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        `flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                          isActive
                            ? 'bg-teal-50 text-teal-700 border border-teal-200/80 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>

              <NavLink
                to="/welcome"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition active:scale-95"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>New Screening</span>
              </NavLink>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-5 pb-24 md:pb-8">
        {children}
      </main>

      {/* Bottom Navigation for Mobile */}
      {!hideNav && <BottomNav />}
    </div>
  );
};
