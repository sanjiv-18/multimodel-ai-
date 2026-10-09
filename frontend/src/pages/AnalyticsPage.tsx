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
  ArrowRight,
  FolderPlus
} from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [overview, setOverview] = useState<LearnerOverview | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'topics' | 'gaps'>('overview');
  const [loading, setLoading] = useState<boolean>(true);

  const loadProgress = async () => {
    try {
      const cList = await courseService.list();
      setCourses(cList);
      if (cList.length > 0) {
        const cId = selectedCourseId && cList.some(c => c.id === selectedCourseId)
          ? selectedCourseId
          : cList[0].id;
        setSelectedCourseId(cId);
        const oView = await learnerService.getOverview(cId);
        setOverview(oView);
      } else {
        setOverview(null);
      }
    } catch (err) {
      console.error('Failed to load progress', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProgress();
  }, []);

  const handleCourseChange = async (courseId: string) => {
    setSelectedCourseId(courseId);
    setLoading(true);
    try {
      const oView = await learnerService.getOverview(courseId);
      setOverview(oView);
    } catch (err) {
      console.error('Failed to load course overview', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center min-h-[50vh]">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If no courses exist
  if (courses.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-12 text-center space-y-4 animate-fadeIn">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
          <FolderPlus className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-900">No Learning Activity Yet</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Create a course and upload materials to track topic mastery and detect conceptual gaps.
          </p>
        </div>
        <button
          onClick={() => navigate('/courses')}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
        >
          <FolderPlus className="w-4 h-4" /> Create Course in My Courses
        </button>
      </div>
    );
  }

  const chartData = overview?.topics_mastery.map((m) => ({
    name: m.topic.length > 15 ? m.topic.substring(0, 13) + '...' : m.topic,
    fullName: m.topic,
    mastery: Math.round(m.mastery_score * 100),
    totalAttempts: m.total_attempts
  })) || [];

  const hasActivity = overview && (overview.recent_activity_count > 0 || overview.topics_mastery.some(t => t.total_attempts > 0));

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Learning Progress & Mastery</h1>
          <p className="text-xs text-slate-500">
            Transparent topic-by-topic mastery tracking and misconception diagnosis.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {courses.length > 1 && (
            <select
              value={selectedCourseId}
              onChange={(e) => handleCourseChange(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none focus:border-indigo-500 shadow-2xs"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          )}

          {/* Tab Selector */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white border border-slate-200 text-xs shadow-2xs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'overview' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('topics')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'topics' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Topics ({overview?.topics_mastery.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('gaps')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'gaps' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Gaps ({overview?.active_misconceptions.length || 0})
            </button>
          </div>
        </div>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top 3 Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Overall Course Mastery
              </span>
              <div className="text-2xl font-bold font-mono text-indigo-600">
                {overview && hasActivity ? Math.round(overview.overall_mastery * 100) : 0}%
              </div>
              <p className="text-[11px] text-slate-500">
                {hasActivity
                  ? `Across ${overview?.topics_mastery.length || 0} topic areas`
                  : 'Not enough activity yet'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Proficient Topics
              </span>
              <div className="text-2xl font-bold font-mono text-emerald-600">
                {overview?.topics_mastery.filter((t) => t.total_attempts > 0 && t.mastery_score >= 0.75).length || 0}
              </div>
              <p className="text-[11px] text-slate-500">Mastery ≥ 75%</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Identified Gaps
              </span>
              <div className="text-2xl font-bold font-mono text-rose-600">
                {overview?.active_misconceptions.length || 0}
              </div>
              <p className="text-[11px] text-slate-500">Active misconceptions</p>
            </div>
          </div>

          {/* Recharts Bar Chart */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Topic Mastery Breakdown
              </h2>
              <span className="text-xs text-slate-400">0 - 100% Score</span>
            </div>

            {chartData.length > 0 ? (
              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 20 }}>
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#e2e8f0',
                        borderRadius: '0.75rem',
                        color: '#0f172a',
                        fontSize: '12px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                      formatter={(val: any) => [`${val}%`, 'Mastery Score']}
                    />
                    <Bar dataKey="mastery" radius={[6, 6, 0, 0]}>
                      {chartData.map((entry, idx) => (
                        <Cell
                          key={`cell-${idx}`}
                          fill={
                            entry.totalAttempts === 0
                              ? '#cbd5e1'
                              : entry.mastery >= 75
                              ? '#10b981'
                              : entry.mastery >= 40
                              ? '#6366f1'
                              : '#f43f5e'
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="p-10 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
                No topic data available. Complete an adaptive practice quiz to populate your chart.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Topics List */}
      {activeTab === 'topics' && (
        <div className="space-y-3">
          {overview && overview.topics_mastery.length > 0 ? (
            overview.topics_mastery.map((m) => {
              const pct = Math.round(m.mastery_score * 100);
              const unattempted = m.total_attempts === 0;

              return (
                <div
                  key={m.topic}
                  className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900">{m.topic}</h3>
                    <p className="text-xs text-slate-500">
                      {unattempted
                        ? 'No practice questions attempted yet'
                        : `${m.correct_attempts}/${m.total_attempts} questions correct (${m.status})`}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg border ${
                        unattempted
                          ? 'bg-slate-100 text-slate-500 border-slate-200'
                          : pct >= 75
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : pct >= 40
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {unattempted ? 'Untried' : `${pct}%`}
                    </span>

                    <button
                      onClick={() =>
                        navigate(`/practice?topic=${encodeURIComponent(m.topic)}`)
                      }
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <span>Practice</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
              No topics available for this course.
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Identified Gaps */}
      {activeTab === 'gaps' && (
        <div className="space-y-4">
          {overview && overview.active_misconceptions.length > 0 ? (
            overview.active_misconceptions.map((misc) => (
              <div
                key={misc.id}
                className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-mono font-bold text-rose-600 uppercase">
                      {misc.topic}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                      {misc.misconception_name}
                    </h3>
                  </div>
                  <button
                    onClick={() =>
                      navigate('/tutor', {
                        state: { initialPrompt: `Help me understand: "${misc.misconception_name}"` },
                      })
                    }
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer shadow-xs"
                  >
                    Review with tutor
                  </button>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {misc.description}
                </p>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
              <div className="font-bold text-slate-800">No active misconceptions detected</div>
              <p className="text-slate-400">Keep practicing to maintain your understanding!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
