import React, { useState } from 'react';
import { Youtube, ExternalLink, ChevronUp, ChevronDown, BookOpen, Layers } from 'lucide-react';
import { VideoInfo } from '../types';

interface VideoPlayerCardProps {
  video: VideoInfo;
}

export const VideoPlayerCard: React.FC<VideoPlayerCardProps> = ({ video }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const getSubjectBadge = (subject: string) => {
    switch (subject) {
      case 'Physics':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      case 'Chemistry':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Biology':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
    }
  };

  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-2xl overflow-hidden shadow-lg transition-all">
      {/* Header Bar */}
      <div className="p-3.5 flex items-center justify-between gap-3 bg-[#1E293B] border-b border-[#334155]/60">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
            <Youtube className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-slate-100 text-sm truncate leading-snug">
              {video.title}
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="truncate">{video.authorName}</span>
              <span>•</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getSubjectBadge(video.subject)}`}>
                {video.subject}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <a
            href={video.canonicalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg bg-[#0F172A] hover:bg-[#334155] text-slate-400 hover:text-slate-200 transition-colors"
            title="Open in YouTube"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg bg-[#0F172A] hover:bg-[#334155] text-slate-400 hover:text-slate-200 transition-colors"
            title={isExpanded ? 'Collapse video player' : 'Expand video player'}
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Video Content */}
      {isExpanded && (
        <div className="relative aspect-video w-full bg-slate-950">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.videoId}?rel=0&modestbranding=1`}
            title={video.title}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {/* Bottom Info Strip */}
      <div className="px-3.5 py-2 bg-[#0F172A]/70 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-[#38BDF8]" />
          <span>Active Context Session: <strong>{video.videoId}</strong></span>
        </div>
        <div className="flex items-center gap-1 text-emerald-400 font-medium">
          <BookOpen className="w-3.5 h-3.5" />
          <span>NCERT Aligned</span>
        </div>
      </div>
    </div>
  );
};
