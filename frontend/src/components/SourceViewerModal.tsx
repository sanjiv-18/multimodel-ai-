import React from 'react';
import { X, FileText, Presentation, Video, Clock, CheckCircle2, Bookmark, ExternalLink } from 'lucide-react';
import { Citation } from '../types';

interface SourceViewerModalProps {
  citation: Citation | null;
  onClose: () => void;
}

export const SourceViewerModal: React.FC<SourceViewerModalProps> = ({ citation, onClose }) => {
  if (!citation) return null;

  const getLocationLabel = () => {
    if (citation.material_type === 'pdf' && citation.page_number) return `Page ${citation.page_number}`;
    if (citation.material_type === 'pptx' && citation.slide_number) return `Slide ${citation.slide_number}`;
    if (citation.material_type === 'video' && citation.video_timestamp) return `Timestamp ${citation.video_timestamp}`;
    return 'Document Reference';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              {citation.material_type === 'pdf' && <FileText className="w-5 h-5 text-rose-400" />}
              {citation.material_type === 'pptx' && <Presentation className="w-5 h-5 text-amber-400" />}
              {citation.material_type === 'video' && <Video className="w-5 h-5 text-sky-400" />}
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 text-base flex items-center gap-2">
                {citation.source_name}
                <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/40">
                  {getLocationLabel()}
                </span>
              </h3>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span>Type: <strong className="text-slate-300 uppercase">{citation.material_type}</strong></span>
                <span>•</span>
                <span>Topic: <strong className="text-slate-300">{citation.topic || 'General'}</strong></span>
                {citation.relevance_score && (
                  <>
                    <span>•</span>
                    <span className="text-emerald-400 font-medium">Relevance: {(citation.relevance_score * 100).toFixed(0)}%</span>
                  </>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Viewer Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Visual Source Representation */}
          {citation.material_type === 'video' ? (
            <div className="bg-slate-950 rounded-xl p-6 border border-slate-800 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 animate-pulse">
                <Video className="w-8 h-8" />
              </div>
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-950/80 border border-sky-800/50 rounded-full text-xs font-mono text-sky-300 mb-2">
                  <Clock className="w-3.5 h-3.5" /> Jumped to: {citation.video_timestamp || '00:00'}
                </div>
                <h4 className="text-sm font-semibold text-slate-200">Lecture Video Stream</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-md">
                  Audio transcribed and aligned to timestamp frame {citation.video_timestamp}.
                </p>
              </div>
            </div>
          ) : citation.material_type === 'pptx' ? (
            <div className="bg-slate-950 rounded-xl p-6 border border-slate-800 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-14 h-14 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Presentation className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-mono bg-amber-950/80 text-amber-300 px-2.5 py-1 rounded border border-amber-800/50">
                  Slide {citation.slide_number || 1}
                </span>
                <h4 className="text-sm font-semibold text-slate-200 mt-2">Lecture Presentation Slide</h4>
              </div>
            </div>
          ) : (
            <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-200">PDF Document Reference</h4>
                  <p className="text-xs text-slate-400 font-mono">Page {citation.page_number || 1} of document</p>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified Grounding
              </span>
            </div>
          )}

          {/* Grounded Excerpt Box */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
              <Bookmark className="w-3.5 h-3.5 text-indigo-400" />
              Extracted Grounded Chunk Text
            </label>
            <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 text-slate-200 text-sm leading-relaxed font-sans shadow-inner">
              {citation.snippet}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/60">
          <span className="text-xs text-slate-400">
            Source location preserved by Multimodal Ingestion Agent
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow-sm"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
};
