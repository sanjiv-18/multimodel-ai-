import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { materialService, courseService } from '../services/api';
import { StudyGuide, Course, Material, Citation } from '../types';
import { CitationBadge } from '../components/CitationBadge';
import { SourceViewerModal } from '../components/SourceViewerModal';
import {
  BookOpen, HelpCircle, PenTool, CheckCircle2,
  Bookmark, ArrowRight, RefreshCw, FolderPlus,
  FileText, Sparkles, ChevronRight, Layers, ArrowLeft
} from 'lucide-react';

export const StudyNotesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');

  const [guide, setGuide] = useState<StudyGuide | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);
  const [activeSectionIdx, setActiveSectionIdx] = useState<number>(0);

  const courseIdParam = searchParams.get('course_id');
  const materialIdParam = searchParams.get('material_id');

  useEffect(() => {
    initStudyPage();
  }, [courseIdParam, materialIdParam]);

  const initStudyPage = async () => {
    setLoading(true);
    try {
      const cList = await courseService.list();
      setCourses(cList);

      if (cList.length === 0) {
        setLoading(false);
        return;
      }

      const activeCourseId = courseIdParam || cList[0].id;
      setSelectedCourseId(activeCourseId);

      const mList = await materialService.list(activeCourseId);
      setMaterials(mList);

      const activeMatId = materialIdParam || (mList.length > 0 ? mList[0].id : undefined);
      if (activeMatId) {
        setSelectedMaterialId(activeMatId);
      }

      await loadGuide(activeCourseId, activeMatId);
    } catch (err) {
      console.error('Failed to load study guide', err);
    } finally {
      setLoading(false);
    }
  };

  const loadGuide = async (cId: string, mId?: string) => {
    try {
      const data = await materialService.getStudyGuide(cId, mId);
      setGuide(data);
      setActiveSectionIdx(0);
    } catch (err) {
      console.error('Failed to get guide', err);
    }
  };

  const handleCourseChange = async (cId: string) => {
    setSelectedCourseId(cId);
    setLoading(true);
    try {
      const mList = await materialService.list(cId);
      setMaterials(mList);
      const nextMatId = mList.length > 0 ? mList[0].id : undefined;
      setSelectedMaterialId(nextMatId || '');
      await loadGuide(cId, nextMatId);
    } catch (err) {
      console.error('Failed switching course in study page', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMaterialChange = async (mId: string) => {
    setSelectedMaterialId(mId);
    setLoading(true);
    try {
      await loadGuide(selectedCourseId, mId || undefined);
    } catch (err) {
      console.error('Failed switching material', err);
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
          <h2 className="text-lg font-bold text-slate-900">No Learning Materials Found</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Upload your lecture slides or notes to generate a structured, source-grounded study guide.
          </p>
        </div>
        <button
          onClick={() => navigate('/courses')}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
        >
          <FolderPlus className="w-4 h-4" /> Go to My Courses
        </button>
      </div>
    );
  }

  const currentCourse = courses.find(c => c.id === selectedCourseId) || courses[0];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fadeIn">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-xs text-slate-400 hover:text-slate-600 inline-flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </button>
            <span className="text-xs text-slate-300">•</span>
            <span className="text-xs font-bold text-slate-900">Study My Notes</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold">
              Source Grounded
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {guide?.title || 'Course Study Guide'}
          </h1>
        </div>

        {/* Course and Material Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {courses.length > 1 && (
            <select
              value={selectedCourseId}
              onChange={(e) => handleCourseChange(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none focus:border-indigo-500 shadow-2xs"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code ? `[${c.code}] ` : ''}{c.title}
                </option>
              ))}
            </select>
          )}

          {materials.length > 0 && (
            <select
              value={selectedMaterialId}
              onChange={(e) => handleMaterialChange(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none focus:border-indigo-500 shadow-2xs"
            >
              <option value="">All Uploaded Documents</option>
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  📄 {m.title}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Guide Summary Card */}
      {guide && guide.sections.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Topics Navigation */}
          <div className="lg:col-span-4 space-y-3">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                Note Sections ({guide.sections.length})
              </h3>
              <div className="space-y-1.5">
                {guide.sections.map((sec, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveSectionIdx(idx)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                      activeSectionIdx === idx
                        ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate">{sec.title}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            {/* Revision Checklist */}
            {guide.revision_checklist.length > 0 && (
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Mastery Checkpoints
                </h3>
                <div className="space-y-2">
                  {guide.revision_checklist.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2.5">
              <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider block">
                Next Steps for this Topic:
              </span>
              <button
                onClick={() => navigate('/tutor', {
                  state: {
                    courseId: selectedCourseId,
                    initialPrompt: `Explain the key concepts of "${guide.sections[activeSectionIdx]?.title || 'this topic'}" in detail.`,
                  },
                })}
                className="w-full py-2 px-3 rounded-xl bg-white hover:bg-slate-50 border border-indigo-200 text-indigo-900 text-xs font-semibold flex items-center justify-between transition-colors shadow-2xs cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <HelpCircle className="w-3.5 h-3.5 text-indigo-600" /> Ask Tutor About This
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                onClick={() => navigate(`/practice?course_id=${selectedCourseId}&topic=${encodeURIComponent(guide.sections[activeSectionIdx]?.title || '')}`)}
                className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-between transition-colors shadow-2xs cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <PenTool className="w-3.5 h-3.5" /> Practice Adaptive Quiz
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-indigo-200" />
              </button>
            </div>
          </div>

          {/* Right Column: Active Section Content */}
          <div className="lg:col-span-8 space-y-4">
            {guide.sections[activeSectionIdx] && (
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h2 className="text-lg font-bold text-slate-900">
                    {guide.sections[activeSectionIdx].title}
                  </h2>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-mono font-medium">
                    Section {activeSectionIdx + 1} of {guide.sections.length}
                  </span>
                </div>

                {/* Key Points */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Core Principles & Key Points
                  </h4>
                  <div className="space-y-2">
                    {guide.sections[activeSectionIdx].key_points.map((kp, kIdx) => (
                      <div key={kIdx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-800 leading-relaxed flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          {kIdx + 1}
                        </div>
                        <span>{kp}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Citations Box */}
                {guide.sections[activeSectionIdx].citations.length > 0 && (
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Source References:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {guide.sections[activeSectionIdx].citations.map((c, cIdx) => (
                        <CitationBadge
                          key={cIdx}
                          citation={c}
                          onClick={() => setActiveCitation(c)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Key Definitions if available */}
            {guide.key_definitions.length > 0 && (
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-amber-500" />
                  Key Definitions & Formulae
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {guide.key_definitions.map((def, dIdx) => (
                    <div key={dIdx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <h5 className="font-bold text-xs text-slate-900">{def.term}</h5>
                      <p className="text-xs text-slate-600 leading-relaxed">{def.definition}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
          <p>{guide?.summary || 'No study guide available for this selection.'}</p>
        </div>
      )}

      {/* Source Viewer Modal */}
      <SourceViewerModal
        citation={activeCitation}
        onClose={() => setActiveCitation(null)}
      />
    </div>
  );
};
