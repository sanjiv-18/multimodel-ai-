import React from 'react';
import { FileText, Presentation, Video, ExternalLink } from 'lucide-react';
import { Citation } from '../types';

interface CitationBadgeProps {
  citation: Citation;
  onClick?: (citation: Citation) => void;
}

export const CitationBadge: React.FC<CitationBadgeProps> = ({ citation, onClick }) => {
  const getIcon = () => {
    switch (citation.material_type) {
      case 'pdf':
        return <FileText className="w-3.5 h-3.5 text-rose-400" />;
      case 'pptx':
        return <Presentation className="w-3.5 h-3.5 text-amber-400" />;
      case 'video':
        return <Video className="w-3.5 h-3.5 text-sky-400" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-indigo-400" />;
    }
  };

  const getLocationLabel = () => {
    if (citation.material_type === 'pdf' && citation.page_number) {
      return `Page ${citation.page_number}`;
    }
    if (citation.material_type === 'pptx' && citation.slide_number) {
      return `Slide ${citation.slide_number}`;
    }
    if (citation.material_type === 'video' && citation.video_timestamp) {
      return `Timestamp ${citation.video_timestamp}`;
    }
    return 'Source';
  };

  return (
    <button
      onClick={() => onClick && onClick(citation)}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-200 transition-all hover:scale-[1.02] active:scale-[0.98] group cursor-pointer shadow-sm"
      title={`Open ${citation.source_name} at ${getLocationLabel()}`}
    >
      {getIcon()}
      <span className="font-semibold text-slate-300 truncate max-w-[140px]">{citation.source_name}</span>
      <span className="text-slate-400 font-mono text-[11px] bg-slate-900/60 px-1.5 py-0.5 rounded">
        {getLocationLabel()}
      </span>
      <ExternalLink className="w-3 h-3 text-slate-400 opacity-60 group-hover:opacity-100 transition-opacity ml-0.5" />
    </button>
  );
};
