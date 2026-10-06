import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { courseService, materialService, knowledgeService, learnerService } from '../services/api';
import { Course, Material, Topic, LearnerOverview } from '../types';
import { MasteryBar } from '../components/MasteryBar';
import {
  BookOpen, Layers, UploadCloud, MessageSquare, HelpCircle, BarChart3,
  FileText, Presentation, Video, CheckCircle2, Clock, Sparkles, Plus
} from 'lucide-react';

export const CourseDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'materials' | 'topics'>('overview');
  const [courses, setCourses] = useState<Course[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [overview, setOverview] = useState<LearnerOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadCourseData = async () => {
      try {
        const cList = await courseService.list();
        setCourses(cList);
        if (cList.length > 0) {
          const courseId = cList[0].id;
          const [mats, tops, oView] = await Promise.all([
            materialService.list(courseId),
            knowledgeService.getTopics(courseId),
            learnerService.getOverview(courseId),
          ]);
          setMaterials(mats);
          setTopics(tops);
          setOverview(oView);
        }
      } catch (err) {
        console.error('Error loading course page', err);
      } finally {
        setLoading(false);
      }
    };
    loadCourseData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const course = courses[0];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Course Header */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
              <BookOpen className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                  {course?.code || 'CS-201'}
                </span>
                <span className="text-xs text-slate-400">Computer Science</span>
              </div>
              <h2 className="text-2xl font-bold text-white mt-1">{course?.title}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/upload')}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Ingest New Material
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-t border-slate-800/80 pt-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('materials')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'materials'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Course Materials ({materials.length})
          </button>
          <button
            onClick={() => setActiveTab('topics')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'topics'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Extracted Topics ({topics.length})
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <h3 className="text-base font-bold text-slate-100">Course Syllabus & Description</h3>
              <p className="text-sm text-slate-300 leading-relaxed">{course?.description}</p>
            </div>

            {/* Quick Agent Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div
                onClick={() => navigate('/tutor')}
                className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 transition-all cursor-pointer group"
              >
                <MessageSquare className="w-5 h-5 text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
                <h4 className="font-semibold text-sm text-slate-200">Grounded Chat</h4>
                <p className="text-xs text-slate-400 mt-1">Ask questions backed by exact slide/page references.</p>
              </div>

              <div
                onClick={() => navigate('/assessment')}
                className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 transition-all cursor-pointer group"
              >
                <HelpCircle className="w-5 h-5 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
                <h4 className="font-semibold text-sm text-slate-200">Adaptive Quiz</h4>
                <p className="text-xs text-slate-400 mt-1">Practice verified items calibrated to your gaps.</p>
              </div>

              <div
                onClick={() => navigate('/knowledge-map')}
                className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 transition-all cursor-pointer group"
              >
                <Layers className="w-5 h-5 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                <h4 className="font-semibold text-sm text-slate-200">Knowledge Graph</h4>
                <p className="text-xs text-slate-400 mt-1">Inspect prerequisite pathways and concepts.</p>
              </div>
            </div>
          </div>

          {/* Right Column: Mastery Breakdown */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              Topic Proficiency
            </h3>
            <div className="space-y-3">
              {overview?.topics_mastery.map((m) => (
                <div key={m.topic}>
                  <MasteryBar score={m.mastery_score} label={m.topic} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'materials' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {materials.map((mat) => (
            <div
              key={mat.id}
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-slate-800 text-slate-300">
                  {mat.file_type === 'pdf' && <FileText className="w-5 h-5 text-rose-400" />}
                  {mat.file_type === 'pptx' && <Presentation className="w-5 h-5 text-amber-400" />}
                  {mat.file_type === 'video' && <Video className="w-5 h-5 text-sky-400" />}
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/40 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> {mat.status}
                </span>
              </div>

              <div>
                <h4 className="font-semibold text-sm text-slate-100 truncate">{mat.title}</h4>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  {mat.chunks_count} semantic chunks indexed
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span className="uppercase font-mono text-[10px]">{mat.file_type}</span>
                <span>{(mat.file_size_bytes / (1024 * 1024)).toFixed(1)} MB</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'topics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {topics.map((t) => (
            <div key={t.id} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-slate-100">{t.name}</h4>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                  {Math.round((t.mastery || 0.5) * 100)}% Mastery
                </span>
              </div>
              <p className="text-xs text-slate-300">{t.description}</p>
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Key Concepts:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {t.concepts.map((c) => (
                    <span
                      key={c.id}
                      className="text-xs px-2.5 py-1 bg-slate-800/80 rounded-lg text-slate-200 border border-slate-700/60"
                    >
                      {c.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
