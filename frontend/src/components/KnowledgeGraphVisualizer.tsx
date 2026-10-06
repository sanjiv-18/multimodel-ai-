import React, { useState } from 'react';
import { Topic, Concept } from '../types';
import { Network, CheckCircle, AlertCircle, ArrowRight, Layers, Sparkles, BookOpen } from 'lucide-react';

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Topics Hierarchy Column */}
      <div className="lg:col-span-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            Curriculum Structure
          </h3>
          <span className="text-xs text-slate-400 font-mono">{topics.length} Topics</span>
        </div>

        <div className="space-y-2">
          {topics.map((topic, idx) => {
            const isSelected = (currentTopic && currentTopic.id === topic.id);
            const masteryPct = Math.round((topic.mastery || 0.5) * 100);

            return (
              <button
                key={topic.id}
                onClick={() => {
                  setSelectedTopicId(topic.id);
                  setActiveConcept(topic.concepts[0] || null);
                }}
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between group cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-950/50 border-indigo-500/50 shadow-md shadow-indigo-950/40 ring-1 ring-indigo-500/30'
                    : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold ${
                      isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'
                    }`}
                  >
                    0{idx + 1}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-200 group-hover:text-white">
                      {topic.name}
                    </h4>
                    <p className="text-xs text-slate-400">{topic.concepts.length} key concepts</p>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-xs font-mono font-semibold px-2 py-0.5 rounded ${
                      masteryPct >= 75
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                        : masteryPct >= 40
                        ? 'bg-amber-950 text-amber-400 border border-amber-800/50'
                        : 'bg-rose-950 text-rose-400 border border-rose-800/50'
                    }`}
                  >
                    {masteryPct}%
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Concept Network & Prerequisite Graph Column */}
      <div className="lg:col-span-8 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between space-y-6">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5 mb-1">
                <Network className="w-3.5 h-3.5" />
                Knowledge Graph Explorer
              </span>
              <h3 className="text-lg font-bold text-slate-100">{currentTopic?.name}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{currentTopic?.description}</p>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs font-mono text-slate-300">
              Prerequisite Dependency Map
            </div>
          </div>

          {/* Concept Cards with Prerequisite Connections */}
          <div className="mt-6 space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Concept Nodes & Prerequisite Requirements:
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentTopic?.concepts.map((concept) => {
                const isActive = activeConcept?.id === concept.id;
                return (
                  <div
                    key={concept.id}
                    onClick={() => {
                      setActiveConcept(concept);
                      if (onSelectConcept) onSelectConcept(concept.name, currentTopic.name);
                    }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-indigo-950/70 border-indigo-500 shadow-md ring-1 ring-indigo-500/40'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h5 className="font-semibold text-sm text-slate-100 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-indigo-400" />
                        {concept.name}
                      </h5>
                      <span
                        className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                          concept.difficulty_level === 'Easy'
                            ? 'bg-emerald-950/80 text-emerald-300'
                            : concept.difficulty_level === 'Hard'
                            ? 'bg-rose-950/80 text-rose-300'
                            : 'bg-amber-950/80 text-amber-300'
                        }`}
                      >
                        {concept.difficulty_level}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                      {concept.description || 'Core conceptual component in topic curriculum.'}
                    </p>

                    {/* Prerequisites Tags */}
                    {concept.prerequisites && concept.prerequisites.length > 0 ? (
                      <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                          Requires:
                        </span>
                        {concept.prerequisites.map((p, pIdx) => (
                          <span
                            key={pIdx}
                            className="text-[10px] bg-slate-800 text-indigo-300 px-2 py-0.5 rounded border border-slate-700 font-mono"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-emerald-400/80 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Fundamental root concept (no prior prereqs)
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Concept Deep-Dive Info Box */}
        {activeConcept && (
          <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-800/40 flex items-start justify-between gap-4 animate-fadeIn">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                  Active Focus: {activeConcept.name}
                </span>
              </div>
              <p className="text-xs text-slate-300">{activeConcept.description}</p>
            </div>
            <button
              onClick={() => onSelectConcept && onSelectConcept(activeConcept.name, currentTopic?.name || '')}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
            >
              Ask Tutor / Quiz <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
