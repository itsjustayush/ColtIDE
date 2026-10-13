import type * as Monaco from 'monaco-editor';

export const COLT_LANGUAGE_ID = 'colt';

export const coltLanguageConfiguration: Monaco.languages.LanguageConfiguration = {
  comments: {
    lineComment: '--',
    blockComment: ['/*', '*/'],
  },
  brackets: [
    ['{', '}'],
    ['[', ']'],
    ['(', ')'],
    ['<', '>'],
  ],
  autoClosingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '<', close: '>' },
    { open: '"', close: '"', notIn: ['string'] },
    { open: '/*', close: '*/', notIn: ['string', 'comment'] },
  ],
  surroundingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '<', close: '>' },
    { open: '"', close: '"' },
  ],
  folding: {
    markers: {
      start: new RegExp('^\\s*//\\s*#?region\\b'),
      end: new RegExp('^\\s*//\\s*#?endregion\\b'),
    },
  },
};

export const coltMonarchTokensProvider: Monaco.languages.IMonarchLanguage = {
  defaultToken: '',
  tokenPostfix: '.colt',
  ignoreCase: true,

  keywords: [
    // Declarations
    'CONNECT', 'AS', 'DEFAULT', 'CONNECTION', 'DEFINE', 'COLLECTION',
    'STRICT', 'FLEXIBLE', 'MELD', 'LINK', 'SYNC', 'CONSTRAINT',
    'REFERENCES', 'MODE',
    // Queries
    'FIND', 'SELECT', 'WHERE', 'ORDER', 'BY', 'ASC', 'DESC',
    'LIMIT', 'OFFSET', 'FETCH', 'LIVE', 'NEAREST', 'SINCE',
    'WINDOW', 'TO', 'KEY', 'TTL',
    // Mutations & Blocks
    'PUT', 'CREATE', 'DELETE', 'ATOMIC', 'SAGA', 'POLICY',
    'UPDATE', 'MERGE', 'SET', 'GET', 'RELATE', 'EDGE',
  ],

  engines: [
    'postgres', 'redis', 'mongodb', 'sqlite', 'libsql', 'firestore', 'd1',
  ],

  types: [
    'uuid', 'text', 'int', 'float', 'bool', 'time', 'duration',
    'doc', 'list', 'link', 'vector',
  ],

  builtins: [
    'env', 'now', 'count', 'sum', 'avg', 'min', 'max',
  ],

  constants: [
    'true', 'false', 'null',
  ],

  operators: [
    '==', '!=', '<=', '>=', '<', '>', '->', '=',
    '+', '-', '*', '/', '%', 'AND', 'OR', 'NOT',
  ],

  tokenizer: {
    root: [
      // Pragma
      [/^#colt\s+[0-9]+(\.[0-9]+)?/, 'keyword.control.directive'],

      // Comments
      [/--.*$/, 'comment'],
      [/\/\*/, 'comment', '@comment'],

      // Parameters ($name)
      [/\$[a-zA-Z_]\w*/, 'variable.parameter'],

      // Record ID (collection:key)
      [/\b([a-zA-Z_]\w*):([a-zA-Z0-9_\-]+)\b/, ['type', 'constant.other.record-key']],

      // Annotations (@key, @unique, etc.)
      [/@[a-zA-Z_]\w*(\.[a-zA-Z_]\w*)*/, 'annotation'],

      // Durations (30s, 10m, 2h, 1d)
      [/\b\d+(s|m|h|d)\b/, 'number.duration'],

      // Numbers
      [/\b\d+\.\d+([eE][-+]?\d+)?\b/, 'number.float'],
      [/\b0x[0-9a-fA-F]+\b/, 'number.hex'],
      [/\b\d+\b/, 'number'],

      // Strings
      [/"([^"\\]|\\.)*$/, 'string.invalid'],
      [/"/, 'string', '@string'],

      // Arrows and Operators
      [/->/, 'operator.arrow'],
      [/==|!=|<=|>=|<|>|=/, 'operator'],
      [/[+\-*/%]/, 'operator'],

      // Delimiters & Brackets
      [/[{}()[\]]/, '@brackets'],
      [/[;,.]/, 'delimiter'],

      // Identifiers & Keywords
      [/[a-zA-Z_]\w*/, {
        cases: {
          '@keywords': 'keyword',
          '@engines': 'support.class.engine',
          '@types': 'type',
          '@builtins': 'support.function',
          '@constants': 'constant',
          '@default': 'identifier',
        },
      }],
    ],

    comment: [
      [/[^/*]+/, 'comment'],
      [/\*\//, 'comment', '@pop'],
      [/[/*]/, 'comment'],
    ],

    string: [
      [/[^\\"]+/, 'string'],
      [/\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/, 'string.escape'],
      [/\\./, 'string.escape.invalid'],
      [/"/, 'string', '@pop'],
    ],
  },
};
