import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  MessageSquare
} from 'lucide-react';

export const AssessmentPage: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>('Searching Algorithms');

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<AssessmentResult | null>(null);

  const [generating, setGenerating] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const init = async () => {
      try {
        const cList = await courseService.list();
        setCourses(cList);
        if (cList.length > 0) {
          const tList = await knowledgeService.getTopics(cList[0].id);
          setTopics(tList);
          if (tList.length > 0) setSelectedTopic(tList[1]?.name || tList[0].name);
        }
      } catch (err) {
        console.error('Failed to load assessment page', err);
      }
    };
    init();
  }, []);

  const handleStartPractice = async (topicName?: string) => {
    if (courses.length === 0) return;
    const t = topicName || selectedTopic;
    setGenerating(true);
    setResult(null);
    setAnswers({});

    try {
      const ass = await assessmentService.generate(courses[0].id, t, 'Adaptive', 4);
      setAssessment(ass);
    } catch (err) {
      console.error('Failed to generate practice', err);
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

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-8 animate-fadeIn">
      {/* 1. Pre-Quiz Selection View */}
      {!assessment && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold text-white tracking-tight">Practice & Assessment</h1>
            <p className="text-xs text-slate-400">
              Short, adaptive practice sessions to check your understanding and detect gaps.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2">
                Choose Topic to Practice
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {topics.map((t) => {
                  const isSelected = selectedTopic === t.name;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTopic(t.name)}
                      className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-950/60 border-indigo-500 text-white font-medium ring-1 ring-indigo-500/40'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-semibold">{t.name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                        {Math.round((t.mastery || 0.5) * 100)}% Current Mastery
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => handleStartPractice()}
              disabled={generating}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-medium text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating 4 Adaptive Questions...
                </>
              ) : (
                <>
                  <PenTool className="w-4 h-4" /> Start Practice on {selectedTopic}
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
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div>
              <span className="text-xs font-semibold text-indigo-400 font-mono">
                {assessment.topic}
              </span>
              <h2 className="text-base font-semibold text-white">4 Practice Questions</h2>
            </div>
            <button
              onClick={() => {
                setAssessment(null);
                setResult(null);
              }}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
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
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 text-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-mono text-slate-400">
                      Question {idx + 1} of {assessment.questions.length}
                    </span>
                    {qResult && (
                      <span>
                        {qResult.is_correct ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400" />
                        )}
                      </span>
                    )}
                  </div>

                  <p className="font-medium text-slate-100 leading-snug">{q.question_text}</p>

                  {/* Options */}
                  <div className="space-y-2 pt-1">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = selectedChoice === opt;
                      const isCorrectChoice = qResult && qResult.correct_answer === opt;
                      const isWrongChoice = qResult && isSelected && !qResult.is_correct;

                      let btnStyle =
                        'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700';
                      if (isSelected && !qResult) {
                        btnStyle = 'bg-indigo-950 border-indigo-500 text-white font-medium';
                      }
                      if (qResult) {
                        if (isCorrectChoice) {
                          btnStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 font-medium';
                        } else if (isWrongChoice) {
                          btnStyle = 'bg-rose-950/80 border-rose-500 text-rose-200';
                        } else {
                          btnStyle = 'bg-slate-950/40 border-slate-800/40 text-slate-500';
                        }
                      }

                      return (
                        <button
                          key={optIdx}
                          disabled={!!result}
                          onClick={() => handleSelectAnswer(q.id, opt)}
                          className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
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
                    <div className="pt-3 border-t border-slate-800/80 space-y-2 text-xs">
                      {!qResult.is_correct && qResult.misconception_feedback && (
                        <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-900/50 text-rose-200 space-y-1">
                          <span className="font-semibold block text-[11px] uppercase tracking-wider text-rose-300">
                            Understanding Gap:
                          </span>
                          <p className="leading-relaxed">{qResult.misconception_feedback}</p>
                        </div>
                      )}

                      <div className="text-slate-400 space-y-1">
                        <span className="font-semibold text-slate-300 block text-[11px] uppercase tracking-wider">
                          Explanation:
                        </span>
                        <p className="leading-relaxed text-slate-300">{qResult.explanation}</p>
                      </div>

                      <div className="pt-1 flex justify-end">
                        <button
                          onClick={() =>
                            navigate('/tutor', {
                              state: { initialPrompt: `Help me understand: "${q.question_text}"` },
                            })
                          }
                          className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium cursor-pointer"
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
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-semibold text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Evaluating answers...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Submit Answers ({Object.keys(answers).length}/{assessment.questions.length})
                </>
              )}
            </button>
          ) : (
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4 animate-fadeIn">
              <h3 className="text-base font-semibold text-white">Practice Complete</h3>
              <p className="text-xs text-slate-300">
                You got <strong className="text-indigo-400">{result.correct_count}</strong> of {result.total_questions} correct ({result.score_percentage}%).
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => {
                    setAssessment(null);
                    setResult(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
                >
                  Practice another topic
                </button>
                <button
                  onClick={() => navigate('/progress')}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                >
                  View progress
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
