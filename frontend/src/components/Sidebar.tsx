import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  BookOpen,
  MessageSquare,
  PenTool,
  BarChart2,
  Settings
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const mainNav = [
    { to: '/dashboard', label: 'Home', icon: Home },
    { to: '/courses', label: 'My Courses', icon: BookOpen },
    { to: '/tutor', label: 'AI Tutor', icon: MessageSquare, highlight: true },
    { to: '/practice', label: 'Practice', icon: PenTool },
    { to: '/progress', label: 'Progress', icon: BarChart2 },
  ];

  return (
    <aside className="w-56 border-r border-slate-200 bg-white flex flex-col justify-between shrink-0 h-[calc(100vh-4rem)] sticky top-16 select-none">
      {/* Primary Navigation */}
      <div className="p-3 space-y-1">
        <div className="px-3 py-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Learning Menu
        </div>
        {mainNav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.highlight && (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Bottom Settings Link */}
      <div className="p-3 border-t border-slate-100 space-y-1">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
              isActive
                ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`
          }
        >
          <Settings className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
          <span>Ingestion & Settings</span>
        </NavLink>
      </div>
    </aside>
  );
};
