import React, { useState } from 'react';
import { Youtube, RotateCcw, Sparkles, X, ChevronDown, CheckCircle2 } from 'lucide-react';
import { VideoInfo } from '../types';
import { SAMPLE_NEET_LECTURES } from '../data/sampleLectures';

interface TopBarProps {
  urlInput: string;
  setUrlInput: (val: string) => void;
  onLoadVideo: (url: string) => void;
  onClearSession: () => void;
  activeVideo: VideoInfo | null;
  isLoading: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  urlInput,
  setUrlInput,
  onLoadVideo,
  onClearSession,
  activeVideo,
  isLoading,
}) => {
  const [showSamples, setShowSamples] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      onLoadVideo(urlInput.trim());
    }
  };

  const selectSample = (sample: VideoInfo) => {
    setUrlInput(sample.canonicalUrl);
    onLoadVideo(sample.canonicalUrl);
    setShowSamples(false);
  };

  return (
    <header className="bg-[#1E293B] border-b border-[#334155] px-4 py-3 sticky top-0 z-30 shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-col gap-3">
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0284C7] to-[#38BDF8] flex items-center justify-center text-slate-950 font-black shadow-md shadow-[#38BDF8]/20">
              <Youtube className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-slate-100 text-base md:text-lg tracking-tight">
                  NEET AI Lecture Companion
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold bg-[#0F172A] border border-[#38BDF8]/40 text-[#38BDF8] px-2 py-0.5 rounded-full">
                  <Sparkles className="w-3 h-3 text-[#38BDF8]" />
                  gemini-3.8-flash
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Dynamic YouTube Lecture Context • NCERT 2-Page Notes • PYQ Engine
              </p>
            </div>
          </div>

          {/* Reset / Clear Session Button at Top Right */}
          <div className="flex items-center gap-2">
            <button
              onClick={onClearSession}
              title="Reset / Clear Session: Manually wipe previous video data and chat history"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F172A] hover:bg-rose-950/40 border border-[#334155] hover:border-rose-500/50 text-slate-300 hover:text-rose-300 text-xs font-medium transition-all group shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#38BDF8] group-hover:text-rose-400 group-hover:-rotate-90 transition-transform" />
              <span className="hidden sm:inline">Reset / Clear Session</span>
              <span className="sm:hidden">Reset</span>
            </button>
          </div>
        </div>

        {/* URL Input Bar & Action Buttons */}
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Paste YouTube Lecture URL (e.g., https://www.youtube.com/watch?v=...)"
              className="w-full bg-[#0F172A] border border-[#334155] focus:border-[#38BDF8] text-slate-100 placeholder-slate-500 text-xs md:text-sm rounded-xl px-3.5 py-2.5 pr-20 outline-none transition-all shadow-inner font-mono"
            />
            {urlInput && (
              <button
                type="button"
                onClick={() => setUrlInput('')}
                className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowSamples(!showSamples)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#38BDF8] p-1 rounded hover:bg-[#1E293B] transition-colors"
              title="Choose from sample NEET lectures"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={isLoading || !urlInput.trim()}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-[#38BDF8] hover:bg-[#7dd3fc] disabled:bg-slate-700 disabled:text-slate-500 text-slate-950 font-bold text-xs md:text-sm transition-all shadow-md shadow-[#38BDF8]/20 flex items-center justify-center gap-1.5 active:scale-95"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <Youtube className="w-4 h-4" />
                  <span>Load Video</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Sample Lectures Dropdown */}
        {showSamples && (
          <div className="bg-[#0F172A] border border-[#334155] rounded-xl p-3 shadow-2xl animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#334155]/60 text-xs font-semibold text-slate-300">
              <span>Quick Sample NEET Lectures:</span>
              <button
                onClick={() => setShowSamples(false)}
                className="text-slate-500 hover:text-slate-300 text-[11px]"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SAMPLE_NEET_LECTURES.map((sample) => (
                <button
                  key={sample.videoId}
                  onClick={() => selectSample(sample)}
                  className="flex items-start gap-2.5 p-2 rounded-lg bg-[#1E293B] hover:bg-[#334155] text-left transition-colors border border-transparent hover:border-[#38BDF8]/30 group"
                >
                  <img
                    src={sample.thumbnailUrl}
                    alt={sample.title}
                    className="w-16 h-10 object-cover rounded bg-slate-800 shrink-0 border border-slate-700"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-200 group-hover:text-[#38BDF8] truncate">
                      {sample.title}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">{sample.authorName}</p>
                    <span className="inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#0F172A] text-slate-300">
                      {sample.subject}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Active Context Notification Bar */}
        {activeVideo && (
          <div className="flex items-center justify-between bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-slate-300">
            <div className="flex items-center gap-2 min-w-0">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-slate-400 text-[11px] shrink-0 font-medium">Context Active:</span>
              <span className="font-semibold text-slate-200 truncate text-[11px]">
                {activeVideo.title}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 pl-2">
              <CheckCircle2 className="w-3 h-3 text-[#38BDF8]" />
              <span className="text-[10px] text-[#38BDF8] font-medium hidden sm:inline">
                Isolated context locked
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
