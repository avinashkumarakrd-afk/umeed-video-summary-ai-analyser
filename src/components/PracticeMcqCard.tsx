import React, { useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, BookOpen, RefreshCw, Trophy } from 'lucide-react';
import { PracticeMCQ } from '../types';

interface PracticeMcqCardProps {
  questions: PracticeMCQ[];
  videoTitle: string;
  onRefresh: () => void;
}

export const PracticeMcqCard: React.FC<PracticeMcqCardProps> = ({
  questions,
  videoTitle,
  onRefresh,
}) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});
  const [showResults, setShowResults] = useState(false);

  const handleSelect = (qId: string, optionKey: 'A' | 'B' | 'C' | 'D') => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [qId]: optionKey,
    }));
  };

  // Calculate NEET Score: +4 for correct, -1 for wrong, 0 for unattempted
  let totalScore = 0;
  let correctCount = 0;
  let wrongCount = 0;
  let unattemptedCount = 0;

  questions.forEach((q) => {
    const userAns = selectedAnswers[q.id];
    if (!userAns) {
      unattemptedCount++;
    } else if (userAns === q.correctKey) {
      totalScore += 4;
      correctCount++;
    } else {
      totalScore -= 1;
      wrongCount++;
    }
  });

  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-5 shadow-xl flex flex-col gap-5">
      {/* Quiz Header & Score Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-[#334155]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-pink-400">
              NEET Practice Test
            </span>
            <span className="text-[10px] bg-pink-500/10 text-pink-300 border border-pink-500/20 px-2 py-0.5 rounded-full font-bold">
              +4 / -1 Marking
            </span>
          </div>
          <h3 className="text-sm md:text-base font-bold text-slate-100 mt-1">
            5 High-Yield MCQs from: {videoTitle}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {Object.keys(selectedAnswers).length > 0 && (
            <div className="flex items-center gap-2 bg-[#0F172A] border border-[#334155] px-3 py-1.5 rounded-xl">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-slate-200">
                Score: <span className={totalScore >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{totalScore}</span> / 20
              </span>
            </div>
          )}
          <button
            onClick={() => {
              setSelectedAnswers({});
              setShowResults(false);
              onRefresh();
            }}
            className="p-2 rounded-xl bg-[#0F172A] hover:bg-[#334155] text-slate-300 hover:text-white border border-[#334155] transition-colors"
            title="Generate new practice questions"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-6">
        {questions.map((q, idx) => {
          const userChoice = selectedAnswers[q.id];
          const hasAnswered = !!userChoice;
          const isCorrect = userChoice === q.correctKey;

          return (
            <div
              key={q.id}
              className="bg-[#0F172A] border border-[#334155] rounded-xl p-4 transition-all"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-start gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-[#1E293B] border border-[#38BDF8]/40 text-[#38BDF8] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    Q{idx + 1}
                  </span>
                  <p className="text-xs md:text-sm font-semibold text-slate-100 leading-relaxed">
                    {q.question}
                  </p>
                </div>
                {q.year && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                    {q.year}
                  </span>
                )}
              </div>

              {/* Options A, B, C, D */}
              <div className="grid grid-cols-1 gap-2 mb-3">
                {q.options.map((opt) => {
                  const isThisSelected = userChoice === opt.key;
                  const isThisCorrect = opt.key === q.correctKey;

                  let optionStyles = 'bg-[#1E293B] border-[#334155] text-slate-300 hover:border-slate-500';

                  if (hasAnswered) {
                    if (isThisCorrect) {
                      optionStyles = 'bg-emerald-950/40 border-emerald-500 text-emerald-200 font-bold';
                    } else if (isThisSelected) {
                      optionStyles = 'bg-rose-950/40 border-rose-500 text-rose-200 font-bold';
                    } else {
                      optionStyles = 'bg-[#1E293B]/60 border-[#334155] text-slate-400 opacity-60';
                    }
                  } else if (isThisSelected) {
                    optionStyles = 'bg-[#38BDF8]/20 border-[#38BDF8] text-[#38BDF8]';
                  }

                  return (
                    <button
                      key={opt.key}
                      onClick={() => handleSelect(q.id, opt.key)}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left text-xs md:text-sm transition-all ${optionStyles}`}
                    >
                      <span className="w-6 h-6 rounded-lg bg-[#0F172A] border border-inherit font-bold text-xs flex items-center justify-center shrink-0">
                        {opt.key}
                      </span>
                      <span className="flex-1">{opt.text}</span>
                      {hasAnswered && isThisCorrect && (
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                      {hasAnswered && isThisSelected && !isThisCorrect && (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Real-time Feedback & NCERT Explanation */}
              {hasAnswered && (
                <div
                  className={`p-3 rounded-xl text-xs border ${
                    isCorrect
                      ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                      : 'bg-rose-950/30 border-rose-500/30 text-rose-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    {isCorrect ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Correct! (+4 Marks)</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                        <span>Incorrect (-1 Mark) • Correct Option is ({q.correctKey})</span>
                      </>
                    )}
                  </div>
                  <p className="text-slate-300 leading-relaxed mt-1">
                    <strong>NCERT Rationale:</strong> {q.explanation}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
