import { FC, useEffect, useState } from 'react';
import { Sparkles, Terminal, Code2, Zap } from 'lucide-react';

const CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_#@<>/%*';
const TARGET_TEXT = 'COLTIDE';

export const DecryptText: FC<{ text?: string; speed?: number }> = ({
  text = TARGET_TEXT,
  speed = 40,
}) => {
  const [displayText, setDisplayText] = useState<string>('');
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    let iteration = 0;
    setIsDone(false);

    const interval = setInterval(() => {
      setDisplayText(() =>
        text
          .split('')
          .map((char, index) => {
            if (char === ' ') return ' ';
            if (index < iteration) {
              return text[index];
            }
            return CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
          })
          .join(''),
      );

      if (iteration >= text.length) {
        setIsDone(true);
        clearInterval(interval);
      }

      iteration += 1 / 3;
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span className="font-mono tracking-[0.16em] uppercase select-none">
      {displayText.slice(0, 4)}
      <span className="text-emerald-500 font-light dark:text-emerald-400">
        {displayText.slice(4)}
      </span>
      {!isDone && (
        <span className="inline-block w-2.5 h-6 ml-1 bg-emerald-500 animate-pulse align-middle" />
      )}
    </span>
  );
};

export const ColtIDELogo: FC = () => {
  return (
    <div className="flex flex-col items-center select-none text-center">
      {/* Sleek Emblem */}
      <div className="relative mb-5 flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-transparent border border-emerald-500/30 shadow-[0_12px_36px_-12px_rgba(16,185,129,0.3)] group transition-transform duration-300 hover:scale-105">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-8 h-8 text-emerald-500 transition-transform duration-300 group-hover:rotate-6"
        >
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
        <div className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/50">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
        </div>
      </div>

      {/* Brand Decrypt Header */}
      <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
        <DecryptText text="COLTIDE" />
      </h1>

      <p className="mt-2.5 text-xs font-mono tracking-[0.22em] uppercase text-muted-foreground/75">
        AI-First Native IDE for ColtLang
      </p>

      {/* Feature Badges */}
      <div className="mt-4 flex items-center gap-2.5 text-[11px] font-medium text-muted-foreground/90">
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-background/80 border border-border/70 shadow-sm">
          <Code2 className="w-3.5 h-3.5 text-emerald-500" />
          Monaco Editor
        </span>
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-background/80 border border-border/70 shadow-sm">
          <Terminal className="w-3.5 h-3.5 text-teal-500" />
          Interactive Terminal
        </span>
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-background/80 border border-border/70 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
          Integrated Agent
        </span>
      </div>
    </div>
  );
};


export const ColtIDEEmptyState: FC<{
  onPromptClick: (prompt: string) => void;
}> = ({ onPromptClick }) => {
  return (
    <div className="mx-auto w-full max-w-[56rem]">
      <div className="rounded-[28px] border border-border/70 bg-card/82 px-7 py-8 shadow-[0_28px_80px_-50px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1 text-[11px] font-medium text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
          ColtIDE Assistant
        </div>

        <h2 className="mt-5 text-[28px] font-semibold tracking-tight text-foreground">
          How can I help with your Colt workspace?
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Inspect source code, build declarative Colt workflows, troubleshoot errors, or manage git branches and terminals.
        </p>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <button
            onClick={() => onPromptClick('Analyze and format the current ColtLang source file')}
            className="rounded-[16px] border border-border/60 bg-background/72 p-4 text-left hover:border-emerald-500/40 hover:bg-card transition-all group"
          >
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 group-hover:scale-105 transition-transform">
              <Code2 className="h-4 w-4" />
            </div>
            <p className="text-xs font-semibold font-mono text-foreground">Analyze Colt Source</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Validate syntax, pragmas, and declarations</p>
          </button>

          <button
            onClick={() => onPromptClick('Generate a Colt query template with filters and sorting')}
            className="rounded-[16px] border border-border/60 bg-background/72 p-4 text-left hover:border-teal-500/40 hover:bg-card transition-all group"
          >
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-500 group-hover:scale-105 transition-transform">
              <Zap className="h-4 w-4" />
            </div>
            <p className="text-xs font-semibold font-mono text-foreground">Generate Query Template</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Create FIND, WHERE, and FETCH structures</p>
          </button>

          <button
            onClick={() => onPromptClick('Run a terminal build and test with the Colt toolchain')}
            className="rounded-[16px] border border-border/60 bg-background/72 p-4 text-left hover:border-cyan-500/40 hover:bg-card transition-all group"
          >
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-500 group-hover:scale-105 transition-transform">
              <Terminal className="h-4 w-4" />
            </div>
            <p className="text-xs font-semibold font-mono text-foreground">Toolchain & Execution</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Compile and execute in integrated terminal</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ColtIDELogo;
