import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap, Sparkles, BookOpen, Brain, CheckCircle,
  ArrowRight, Shield, Layers, FileText, Video, Presentation
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [email, setEmail] = useState<string>('demo@learnflow.ai');
  const [password, setPassword] = useState<string>('demo1234');
  const [name, setName] = useState<string>('Alex Chen');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const { login, register, demoLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    setLoading(true);
    try {
      await demoLogin();
      navigate('/dashboard');
    } catch (err: any) {
      setError('Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-6 pt-16 pb-20 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-800/60 text-xs font-mono text-indigo-300">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Multimodal AI Hackathon 2026 • Track D
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Learn from your material. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
              Understand your gaps.
            </span><br />
            Learn what comes next.
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl">
            LearnFlow AI turns textbooks, lecture slides, and video recordings into a source-grounded,
            multi-agent personalized tutor with adaptive quizzing, misconception diagnosis, and dynamic mastery modeling.
          </p>

          <div className="grid grid-cols-3 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <FileText className="w-4 h-4 text-rose-400" />
              <div className="font-semibold text-slate-200">PDFs & Books</div>
              <div className="text-[10px] text-slate-400">Page-level citations</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <Presentation className="w-4 h-4 text-amber-400" />
              <div className="font-semibold text-slate-200">Slide Decks</div>
              <div className="text-[10px] text-slate-400">Slide # tracking</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <Video className="w-4 h-4 text-sky-400" />
              <div className="font-semibold text-slate-200">Lecture Videos</div>
              <div className="text-[10px] text-slate-400">Timestamp jumping</div>
            </div>
          </div>
        </div>

        {/* Auth / Login Card */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-md">
          <div className="text-center space-y-1 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto text-white shadow-lg shadow-indigo-600/30">
              <GraduationCap className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-white pt-2">
              {isLogin ? 'Sign In to LearnFlow' : 'Create Student Account'}
            </h2>
            <p className="text-xs text-slate-400">
              Access your personalized course knowledge workspace
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Chen"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-sm transition-all shadow-md shadow-indigo-600/30 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="relative my-5 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800"></div>
            </div>
            <span className="relative px-3 bg-slate-900 text-slate-400 text-xs uppercase font-mono">
              Or Try Immediately
            </span>
          </div>

          <button
            onClick={handleQuickDemo}
            disabled={loading}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 rounded-xl font-semibold text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            Explore Pre-Seeded DSA Demo Course
          </button>

          <div className="text-center mt-4">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs text-slate-400 hover:text-indigo-300 transition-colors"
            >
              {isLogin ? "Don't have an account? Register here" : 'Already registered? Sign in'}
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-400">
        LearnFlow AI • Track D: Personalized Tutoring & Adaptive Learning • 8 Logical AI Agents + LangGraph
      </footer>
    </div>
  );
};
