import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { learnerService, courseService } from '../services/api';
import { Recommendation, Course } from '../types';
import {
  Lightbulb, Sparkles, ArrowRight, BookOpen, Video, HelpCircle,
  CheckCircle2, Clock, AlertTriangle, Layers
} from 'lucide-react';

export const RecommendationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadRecs = async () => {
      try {
        const cList = await courseService.list();
        setCourses(cList);
        if (cList.length > 0) {
          const recs = await learnerService.getRecommendations(cList[0].id);
          setRecommendations(recs);
        }
      } catch (err) {
        console.error('Failed to load recommendations', err);
      } finally {
        setLoading(false);
      }
    };
    loadRecs();
  }, []);

  const handleAction = (rec: Recommendation) => {
    if (rec.action_type === 'watch_video' || rec.action_type === 'review_concept') {
      navigate('/tutor', {
        state: { initialPrompt: `Review ${rec.target_topic || 'core concept'} based on course materials and citations.` },
      });
    } else {
      navigate('/assessment');
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-800/60 text-xs font-mono text-indigo-300">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> AGENT 8 • Personalization Agent
        </div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">
          Personalized Next Best Actions
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
          Actionable recommendations generated dynamically by synthesizing your topic mastery scores,
          prerequisite dependencies, and detected misconceptions. Every action contains an explicit pedagogical reason.
        </p>
      </div>

      {/* Recommendations Cards List */}
      <div className="space-y-4">
        {recommendations.map((rec, idx) => {
          const isHighPriority = rec.priority === 1;

          return (
            <div
              key={rec.id || idx}
              className={`p-6 rounded-3xl border transition-all space-y-4 ${
                isHighPriority
                  ? 'bg-gradient-to-r from-rose-950/20 via-slate-900/80 to-slate-900/80 border-rose-900/50 shadow-lg'
                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono px-2.5 py-0.5 rounded font-bold uppercase ${
                        isHighPriority
                          ? 'bg-rose-950 text-rose-300 border border-rose-800/60'
                          : 'bg-indigo-950 text-indigo-300 border border-indigo-800/60'
                      }`}
                    >
                      {rec.action_type.replace('_', ' ')} • Priority {rec.priority}
                    </span>
                    {rec.target_topic && (
                      <span className="text-xs text-slate-400 font-mono">
                        Topic: <strong className="text-slate-200">{rec.target_topic}</strong>
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-white pt-1">{rec.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                    {rec.description}
                  </p>
                </div>

                <button
                  onClick={() => handleAction(rec)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shrink-0 transition-all shadow-md shadow-indigo-600/20 cursor-pointer flex items-center gap-2 self-start sm:self-center"
                >
                  <span>Execute Action</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Explicit Pedagogical "WHY" Rationale Box */}
              <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800/80 text-xs text-indigo-200 font-sans flex items-start gap-2.5">
                <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-indigo-300 font-mono">PEDAGOGICAL RATIONALE:</strong>{' '}
                  <span className="text-slate-300">{rec.reason}</span>
                </div>
              </div>

              {rec.target_resource && (
                <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 pt-1">
                  <BookOpen className="w-3 h-3 text-indigo-400" />
                  Target Resource: <span className="text-slate-300">{rec.target_resource}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
