import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, LogOut, User, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { user, logout, demoLogin } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Brand Logo */}
      <div 
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-3 cursor-pointer group"
      >
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm transition-transform group-hover:scale-105">
          LF
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm tracking-tight text-white">
            LearnFlow
          </span>
          <span className="text-[11px] text-slate-500 font-normal">
            Personal Study Companion
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {user ? (
          <div className="flex items-center gap-3">
            <button
              title="Notifications"
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors"
            >
              <Bell className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
              <div className="w-5 h-5 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-[10px]">
                {user.full_name[0]?.toUpperCase() || 'U'}
              </div>
              <span className="font-medium text-slate-200">{user.full_name}</span>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={demoLogin}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" /> Demo Login
          </button>
        )}
      </div>
    </header>
  );
};
