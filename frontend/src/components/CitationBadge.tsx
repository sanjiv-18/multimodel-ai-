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
        return <FileText className="w-3.5 h-3.5 text-rose-600" />;
      case 'pptx':
        return <Presentation className="w-3.5 h-3.5 text-amber-600" />;
      case 'video':
        return <Video className="w-3.5 h-3.5 text-sky-600" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-indigo-600" />;
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
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 transition-all hover:scale-[1.02] active:scale-[0.98] group cursor-pointer shadow-2xs"
      title={`Open ${citation.source_name} at ${getLocationLabel()}`}
    >
      {getIcon()}
      <span className="font-semibold text-slate-800 truncate max-w-[140px]">
        {citation.source_name}
      </span>
      <span className="text-slate-600 font-mono text-[11px] bg-white px-1.5 py-0.5 rounded border border-slate-200">
        {getLocationLabel()}
      </span>
      <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-slate-700 transition-opacity ml-0.5" />
    </button>
  );
};
