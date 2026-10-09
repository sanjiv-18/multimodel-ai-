import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="h-16 border-b border-slate-200 bg-white/95 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Brand Logo */}
      <div 
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-3 cursor-pointer group select-none"
      >
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm transition-transform group-hover:scale-105">
          LF
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm tracking-tight text-slate-900">
            LearnFlow
          </span>
          <span className="hidden sm:inline-block text-xs text-slate-400 font-normal">
            Personal Study Companion
          </span>
        </div>
      </div>

      {/* Right User Controls */}
      <div className="flex items-center gap-3">
        {user && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs">
              <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px]">
                {user.full_name ? user.full_name[0].toUpperCase() : 'U'}
              </div>
              <span className="font-semibold text-slate-800">{user.full_name}</span>
            </div>

            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              title="Sign Out"
              className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
