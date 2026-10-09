import React, { useState } from 'react';
import { Topic, Concept } from '../types';
import { Network, CheckCircle, ArrowRight, Layers, Sparkles, BookOpen } from 'lucide-react';

interface KnowledgeGraphVisualizerProps {
  topics: Topic[];
  onSelectConcept?: (conceptName: string, topicName: string) => void;
}

export const KnowledgeGraphVisualizer: React.FC<KnowledgeGraphVisualizerProps> = ({
  topics,
  onSelectConcept,
}) => {
  const [selectedTopicId, setSelectedTopicId] = useState<string>(topics[0]?.id || '');
  const [activeConcept, setActiveConcept] = useState<Concept | null>(null);

  const currentTopic = topics.find((t) => t.id === selectedTopicId) || topics[0];

  if (!currentTopic) {
    return (
      <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
        No topics available in knowledge graph.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Topics Hierarchy Column */}
      <div className="lg:col-span-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            Curriculum Structure
          </h3>
          <span className="text-xs text-slate-400 font-mono">{topics.length} Topics</span>
        </div>

        <div className="space-y-2">
          {topics.map((topic, idx) => {
            const isSelected = currentTopic && currentTopic.id === topic.id;
            const masteryPct = Math.round((topic.mastery || 0) * 100);

            return (
              <button
                key={topic.id}
                onClick={() => {
                  setSelectedTopicId(topic.id);
                  setActiveConcept(topic.concepts[0] || null);
                }}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between group cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-50 border-indigo-300 shadow-xs ring-2 ring-indigo-500/20'
                    : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-mono font-bold ${
                      isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 group-hover:text-slate-800'
                    }`}
                  >
                    0{idx + 1}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      {topic.name}
                    </h4>
                    <p className="text-[11px] text-slate-500">{topic.concepts.length} key concepts</p>
                  </div>
                </div>

                <span
                  className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg border ${
                    masteryPct >= 75
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : masteryPct >= 40
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {masteryPct}%
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Concept Network & Prerequisite Graph Column */}
      <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-6 flex flex-col justify-between space-y-6 shadow-sm">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5 mb-1">
                <Network className="w-3.5 h-3.5" />
                Knowledge Graph Explorer
              </span>
              <h3 className="text-base font-bold text-slate-900">{currentTopic.name}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{currentTopic.description}</p>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-600">
              Prerequisite Map
            </div>
          </div>

          {/* Concept Cards */}
          <div className="mt-6 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Concept Nodes & Prerequisite Requirements:
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentTopic.concepts.map((concept) => {
                const isActive = activeConcept?.id === concept.id;
                return (
                  <div
                    key={concept.id}
                    onClick={() => {
                      setActiveConcept(concept);
                      if (onSelectConcept) onSelectConcept(concept.name, currentTopic.name);
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-indigo-50 border-indigo-300 shadow-sm ring-2 ring-indigo-500/20'
                        : 'bg-slate-50/60 border-slate-200 hover:border-slate-300 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h5 className="font-bold text-xs text-slate-900 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-indigo-600" />
                        {concept.name}
                      </h5>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                          concept.difficulty_level === 'Easy'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : concept.difficulty_level === 'Hard'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {concept.difficulty_level}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-2 line-clamp-2">
                      {concept.description || 'Core conceptual component in topic curriculum.'}
                    </p>

                    {/* Prerequisites Tags */}
                    {concept.prerequisites && concept.prerequisites.length > 0 ? (
                      <div className="mt-3 pt-3 border-t border-slate-200/60 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Requires:
                        </span>
                        {concept.prerequisites.map((p, pIdx) => (
                          <span
                            key={pIdx}
                            className="text-[10px] bg-white text-indigo-700 px-2 py-0.5 rounded-md border border-slate-200 font-mono font-medium"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-3 pt-3 border-t border-slate-200/60 text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Fundamental root concept
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Concept Info Box */}
        {activeConcept && (
          <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-start justify-between gap-4 animate-fadeIn">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                  Active Focus: {activeConcept.name}
                </span>
              </div>
              <p className="text-xs text-indigo-950">{activeConcept.description}</p>
            </div>
            <button
              onClick={() => onSelectConcept && onSelectConcept(activeConcept.name, currentTopic?.name || '')}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer shadow-xs"
            >
              Ask Tutor <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
