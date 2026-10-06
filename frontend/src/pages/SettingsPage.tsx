import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MaterialUploadPage } from './MaterialUploadPage';
import { KnowledgeMapPage } from './KnowledgeMapPage';
import { EvaluationPage } from './EvaluationPage';
import {
  Settings,
  UploadCloud,
  Network,
  CheckSquare2,
  Shield,
  Layers,
  Database
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'materials' | 'knowledge' | 'evaluation'>('materials');

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight">Advanced & Course Management</h1>
          <p className="text-xs text-slate-400">
            Manage course materials, inspect the knowledge graph, and run RAG evaluation benchmarks.
          </p>
        </div>
      </div>

      {/* Sub-Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3 text-xs">
        <button
          onClick={() => setActiveSection('materials')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
            activeSection === 'materials'
              ? 'bg-indigo-600 text-white font-medium shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>Material Ingestion</span>
        </button>

        <button
          onClick={() => setActiveSection('knowledge')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
            activeSection === 'knowledge'
              ? 'bg-indigo-600 text-white font-medium shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Network className="w-3.5 h-3.5" />
          <span>Knowledge Map</span>
        </button>

        <button
          onClick={() => setActiveSection('evaluation')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
            activeSection === 'evaluation'
              ? 'bg-indigo-600 text-white font-medium shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
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
