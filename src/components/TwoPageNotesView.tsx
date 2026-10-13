import React, { useState } from 'react';
import { Copy, Check, Download, BookOpen, Calculator, Sparkles, ChevronRight, Bookmark } from 'lucide-react';
import { marked } from 'marked';

interface TwoPageNotesViewProps {
  rawNotes: string;
  videoTitle: string;
  subject: string;
}

export const TwoPageNotesView: React.FC<TwoPageNotesViewProps> = ({
  rawNotes,
  videoTitle,
  subject,
}) => {
  const [activePage, setActivePage] = useState<1 | 2>(1);
  const [copied, setCopied] = useState(false);

  // Split rawNotes into Page 1 and Page 2
  const pages = React.useMemo(() => {
    if (!rawNotes) {
      return { page1: '', page2: '' };
    }

    // Try splitting by PAGE 2 delimiter
    const page2Delimiters = [
      '# PAGE 2',
      '## PAGE 2',
      '### PAGE 2',
      'PAGE 2:',
      'PAGE 2 -',
      'Page 2:',
      'PAGE 2',
    ];

    let p1 = rawNotes;
    let p2 = '';

    for (const delim of page2Delimiters) {
      const idx = rawNotes.indexOf(delim);
      if (idx !== -1) {
        p1 = rawNotes.substring(0, idx).trim();
        p2 = rawNotes.substring(idx).trim();
        break;
      }
    }

    if (!p2) {
      // If no page 2 delimiter found, split roughly in half
      const lines = rawNotes.split('\n');
      const mid = Math.floor(lines.length / 2);
      p1 = lines.slice(0, mid).join('\n');
      p2 = lines.slice(mid).join('\n');
    }

    return { page1: p1, page2: p2 };
  }, [rawNotes]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([rawNotes], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = `NEET_Notes_${videoTitle.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30)}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const currentContent = activePage === 1 ? pages.page1 : pages.page2;
  const renderedHtml = marked.parse(currentContent, { async: false }) as string;

  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-2xl overflow-hidden shadow-xl flex flex-col h-full">
      {/* Header with Title and Page Tabs */}
      <div className="p-4 bg-[#1E293B] border-b border-[#334155] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#38BDF8] flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" />
              Structured 2-Page NEET Notes
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0F172A] border border-[#334155] text-slate-300 font-semibold">
              {subject}
            </span>
          </div>
          <h2 className="text-sm md:text-base font-bold text-slate-100 truncate max-w-lg mt-0.5">
            {videoTitle}
          </h2>
        </div>

        {/* Page Switcher Tabs */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center p-1 rounded-xl bg-[#0F172A] border border-[#334155]">
            <button
              onClick={() => setActivePage(1)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activePage === 1
                  ? 'bg-[#38BDF8] text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Page 1 (Concepts & NCERT)</span>
            </button>
            <button
              onClick={() => setActivePage(2)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activePage === 2
                  ? 'bg-[#38BDF8] text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Page 2 (Formulas & PYQs)</span>
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => handleCopy(currentContent)}
              className="p-2 rounded-lg bg-[#0F172A] hover:bg-[#334155] text-slate-300 hover:text-[#38BDF8] border border-[#334155] transition-colors"
              title="Copy this page"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={handleDownload}
              className="p-2 rounded-lg bg-[#0F172A] hover:bg-[#334155] text-slate-300 hover:text-[#38BDF8] border border-[#334155] transition-colors"
              title="Download Markdown Notes"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Page Info Banner */}
      <div className="px-4 py-2 bg-[#0F172A]/80 border-b border-[#334155]/60 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <Bookmark className="w-3.5 h-3.5 text-[#38BDF8]" />
          <span className="font-semibold text-slate-200">
            {activePage === 1
              ? 'PAGE 1: Core Concepts, Definitions & NCERT Key Takeaways'
              : 'PAGE 2: All Formulas/Equations, Shortcut Tricks & High-Yield PYQs'}
          </span>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">
          Page {activePage} of 2
        </span>
      </div>

      {/* Structured Content Area */}
      <div className="flex-1 p-5 overflow-y-auto bg-[#0F172A]/30">
        <div
          className="prose prose-invert prose-slate max-w-none text-xs md:text-sm leading-relaxed
            prose-headings:text-slate-100 prose-headings:font-bold prose-headings:tracking-tight
            prose-h1:text-lg prose-h1:text-[#38BDF8] prose-h1:border-b prose-h1:border-[#334155] prose-h1:pb-2
            prose-h2:text-base prose-h2:text-sky-300 prose-h2:mt-4
            prose-h3:text-sm prose-h3:text-emerald-400
            prose-p:text-slate-300 prose-p:my-2
            prose-ul:my-2 prose-ul:list-disc prose-ul:pl-5
            prose-li:text-slate-300 prose-li:my-1
            prose-strong:text-[#38BDF8] prose-strong:font-semibold
            prose-code:text-amber-300 prose-code:bg-[#0F172A] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono
            prose-blockquote:border-l-4 prose-blockquote:border-[#38BDF8] prose-blockquote:bg-[#1E293B] prose-blockquote:p-3 prose-blockquote:rounded-r-lg"
          dangerouslySetInnerHTML={{ __html: renderedHtml }}
        />
      </div>

      {/* Bottom Page Navigation */}
      <div className="p-3 bg-[#1E293B] border-t border-[#334155] flex items-center justify-between">
        <button
          onClick={() => setActivePage(1)}
          disabled={activePage === 1}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0F172A] text-slate-300 disabled:opacity-40 hover:bg-[#334155] transition-colors"
        >
          ← Back to Page 1
        </button>
        <span className="text-xs text-slate-400">
          Tailored for NEET 2025/2026 Examination
        </span>
        <button
          onClick={() => setActivePage(2)}
          disabled={activePage === 2}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#38BDF8] text-slate-950 disabled:opacity-40 hover:bg-[#7dd3fc] transition-colors font-bold"
        >
          <span>Go to Page 2</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
