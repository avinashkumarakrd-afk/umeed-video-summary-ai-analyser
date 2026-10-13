import React from 'react';
import { FileText, Calculator, HelpCircle, CheckSquare, Sparkles } from 'lucide-react';

export type PresetKey = 'notes' | 'formula' | 'pyq' | 'mcq';

interface PresetsRowProps {
  onSelectPreset: (presetKey: PresetKey) => void;
  activePreset: PresetKey | null;
  isLoading: boolean;
}

export const PresetsRow: React.FC<PresetsRowProps> = ({
  onSelectPreset,
  activePreset,
  isLoading,
}) => {
  const presets: {
    key: PresetKey;
    label: string;
    sublabel: string;
    icon: React.ReactNode;
    color: string;
  }[] = [
    {
      key: 'notes',
      label: 'Concise 2-Page Notes',
      sublabel: 'Page 1: Concepts • Page 2: Formulas & PYQs',
      icon: <FileText className="w-4 h-4 text-[#38BDF8]" />,
      color: 'border-[#38BDF8] text-[#38BDF8]',
    },
    {
      key: 'formula',
      label: 'Formula Sheet',
      sublabel: 'Math relations, SI units & shortcuts',
      icon: <Calculator className="w-4 h-4 text-emerald-400" />,
      color: 'border-emerald-400 text-emerald-400',
    },
    {
      key: 'pyq',
      label: 'Key PYQs',
      sublabel: 'Past 10 Years NEET high-yield topics',
      icon: <HelpCircle className="w-4 h-4 text-amber-400" />,
      color: 'border-amber-400 text-amber-400',
    },
    {
      key: 'mcq',
      label: '5 Practice MCQs',
      sublabel: 'Interactive exam quiz with NCERT rationale',
      icon: <CheckSquare className="w-4 h-4 text-pink-400" />,
      color: 'border-pink-400 text-pink-400',
    },
  ];

  return (
    <div className="py-2.5 px-4 bg-[#0F172A] border-b border-[#334155]/60 overflow-x-auto scrollbar-none">
      <div className="max-w-7xl mx-auto flex items-center gap-2.5 min-w-max">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 shrink-0 mr-1">
          <Sparkles className="w-3 h-3 text-[#38BDF8]" />
          Quick Actions:
        </span>
        {presets.map((item) => {
          const isSelected = activePreset === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onSelectPreset(item.key)}
              disabled={isLoading}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${
                isSelected
                  ? 'bg-[#1E293B] border-2 border-[#38BDF8] text-[#38BDF8] shadow-md shadow-[#38BDF8]/10'
                  : 'bg-[#1E293B] hover:bg-[#334155] border border-[#334155] text-slate-200 hover:text-white'
              }`}
            >
              <div className="shrink-0">{item.icon}</div>
              <div className="text-left">
                <span className="block leading-tight">{item.label}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
