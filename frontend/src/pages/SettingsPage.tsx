import React, { useState } from 'react';
import { MaterialUploadPage } from './MaterialUploadPage';
import { KnowledgeMapPage } from './KnowledgeMapPage';
import { EvaluationPage } from './EvaluationPage';
import {
  UploadCloud,
  Network,
  CheckSquare2
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'materials' | 'knowledge' | 'evaluation'>('materials');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Advanced Course Tools & Diagnostics</h1>
        <p className="text-xs text-slate-500">
          Multimodal document ingestion, interactive prerequisite graph, and RAG evaluation benchmarks.
        </p>
      </div>

      {/* Sub-Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 text-xs">
        <button
          onClick={() => setActiveSection('materials')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-semibold transition-all cursor-pointer ${
            activeSection === 'materials'
              ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-2xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>Material Ingestion</span>
        </button>

        <button
          onClick={() => setActiveSection('knowledge')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-semibold transition-all cursor-pointer ${
            activeSection === 'knowledge'
              ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-2xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Network className="w-3.5 h-3.5" />
          <span>Knowledge Map</span>
        </button>

        <button
          onClick={() => setActiveSection('evaluation')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-semibold transition-all cursor-pointer ${
            activeSection === 'evaluation'
              ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-2xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <CheckSquare2 className="w-3.5 h-3.5" />
          <span>RAG Evaluation & Integrity</span>
        </button>
      </div>

      {/* Embedded Sub-View */}
      <div className="pt-2">
        {activeSection === 'materials' && <MaterialUploadPage />}
        {activeSection === 'knowledge' && <KnowledgeMapPage />}
        {activeSection === 'evaluation' && <EvaluationPage />}
      </div>
    </div>
  );
};
