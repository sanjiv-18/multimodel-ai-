import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { learnerService, courseService } from '../services/api';
import { LearnerOverview, Course } from '../types';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import {
  BarChart2,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  ArrowRight
} from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [overview, setOverview] = useState<LearnerOverview | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'topics' | 'gaps'>('overview');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadProgress = async () => {
      try {
        const cList = await courseService.list();
        setCourses(cList);
        if (cList.length > 0) {
          const oView = await learnerService.getOverview(cList[0].id);
          setOverview(oView);
        }
      } catch (err) {
        console.error('Failed to load progress', err);
      } finally {
        setLoading(false);
      }
    };
    loadProgress();
  }, []);

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center min-h-[50vh]">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const chartData = overview?.topics_mastery.map((m) => ({
    name: m.topic.length > 15 ? m.topic.substring(0, 13) + '...' : m.topic,
    fullName: m.topic,
    mastery: Math.round(m.mastery_score * 100),
  })) || [];

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight">Your Progress</h1>
          <p className="text-xs text-slate-400">
            Track your understanding across all course topics and concepts.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-900 border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeTab === 'overview' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('topics')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeTab === 'topics' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Topics ({overview?.topics_mastery.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('gaps')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeTab === 'gaps' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Identified Gaps ({overview?.active_misconceptions.length || 0})
          </button>
        </div>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top 3 Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Overall Course Mastery
              </span>
              <div className="text-2xl font-bold font-mono text-indigo-400">
                {overview ? Math.round(overview.overall_mastery * 100) : 0}%
              </div>
              <p className="text-[11px] text-slate-500">Across 6 core topic areas</p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Strong Topics
              </span>
              <div className="text-2xl font-bold font-mono text-emerald-400">
                {overview?.topics_mastery.filter((t) => t.mastery_score >= 0.75).length || 0}
              </div>
              <p className="text-[11px] text-slate-500">Mastery ≥ 75%</p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Focus Areas
              </span>
              <div className="text-2xl font-bold font-mono text-rose-400">
                {overview?.weak_topics.length || 0}
              </div>
              <p className="text-[11px] text-slate-500">Mastery &lt; 40%</p>
            </div>
          </div>

          {/* Simple Recharts Chart */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Topic Breakdown
            </h2>
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 20 }}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#020617',
                      borderColor: '#1e293b',
                      borderRadius: '0.5rem',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [`${val}%`, 'Mastery']}
                  />
                  <Bar dataKey="mastery" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, idx) => (
                      <Cell
                        key={`cell-${idx}`}
                        fill={entry.mastery >= 75 ? '#10b981' : entry.mastery >= 40 ? '#6366f1' : '#f43f5e'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Topics List */}
      {activeTab === 'topics' && (
        <div className="space-y-3">
          {overview?.topics_mastery.map((m) => {
            const pct = Math.round(m.mastery_score * 100);
            return (
              <div
                key={m.topic}
                className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-white">{m.topic}</h3>
                  <p className="text-xs text-slate-400">
                    {m.correct_attempts}/{m.total_attempts} practice questions correct
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span
                      className={`text-xs font-mono font-semibold px-2 py-0.5 rounded ${
                        pct >= 75
                          ? 'bg-emerald-950 text-emerald-300'
                          : pct >= 40
                          ? 'bg-indigo-950 text-indigo-300'
                          : 'bg-rose-950 text-rose-300'
                      }`}
                    >
                      {pct}%
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      navigate('/tutor', {
                        state: { initialPrompt: `Help me review ${m.topic} from my course materials.` },
                      })
                    }
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="Ask tutor about this topic"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 3: Identified Gaps */}
      {activeTab === 'gaps' && (
        <div className="space-y-4">
          {overview && overview.active_misconceptions.length > 0 ? (
            overview.active_misconceptions.map((misc) => (
              <div
                key={misc.id}
                className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-mono font-medium text-rose-400 uppercase">
                      {misc.topic}
                    </span>
                    <h3 className="text-sm font-semibold text-white mt-0.5">
                      {misc.misconception_name}
                    </h3>
                  </div>
                  <button
                    onClick={() =>
                      navigate('/tutor', {
                        state: { initialPrompt: `Explain the concept behind: ${misc.misconception_name}` },
                      })
                    }
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium cursor-pointer"
                  >
                    Review with tutor
                  </button>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                  {misc.description}
                </p>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-900 rounded-xl border border-slate-800">
              No active misconceptions logged. You are on track!
            </div>
          )}
        </div>
      )}
    </div>
  );
};
