import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { courseService, learnerService } from '../services/api';
import { Course, LearnerOverview } from '../types';
import {
  ArrowRight,
  Send,
  BookOpen,
  CheckCircle2,
  Clock,
  Sparkles,
  Plus,
  AlertCircle,
  FolderPlus
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
        const cList = await courseService.list();
        setCourses(cList);
        if (cList.length > 0) {
          const oView = await learnerService.getOverview(cList[0].id);
          setOverview(oView);
        } else {
          setOverview(null);
        }
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
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const hasCourses = courses.length > 0;
  const primaryCourse = courses[0];
  const topMisconception = overview?.active_misconceptions?.[0];
  const topRec = overview?.recommendations?.[0];
  const firstName = user?.full_name ? user.full_name.split(' ')[0] : 'there';

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-10 animate-fadeIn">
      {/* 1. Hero Prompt: Ask LearnFlow */}
      <div className="space-y-4 text-center sm:text-left">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            What are you working on today, {firstName}?
          </h1>
          <p className="text-xs text-slate-500">
            Ask any doubt grounded strictly in your uploaded slides, textbooks, and notes.
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
            placeholder={
              hasCourses
                ? `Ask anything about ${primaryCourse.title}...`
                : 'Upload notes or ask a doubt to get started...'
            }
            className="w-full pl-4 pr-24 py-3.5 rounded-2xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all shadow-xs"
          />
          <button
            type="submit"
            disabled={!quickQuery.trim()}
            className="absolute right-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-30 text-white text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <span>Ask</span>
            <Send className="w-3 h-3" />
          </button>
        </form>

        {/* Suggested Intent Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] text-slate-400 font-medium">Suggested:</span>
          <button
            onClick={() => handleAskTutor('Explain the core concept in simple terms.')}
            className="text-xs px-3 py-1 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
          >
            Explain core concept
          </button>
          <button
            onClick={() => handleAskTutor('Can you show a real example with step-by-step walkthrough?')}
            className="text-xs px-3 py-1 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
          >
            Show step-by-step example
          </button>
          <button
            onClick={() => navigate('/practice')}
            className="text-xs px-3 py-1 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
          >
            Practice adaptive quiz
          </button>
        </div>
      </div>

      {/* If User Has NO Courses: Show Welcoming Onboarding */}
      {!hasCourses && (
        <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm text-center space-y-5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
            <FolderPlus className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-bold text-slate-900">
              Welcome to LearnFlow AI
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              You haven't created any courses yet. Create a course and upload your textbook PDFs, lecture slides, or class notes to unlock grounded tutoring and adaptive quizzing.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => navigate('/courses')}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Create Course
            </button>
            <button
              onClick={() => navigate('/tutor')}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-slate-500" /> Go to AI Tutor
            </button>
          </div>
        </div>
      )}

      {/* If User Has Courses: Show the 3 Focused Learning Cards */}
      {hasCourses && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
            Your Learning Plan
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: Continue Learning */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                  <span>Current Course</span>
                  <span className="text-indigo-600 font-mono">
                    {Math.round((primaryCourse.mastery_avg || 0) * 100)}% Mastery
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 truncate">
                    {primaryCourse.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                    {primaryCourse.description || 'Course learning materials and topics'}
                  </p>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mt-2">
                  <div
                    className="bg-indigo-600 h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.max(4, Math.round((primaryCourse.mastery_avg || 0) * 100))}%` }}
                  ></div>
                </div>
              </div>

              <button
                onClick={() => navigate('/tutor')}
                className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Continue learning</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Card 2: Your Focus / Misconception Gap */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                  <span>Your Focus</span>
                  {topMisconception ? (
                    <span className="text-rose-600 font-semibold">Gap Detected</span>
                  ) : (
                    <span className="text-emerald-600 font-semibold">On Track</span>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {topMisconception ? topMisconception.misconception_name : 'No Active Gaps'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                    {topMisconception
                      ? topMisconception.description
                      : 'You have not exhibited active misconceptions in recent assessments.'}
                  </p>
                </div>
              </div>

              {topMisconception ? (
                <button
                  onClick={() =>
                    navigate('/tutor', {
                      state: { initialPrompt: `Review the concept: ${topMisconception.misconception_name}` },
                    })
                  }
                  className="w-full py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Review concept</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={() => navigate('/practice')}
                  className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Test understanding</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Card 3: Next Best Action */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                  <span>Next Best Action</span>
                  <span className="text-indigo-600 font-semibold">Recommended</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {topRec?.title || 'Practice Adaptive Quiz'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                    {topRec?.reason || 'Recommended based on your current course progress.'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => navigate('/practice')}
                className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>Start practice</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Recent Activity Section */}
      {hasCourses && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Recent Learning Activity
            </h2>
            <button
              onClick={() => navigate('/progress')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors cursor-pointer"
            >
              View detailed progress
            </button>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3 text-xs">
            {overview && overview.recent_activity_count > 0 ? (
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-slate-700">
                    Completed <strong>{overview.recent_activity_count}</strong> assessment questions across course topics
                  </span>
                </div>
                <span className="text-slate-400 font-mono text-[11px]">Logged</span>
              </div>
            ) : (
              <div className="py-2 text-center text-slate-500">
                No assessment attempts logged yet. Complete your first practice quiz to track performance.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
