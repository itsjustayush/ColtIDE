import type * as Monaco from 'monaco-editor';

/**
 * Registers ghost-text inline completions for Colt in Monaco Editor
 * Triggers on CONNECT, DEFINE COLLECTION, DEFINE MELD, and FIND
 */
export function registerColtInlineCompletions(monaco: typeof Monaco): Monaco.IDisposable {
  return monaco.languages.registerInlineCompletionsProvider('colt', {
    provideInlineCompletions: async (model, position) => {
      const lineContent = model.getLineContent(position.lineNumber);
      const textUntilPosition = lineContent.substring(0, position.column - 1);
      const trimmedUntilPosition = textUntilPosition.trimEnd();

      const items: Monaco.languages.InlineCompletion[] = [];
      const range = new monaco.Range(
        position.lineNumber,
        position.column,
        position.lineNumber,
        position.column
      );

      // Helper to scan declared connection aliases in the document
      const fullText = model.getValue();
      const declaredAliases: string[] = [];
      const connectMatches = fullText.matchAll(/\bCONNECT\s+([a-zA-Z_]\w*)/gi);
      for (const m of connectMatches) {
        if (!declaredAliases.includes(m[1])) {
          declaredAliases.push(m[1]);
        }
      }

      // 1. Ghost text for CONNECT
      if (/\bCONNECT\s*$/i.test(trimmedUntilPosition)) {
        items.push(
          {
            insertText: 'main AS postgres(env("DATABASE_URL"))\nDEFAULT CONNECTION main',
            range,
          },
          {
            insertText: 'cache AS redis(env("REDIS_URL"))',
            range,
          },
          {
            insertText: 'notes AS mongodb(env("MONGO_URL"))',
            range,
          }
        );
      } else if (/\bCONNECT\s+[a-zA-Z_]\w*\s+AS\s*$/i.test(trimmedUntilPosition)) {
        items.push(
          { insertText: 'postgres(env("DATABASE_URL"))', range },
          { insertText: 'redis(env("REDIS_URL"))', range },
          { insertText: 'mongodb(env("MONGO_URL"))', range },
          { insertText: 'sqlite(env("SQLITE_PATH"))', range }
        );
      }

      // 2. Ghost text for DEFINE COLLECTION
      else if (/\bDEFINE\s+COLLECTION\s*$/i.test(trimmedUntilPosition)) {
        items.push(
          {
            insertText: 'items STRICT {\n  id: uuid @key,\n  title: text,\n  tags: list<text>,\n  created_at: time @default(now)\n}',
            range,
          },
          {
            insertText: 'reviews FLEXIBLE @backend(notes) {\n  id: uuid @key,\n  target_id: uuid,\n  comment: text,\n  metadata: doc\n}',
            range,
          },
          {
            insertText: 'sessions @backend(cache) @ttl(30m) {\n  id: text @key,\n  value: text\n}',
            range,
          }
        );
      }

      // 3. Ghost text for DEFINE MELD (All 3 kinds: LINK, SYNC, CONSTRAINT)
      else if (/\bDEFINE\s+MELD\s*$/i.test(trimmedUntilPosition)) {
        items.push(
          {
            insertText: 'book_reviews LINK reviews.book -> books.id',
            range,
          },
          {
            insertText: 'hot_books SYNC books TO cache KEY id TTL 10m',
            range,
          },
          {
            insertText: 'review_constraint CONSTRAINT reviews.book REFERENCES books.id MODE check_on_write',
            range,
          }
        );
      } else if (/\bDEFINE\s+MELD\s+[a-zA-Z_]\w*\s*$/i.test(trimmedUntilPosition)) {
        items.push(
          { insertText: ' LINK source.foreign_id -> target.id', range },
          { insertText: ' SYNC source TO cache KEY id TTL 15m', range },
          { insertText: ' CONSTRAINT source.fk REFERENCES target.id MODE check_on_write', range }
        );
      }

      // 4. Ghost text for FIND
      else if (/\bFIND\s*$/i.test(trimmedUntilPosition)) {
        items.push(
          {
            insertText: 'reviews FETCH book WHERE book.views > 10 LIMIT 20',
            range,
          },
          {
            insertText: 'books WHERE views > 0 ORDER BY views DESC LIMIT 10',
            range,
          }
        );
      }

      // 5. Ghost text for @backend(
      else if (/@backend\s*\(\s*$/i.test(trimmedUntilPosition)) {
        if (declaredAliases.length > 0) {
          for (const alias of declaredAliases) {
            items.push({ insertText: `${alias})`, range });
          }
        } else {
          items.push(
            { insertText: 'cache)', range },
            { insertText: 'notes)', range }
          );
        }
      }

      return {
        items,
      };
    },
    freeInlineCompletions: () => {},
  });
}
