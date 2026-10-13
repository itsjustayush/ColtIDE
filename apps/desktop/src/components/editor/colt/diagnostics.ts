import type * as Monaco from 'monaco-editor';

const KNOWN_ANNOTATIONS = new Set([
  'key', 'unique', 'default', 'index', 'ttl', 'storage', 'timeseries', 'backend', 'readonly',
]);

const RESERVED_KEYWORDS = [
  'LIVE', 'SAGA', 'POLICY', 'RELATE', 'EDGE', 'WINDOW', 'SINCE', 'NEAREST',
];

export interface ColtDiagnostic {
  code: string;
  message: string;
  startLine: number;
  startCol: number;
  endLine: number;
  endCol: number;
  severity: Monaco.MarkerSeverity;
}

/**
 * Validates Colt source code against ColtLang semantic rules
 * matching packages/compiler/src/semantic.ts
 */
export function validateColtSource(code: string, monaco: typeof Monaco): Monaco.editor.IMarkerData[] {
  const diagnostics: Monaco.editor.IMarkerData[] = [];
  const lines = code.split('\n');

  // Track connections across the entire file
  const connections = new Map<string, { engine: string; line: number; col: number }>();
  let hasDefaultConnection = false;
  let connectionCount = 0;

  // Track collection definitions
  let inCollection = false;
  let currentCollectionName = '';
  let collectionFields = new Map<string, number>(); // field name -> count
  let keyCount = 0;
  let collectionStartLine = 1;
  let collectionBackend: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Skip empty lines or full comments
    if (!line || line.startsWith('--') || line.startsWith('//') || line.startsWith('/*')) {
      continue;
    }

    // 1. Check for Reserved Keywords (COLT2003)
    for (const reserved of RESERVED_KEYWORDS) {
      const regex = new RegExp(`\\b${reserved}\\b`, 'i');
      const match = rawLine.match(regex);
      if (match && match.index !== undefined) {
        diagnostics.push({
          code: 'COLT2003',
          message: `COLT2003: Reserved construct '${match[0].toUpperCase()}' is planned for a later milestone.`,
          severity: monaco.MarkerSeverity.Warning,
          startLineNumber: lineNum,
          startColumn: match.index + 1,
          endLineNumber: lineNum,
          endColumn: match.index + 1 + match[0].length,
        });
      }
    }

    // 2. Validate CONNECT statement (COLT2022, COLT2023)
    const connectMatch = rawLine.match(/\bCONNECT\s+([a-zA-Z_]\w*)\s+AS\s+([a-zA-Z_]\w*)\s*\(([^)]*)\)/i);
    if (connectMatch && connectMatch.index !== undefined) {
      connectionCount++;
      const alias = connectMatch[1];
      const engine = connectMatch[2].toLowerCase();
      const arg = connectMatch[3].trim();

      // COLT2022: Duplicate connection alias
      if (connections.has(alias)) {
        const startCol = rawLine.indexOf(alias);
        diagnostics.push({
          code: 'COLT2022',
          message: `COLT2022: Duplicate connection alias '${alias}'. Connection aliases must be unique.`,
          severity: monaco.MarkerSeverity.Error,
          startLineNumber: lineNum,
          startColumn: startCol + 1,
          endLineNumber: lineNum,
          endColumn: startCol + 1 + alias.length,
        });
      } else {
        connections.set(alias, { engine, line: lineNum, col: connectMatch.index + 1 });
      }

      // COLT2023: Naked credential / literal URL check (must use env("VAR"))
      if (!arg.startsWith('env(') || !arg.endsWith(')')) {
        const argCol = rawLine.indexOf(arg);
        diagnostics.push({
          code: 'COLT2023',
          message: `COLT2023: Connection URLs must be specified via env("VAR"). Hardcoded credentials are prohibited.`,
          severity: monaco.MarkerSeverity.Error,
          startLineNumber: lineNum,
          startColumn: argCol + 1,
          endLineNumber: lineNum,
          endColumn: argCol + 1 + arg.length,
        });
      }
    }

    // 3. Check DEFAULT CONNECTION
    if (/\bDEFAULT\s+CONNECTION\s+([a-zA-Z_]\w*)/i.test(line)) {
      hasDefaultConnection = true;
    }

    // 4. Validate DEFINE COLLECTION start
    const defineColMatch = rawLine.match(/\bDEFINE\s+COLLECTION\s+([a-zA-Z_]\w*)(?:\s+(STRICT|FLEXIBLE))?/i);
    if (defineColMatch && defineColMatch.index !== undefined) {
      inCollection = true;
      currentCollectionName = defineColMatch[1];
      collectionFields = new Map();
      keyCount = 0;
      collectionStartLine = lineNum;

      // Check backend annotation on collection
      const backendMatch = rawLine.match(/@backend\s*\(\s*([a-zA-Z_]\w*)\s*\)/i);
      collectionBackend = backendMatch ? backendMatch[1] : null;

      // Check collection-level annotations (COLT2008)
      const annotMatches = rawLine.matchAll(/@([a-zA-Z_]\w*)/g);
      for (const m of annotMatches) {
        const annotName = m[1];
        if (!KNOWN_ANNOTATIONS.has(annotName)) {
          const col = (m.index ?? 0) + 1;
          diagnostics.push({
            code: 'COLT2008',
            message: `COLT2008: Unknown annotation @${annotName}.`,
            severity: monaco.MarkerSeverity.Error,
            startLineNumber: lineNum,
            startColumn: col,
            endLineNumber: lineNum,
            endColumn: col + m[0].length,
          });
        }
      }
    }

    // 5. Inside DEFINE COLLECTION body
    if (inCollection) {
      if (line === '}' || line.startsWith('}')) {
        // Ending collection - validate COLT2011 (exactly one @key field)
        if (keyCount !== 1) {
          diagnostics.push({
            code: 'COLT2011',
            message: `COLT2011: Collection '${currentCollectionName}' must declare exactly one @key field (found ${keyCount}).`,
            severity: monaco.MarkerSeverity.Error,
            startLineNumber: collectionStartLine,
            startColumn: 1,
            endLineNumber: collectionStartLine,
            endColumn: rawLine.length + 1,
          });
        }
        inCollection = false;
        currentCollectionName = '';
        continue;
      }

      // Check field line format: `<name>: <type> [annotations...]`
      const fieldMatch = rawLine.match(/^\s*([a-zA-Z_]\w*)\s*:\s*([^,{}]+)/);
      if (fieldMatch) {
        const fieldName = fieldMatch[1];
        const fieldRest = fieldMatch[2];
        const fieldCol = rawLine.indexOf(fieldName) + 1;

        // COLT2007: Duplicate field
        if (collectionFields.has(fieldName)) {
          diagnostics.push({
            code: 'COLT2007',
            message: `COLT2007: Duplicate field '${fieldName}' in collection '${currentCollectionName}'.`,
            severity: monaco.MarkerSeverity.Error,
            startLineNumber: lineNum,
            startColumn: fieldCol,
            endLineNumber: lineNum,
            endColumn: fieldCol + fieldName.length,
          });
        } else {
          collectionFields.set(fieldName, 1);
        }

        // Count @key
        if (/@key\b/.test(fieldRest)) {
          keyCount++;
        }

        // COLT2008 & COLT2009: Unknown & duplicate annotations on field
        const seenFieldAnnots = new Set<string>();
        const fieldAnnotMatches = fieldRest.matchAll(/@([a-zA-Z_]\w*)/g);
        for (const am of fieldAnnotMatches) {
          const aName = am[1];
          const aCol = rawLine.indexOf('@' + aName, fieldCol) + 1;

          if (!KNOWN_ANNOTATIONS.has(aName)) {
            diagnostics.push({
              code: 'COLT2008',
              message: `COLT2008: Unknown annotation @${aName}.`,
              severity: monaco.MarkerSeverity.Error,
              startLineNumber: lineNum,
              startColumn: aCol,
              endLineNumber: lineNum,
              endColumn: aCol + aName.length + 1,
            });
          }

          if (seenFieldAnnots.has(aName)) {
            diagnostics.push({
              code: 'COLT2009',
              message: `COLT2009: Duplicate annotation @${aName} on field '${fieldName}'.`,
              severity: monaco.MarkerSeverity.Error,
              startLineNumber: lineNum,
              startColumn: aCol,
              endLineNumber: lineNum,
              endColumn: aCol + aName.length + 1,
            });
          }
          seenFieldAnnots.add(aName);
        }

        // COLT2010: Vector dimension check (vector(N) where N <= 0)
        const vectorMatch = fieldRest.match(/vector\s*\(\s*(-?\d+)\s*\)/i);
        if (vectorMatch) {
          const dim = parseInt(vectorMatch[1], 10);
          if (isNaN(dim) || dim <= 0) {
            const vCol = rawLine.indexOf(vectorMatch[0]) + 1;
            diagnostics.push({
              code: 'COLT2010',
              message: `COLT2010: Vector dimensions must be a positive integer (got ${vectorMatch[1]}).`,
              severity: monaco.MarkerSeverity.Error,
              startLineNumber: lineNum,
              startColumn: vCol,
              endLineNumber: lineNum,
              endColumn: vCol + vectorMatch[0].length,
            });
          }
        }

        // COLT2026: Engine capability mismatch check (e.g. HNSW on Redis)
        if (/@index\s*\(\s*hnsw\s*\)/i.test(fieldRest)) {
          const activeEngine = collectionBackend ? connections.get(collectionBackend)?.engine : null;
          if (activeEngine === 'redis') {
            const idxCol = rawLine.indexOf('@index') + 1;
            diagnostics.push({
              code: 'COLT2026',
              message: `COLT2026: HNSW vector indexes are not supported on redis connection '${collectionBackend}'.`,
              severity: monaco.MarkerSeverity.Error,
              startLineNumber: lineNum,
              startColumn: idxCol,
              endLineNumber: lineNum,
              endColumn: idxCol + 13,
            });
          }
        }
      }
    }
  }

  // 6. COLT2024: Multiple connections without a DEFAULT CONNECTION
  if (connectionCount > 1 && !hasDefaultConnection) {
    diagnostics.push({
      code: 'COLT2024',
      message: `COLT2024: Multiple connections defined (${connectionCount}) but no DEFAULT CONNECTION specified.`,
      severity: monaco.MarkerSeverity.Warning,
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: 1,
      endColumn: 1,
    });
  }

  return diagnostics;
}

/**
 * Validates a Monaco text model and applies markers
 */
export function validateColtModel(monaco: typeof Monaco, model: Monaco.editor.ITextModel): void {
  const code = model.getValue();
  const markers = validateColtSource(code, monaco);
  monaco.editor.setModelMarkers(model, 'colt-validator', markers);
}
