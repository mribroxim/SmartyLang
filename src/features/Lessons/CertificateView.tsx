import React from 'react';
import { ArrowLeft, Award, Printer } from 'lucide-react';
import type { Level } from '../../lib/reading-logic';
import { loadCertificateMeta } from '../../lib/lessonProgress';
import type { ContentLang } from '../../lib/contentLang';

interface Props {
  level: Level;
  contentLang: ContentLang;
  studentName?: string;
  onBack: () => void;
}

export function CertificateView({ level, contentLang, studentName, onBack }: Props) {
  const meta = loadCertificateMeta(contentLang, level);
  const name = studentName || meta?.name || 'Student';
  const date = meta?.date ? new Date(meta.date) : new Date();

  return (
    <div className="max-w-[560px] lg:max-w-[880px] mx-auto py-8 px-4 lg:px-8 lg:py-14">
      <button
        onClick={onBack}
        className="mb-5 lg:mb-7 flex items-center gap-2 text-slate-500 hover:text-zinc-900 dark:hover:text-zinc-100 text-[14px] font-medium transition-colors print:hidden"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 md:p-8 lg:p-14 text-center lg:aspect-[1.5/1] lg:flex lg:flex-col lg:justify-center print:border-slate-300">
        <div className="lg:mx-auto lg:max-w-[640px]">
          <Award className="w-10 h-10 lg:w-12 lg:h-12 text-zinc-800 dark:text-zinc-100 mx-auto mb-3 lg:mb-5" />
          <p className="text-[10px] lg:text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2 lg:mb-4">
            Certificate of Completion
          </p>
          <h1 className="text-[22px] lg:text-[34px] font-serif font-black text-zinc-900 dark:text-zinc-50 mb-3 lg:mb-7 tracking-tight">
            Smarty English
          </h1>

          <div className="lg:border-y lg:border-slate-100 dark:lg:border-zinc-800 lg:py-7">
            <p className="text-[13px] lg:text-[14px] text-slate-500 mb-2">This certifies that</p>
            <p className="text-[18px] lg:text-[28px] font-serif font-bold text-zinc-900 dark:text-zinc-50 mb-4 lg:mb-5 tracking-tight">
              {name}
            </p>
            <p className="text-[13px] lg:text-[15px] text-slate-500 max-w-md lg:max-w-[520px] mx-auto leading-snug lg:leading-relaxed">
              has completed all <span className="font-bold text-zinc-900 dark:text-zinc-100">{level}</span> lessons
              with at least 80% on every exercise.
            </p>
          </div>

          <p className="text-[12px] font-mono text-slate-400 mt-5 lg:mt-7">
            {date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      <button
        onClick={() => window.print()}
        className="mt-4 lg:mt-6 w-full lg:w-auto lg:px-8 lg:mx-auto py-3 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 transition-colors hover:bg-black dark:hover:bg-white print:hidden"
      >
        <Printer className="w-4 h-4" /> Print / Save
      </button>
    </div>
  );
}
