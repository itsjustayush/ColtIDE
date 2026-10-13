export interface ColtIDEPerfEntry {
  id: number;
  name: string;
  detail?: string;
  startedAt: number;
  handlerMs?: number;
  nextPaintMs?: number;
  settledMs?: number;
}

interface ColtIDEPerfGlobal {
  entries: ColtIDEPerfEntry[];
  start: (name: string, detail?: string) => ColtIDEPerfHandle;
  clear: () => void;
}

export interface ColtIDEPerfHandle {
  endHandler: () => void;
  settle: () => void;
}

declare global {
  interface Window {
    __coltidePerf?: ColtIDEPerfGlobal;
  }
}

const MAX_ENTRIES = 120;
let nextId = 1;

function getPerfGlobal(): ColtIDEPerfGlobal | null {
  if (typeof window === 'undefined' || typeof performance === 'undefined') {
    return null;
  }

  if (!window.__coltidePerf) {
    window.__coltidePerf = {
      entries: [],
      start,
      clear: () => {
        window.__coltidePerf?.entries.splice(0);
      },
    };
  }

  return window.__coltidePerf;
}

function pushEntry(entry: ColtIDEPerfEntry): void {
  const perf = getPerfGlobal();
  if (!perf) return;
  perf.entries.push(entry);
  if (perf.entries.length > MAX_ENTRIES) {
    perf.entries.splice(0, perf.entries.length - MAX_ENTRIES);
  }
}

function logEntry(entry: ColtIDEPerfEntry): void {
  if (!import.meta.env.DEV) return;
  const parts = [
    `${entry.name}${entry.detail ? `:${entry.detail}` : ''}`,
    entry.handlerMs !== undefined ? `handler ${entry.handlerMs.toFixed(1)}ms` : null,
    entry.nextPaintMs !== undefined ? `paint ${entry.nextPaintMs.toFixed(1)}ms` : null,
    entry.settledMs !== undefined ? `settled ${entry.settledMs.toFixed(1)}ms` : null,
  ].filter(Boolean);
  console.debug(`[coltide-perf] ${parts.join(' | ')}`);
}

export function start(name: string, detail?: string): ColtIDEPerfHandle {
  const startedAt = performance.now();
  const entry: ColtIDEPerfEntry = {
    id: nextId++,
    name,
    detail,
    startedAt,
  };
  pushEntry(entry);

  let handlerEnded = false;
  let settled = false;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      entry.nextPaintMs = performance.now() - startedAt;
      logEntry(entry);
    });
  });

  return {
    endHandler: () => {
      if (handlerEnded) return;
      handlerEnded = true;
      entry.handlerMs = performance.now() - startedAt;
      logEntry(entry);
    },
    settle: () => {
      if (settled) return;
      settled = true;
      entry.settledMs = performance.now() - startedAt;
      logEntry(entry);
    },
  };
}

export function trace(name: string, detail?: string): ColtIDEPerfHandle {
  return getPerfGlobal()?.start(name, detail) ?? start(name, detail);
}

export function settleAfterPaint(perf: ColtIDEPerfHandle): void {
  if (typeof requestAnimationFrame === 'undefined') {
    setTimeout(() => perf.settle(), 0);
    return;
  }
  requestAnimationFrame(() => {
    requestAnimationFrame(() => perf.settle());
  });
}

export function traceSync<T>(name: string, detail: string | undefined, fn: () => T): T {
  const perf = trace(name, detail);
  try {
    return fn();
  } finally {
    perf.endHandler();
    settleAfterPaint(perf);
  }
}
