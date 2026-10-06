import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  BookOpen,
  MessageSquare,
  PenTool,
  BarChart2,
  Settings,
  Sparkles
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const mainNav = [
    { to: '/dashboard', label: 'Dashboard', icon: Home },
    { to: '/courses', label: 'My Courses', icon: BookOpen },
    { to: '/tutor', label: 'AI Tutor', icon: MessageSquare, highlight: true },
    { to: '/practice', label: 'Practice', icon: PenTool },
    { to: '/progress', label: 'Progress', icon: BarChart2 },
  ];

  return (
    <aside className="w-60 border-r border-slate-800/80 bg-slate-950 flex flex-col justify-between shrink-0 h-[calc(100vh-4rem)] sticky top-16 select-none">
      {/* Primary Navigation */}
      <div className="p-3 space-y-1">
        <div className="px-3 py-2 text-[11px] font-medium tracking-wider text-slate-500 uppercase">
          Learning
        </div>
        {mainNav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-slate-900 text-white font-semibold border border-slate-800'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.highlight && (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Bottom Settings / Advanced Hub */}
      <div className="p-3 border-t border-slate-900 space-y-1">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
              isActive
                ? 'bg-slate-900 text-white font-semibold border border-slate-800'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`
          }
        >
          <Settings className="w-4 h-4 text-slate-500 group-hover:text-slate-300" />
          <span>Advanced & Settings</span>
        </NavLink>
      </div>
    </aside>
  );
};
