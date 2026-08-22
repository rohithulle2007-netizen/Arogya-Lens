import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, History, TrendingUp, User, Eye } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const navItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'History',
      path: '/history',
      icon: History,
    },
    {
      label: 'Scan',
      path: '/welcome',
      icon: Eye,
      isPrimaryAction: true,
    },
    {
      label: 'Trends',
      path: '/trends',
      icon: TrendingUp,
    },
    {
      label: 'Profile',
      path: '/profile',
      icon: User,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg safe-bottom">
      <div className="max-w-md mx-auto px-3 py-1.5 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;

          if (item.isPrimaryAction) {
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center -mt-5 focus:outline-none transition group`
                }
              >
                <div className="w-12 h-12 rounded-full bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center shadow-md shadow-teal-600/30 ring-4 ring-white transition active:scale-95">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold text-teal-700 mt-1">Scan</span>
              </NavLink>
            );
          }

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                  isActive
                    ? 'text-teal-700 font-bold scale-105'
                    : 'text-slate-500 hover:text-slate-800 font-medium'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px] text-teal-600' : 'stroke-[1.8px]'}`} />
                  <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
