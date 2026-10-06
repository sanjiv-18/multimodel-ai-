import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { courseService, learnerService } from '../services/api';
import { Course, LearnerOverview } from '../types';
import {
  ArrowRight,
  Sparkles,
  Send,
  BookOpen,
  AlertCircle,
  CheckCircle2,
  Clock,
  Compass
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [overview, setOverview] = useState<LearnerOverview | null>(null);
  const [quickQuery, setQuickQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cList, oView] = await Promise.all([
          courseService.list(),
          learnerService.getOverview(),
        ]);
        setCourses(cList);
        setOverview(oView);
      } catch (err) {
        console.error('Failed to load dashboard', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAskTutor = (queryText?: string) => {
    const q = queryText || quickQuery;
    if (!q.trim()) return;
    navigate('/tutor', { state: { initialPrompt: q } });
  };

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center min-h-[50vh]">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const primaryCourse = courses[0];
  const topMisconception = overview?.active_misconceptions[0];
  const topRec = overview?.recommendations[0];

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">
      {/* 1. Hero Prompt: Ask LearnFlow */}
      <div className="space-y-4 text-center sm:text-left">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-white tracking-tight">
            What are you working on today, {user?.full_name?.split(' ')[0] || 'Alex'}?
          </h1>
          <p className="text-xs text-slate-400">
            Ask any question grounded in your course slides, textbooks, and lectures.
          </p>
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAskTutor();
          }}
          className="relative flex items-center"
        >
          <input
            type="text"
            value={quickQuery}
            onChange={(e) => setQuickQuery(e.target.value)}
            placeholder="Ask anything about your course..."
            className="w-full pl-4 pr-24 py-3.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 transition-all shadow-sm"
          />
          <button
            type="submit"
            disabled={!quickQuery.trim()}
            className="absolute right-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>Ask</span>
            <Send className="w-3 h-3" />
          </button>
        </form>

        {/* Quick Suggested Intent Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] text-slate-500 font-medium">Suggested:</span>
          <button
            onClick={() => handleAskTutor('Explain binary search simply with an example.')}
            className="text-xs px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            Explain binary search
          </button>
          <button
            onClick={() => handleAskTutor('Help me understand recursion base cases.')}
            className="text-xs px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            Why do I need a base case?
          </button>
          <button
            onClick={() => navigate('/practice')}
            className="text-xs px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            Quiz me on sorting algorithms
          </button>
        </div>
      </div>

      {/* 2. The 3 Focused Cards: Continue, Your Focus, Next Best Action */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
          Your Learning Plan
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Continue Learning */}
          <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-4 hover:border-slate-700/80 transition-all">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-medium text-slate-400">
                <span>Continue</span>
                <span className="text-indigo-400 font-mono font-semibold">72% Mastery</span>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  {primaryCourse?.title || 'Data Structures'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Trees & Binary Search Trees</p>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden mt-2">
                <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: '72%' }}></div>
              </div>
            </div>

            <button
              onClick={() => handleAskTutor('Review Binary Search Tree traversal order and properties.')}
              className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700/80 text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Continue learning</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 2: Your Focus / Misconception Gap */}
          <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-4 hover:border-slate-700/80 transition-all">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-medium text-slate-400">
                <span>Your Focus</span>
                <span className="text-rose-400 font-medium">Gap Identified</span>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Recursion Base Cases</h3>
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                  {topMisconception?.description || "You're still missing terminating base cases in recursion."}
                </p>
              </div>
            </div>

            <button
              onClick={() => handleAskTutor('Why is a base case strictly required in recursion?')}
              className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700/80 text-rose-200 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Review concept</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 3: Next Best Action */}
          <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-4 hover:border-slate-700/80 transition-all">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-medium text-slate-400">
                <span>Next Best Action</span>
                <span className="text-emerald-400 font-medium">Recommended</span>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  {topRec?.title || 'Practice 4 Medium Questions'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                  {topRec?.reason || 'Recommended to strengthen your weakest prerequisite topic.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate('/practice')}
              className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              <span>Start practice</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Recent Activity (Secondary & Calm) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Recent Activity
          </h2>
          <button
            onClick={() => navigate('/progress')}
            className="text-xs text-slate-400 hover:text-indigo-400 transition-colors"
          >
            View all history
          </button>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-3 text-xs">
          <div className="flex items-center justify-between py-1 border-b border-slate-800/50">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-slate-300">Completed 4 questions in <strong>Searching Algorithms</strong></span>
            </div>
            <span className="text-slate-500 font-mono text-[11px]">Earlier today</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-800/50">
            <div className="flex items-center gap-2.5">
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-slate-300">Tutor explanation on <strong>Binary Search Preconditions</strong></span>
            </div>
            <span className="text-slate-500 font-mono text-[11px]">Yesterday</span>
          </div>

          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="text-slate-300">Reviewed <strong>Algorithms Textbook — Page 42</strong></span>
            </div>
            <span className="text-slate-500 font-mono text-[11px]">2 days ago</span>
          </div>
        </div>
      </div>
    </div>
  );
};
