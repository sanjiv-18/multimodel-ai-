import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { assessmentService, courseService, knowledgeService } from '../services/api';
import { Course, Topic, Assessment, AssessmentResult } from '../types';
import {
  PenTool,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  BookOpen,
  MessageSquare,
  FolderPlus
} from 'lucide-react';

export const AssessmentPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('Adaptive');
  const [questionCount, setQuestionCount] = useState<number>(4);

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<AssessmentResult | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const init = async () => {
      try {
        const cList = await courseService.list();
        setCourses(cList);
        if (cList.length > 0) {
          const cId = cList[0].id;
          setSelectedCourseId(cId);
          const tList = await knowledgeService.getTopics(cId);
          setTopics(tList);
          
          const paramTopic = searchParams.get('topic');
          if (paramTopic) {
            setSelectedTopic(paramTopic);
          } else if (tList.length > 0) {
            setSelectedTopic(tList[0].name);
          }
        }
      } catch (err) {
        console.error('Failed to load assessment setup', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [searchParams]);

  const handleCourseChange = async (courseId: string) => {
    setSelectedCourseId(courseId);
    try {
      const tList = await knowledgeService.getTopics(courseId);
      setTopics(tList);
      if (tList.length > 0) setSelectedTopic(tList[0].name);
      else setSelectedTopic('');
    } catch (err) {
      console.error('Failed to load course topics', err);
    }
  };

  const handleStartPractice = async () => {
    if (!selectedCourseId || !selectedTopic) return;
    setGenerating(true);
    setResult(null);
    setAnswers({});

    try {
      const ass = await assessmentService.generate(
        selectedCourseId,
        selectedTopic,
        selectedDifficulty,
        questionCount
      );
      setAssessment(ass);
    } catch (err) {
      console.error('Failed to generate assessment', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleSelectAnswer = (qId: string, choice: string) => {
    if (result) return;
    setAnswers((prev) => ({ ...prev, [qId]: choice }));
  };

  const handleSubmit = async () => {
    if (!assessment) return;
    setSubmitting(true);

    const submissions = assessment.questions.map((q) => ({
      question_id: q.id,
      student_answer: answers[q.id] || '',
    }));

    try {
      const res = await assessmentService.submit(assessment.id, submissions);
      setResult(res);
    } catch (err) {
      console.error('Failed to submit practice', err);
    } finally {
      setSubmitting(false);
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
          <h2 className="text-lg font-bold text-slate-900">No Courses Available</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            To generate adaptive assessments, create a course and upload learning documents first.
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

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fadeIn">
      {/* 1. Pre-Quiz Selection View */}
      {!assessment && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Adaptive Practice Studio</h1>
            <p className="text-xs text-slate-500">
              Verified question generator calibrated to your active learner gaps and course material.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
            {/* Course Selector */}
            {courses.length > 1 && (
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Select Course
                </label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => handleCourseChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Topic Selector */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">
                Choose Topic to Practice
              </label>
              {topics.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {topics.map((t) => {
                    const isSelected = selectedTopic === t.name;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTopic(t.name)}
                        className={`p-3.5 rounded-2xl border text-left text-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-950 font-bold ring-2 ring-indigo-500/20'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="font-bold">{t.name}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                          {Math.round((t.mastery || 0) * 100)}% Current Mastery
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                  No topics extracted yet for this course. Upload notes or slides in Course Details first.
                </div>
              )}
            </div>

            {/* Settings Row */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Difficulty Mode
                </label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                >
                  <option value="Adaptive">Adaptive (Calibrated to gaps)</option>
                  <option value="Easy">Easy (Foundational)</option>
                  <option value="Medium">Medium (Intermediate)</option>
                  <option value="Hard">Hard (Advanced)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Question Count
                </label>
                <select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                >
                  <option value={2}>2 Questions (Quick check)</option>
                  <option value={4}>4 Questions (Standard drill)</option>
                  <option value={8}>8 Questions (Comprehensive)</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleStartPractice}
              disabled={generating || !selectedTopic}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating & Verifying {questionCount} Questions...
                </>
              ) : (
                <>
                  <PenTool className="w-4 h-4" /> Start Practice on {selectedTopic || 'Selected Topic'}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 2. Active Practice Session View */}
      {assessment && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <span className="text-xs font-mono font-bold text-indigo-600">
                {assessment.topic}
              </span>
              <h2 className="text-base font-bold text-slate-900">
                {assessment.questions.length} Practice Questions ({assessment.difficulty})
              </h2>
            </div>
            <button
              onClick={() => {
                setAssessment(null);
                setResult(null);
              }}
              className="text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              Exit session
            </button>
          </div>

          {/* Question Cards */}
          <div className="space-y-6">
            {assessment.questions.map((q, idx) => {
              const selectedChoice = answers[q.id];
              const qResult = result?.results.find((r) => r.question_id === q.id);

              return (
                <div
                  key={q.id}
                  className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4 text-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-mono text-slate-400">
                      Question {idx + 1} of {assessment.questions.length}
                    </span>
                    {qResult && (
                      <span>
                        {qResult.is_correct ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-600" />
                        )}
                      </span>
                    )}
                  </div>

                  <p className="font-semibold text-slate-900 leading-snug">{q.question_text}</p>

                  {/* Options */}
                  <div className="space-y-2 pt-1">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = selectedChoice === opt;
                      const isCorrectChoice = qResult && qResult.correct_answer === opt;
                      const isWrongChoice = qResult && isSelected && !qResult.is_correct;

                      let btnStyle =
                        'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300';
                      if (isSelected && !qResult) {
                        btnStyle = 'bg-indigo-50 border-indigo-400 text-indigo-950 font-bold';
                      }
                      if (qResult) {
                        if (isCorrectChoice) {
                          btnStyle = 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold';
                        } else if (isWrongChoice) {
                          btnStyle = 'bg-rose-50 border-rose-300 text-rose-900';
                        } else {
                          btnStyle = 'bg-slate-50/60 border-slate-200 text-slate-400';
                        }
                      }

                      return (
                        <button
                          key={optIdx}
                          disabled={!!result}
                          onClick={() => handleSelectAnswer(q.id, opt)}
                          className={`w-full text-left p-3.5 rounded-xl border text-xs transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                        >
                          <span>{opt}</span>
                          <span className="w-3.5 h-3.5 rounded-full border border-current flex items-center justify-center shrink-0 ml-2">
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-current"></span>}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Post-submit Diagnostic & Misconception Breakdown */}
                  {qResult && (
                    <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                      {!qResult.is_correct && qResult.misconception_feedback && (
                        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 space-y-1">
                          <span className="font-bold block text-[11px] uppercase tracking-wider text-rose-700">
                            Understanding Gap Diagnosed:
                          </span>
                          <p className="leading-relaxed">{qResult.misconception_feedback}</p>
                        </div>
                      )}

                      <div className="text-slate-600 space-y-1">
                        <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider">
                          Explanation:
                        </span>
                        <p className="leading-relaxed text-slate-700">{qResult.explanation}</p>
                      </div>

                      {qResult.source_reference && (
                        <div className="text-[11px] text-slate-500 font-mono">
                          Source: {qResult.source_reference}
                        </div>
                      )}

                      <div className="pt-1 flex justify-end">
                        <button
                          onClick={() =>
                            navigate('/tutor', {
                              state: { initialPrompt: `Help me understand: "${q.question_text}"` },
                            })
                          }
                          className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold cursor-pointer"
                        >
                          <MessageSquare className="w-3 h-3" /> Ask tutor about this question
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Submit / Finish Button */}
          {!result ? (
            <button
              onClick={handleSubmit}
              disabled={submitting || Object.keys(answers).length === 0}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Evaluating answers & updating learner profile...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Submit Answers ({Object.keys(answers).length}/{assessment.questions.length})
                </>
              )}
            </button>
          ) : (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm text-center space-y-4 animate-fadeIn">
              <h3 className="text-base font-bold text-slate-900">Practice Complete</h3>
              <p className="text-xs text-slate-600">
                You got <strong className="text-indigo-600">{result.correct_count}</strong> of {result.total_questions} correct ({result.score_percentage}%).
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => {
                    setAssessment(null);
                    setResult(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer shadow-xs"
                >
                  Practice another topic
                </button>
                <button
                  onClick={() => navigate('/progress')}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  View updated progress
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
