import type * as Monaco from 'monaco-editor';
import {
  COLT_LANGUAGE_ID,
  coltLanguageConfiguration,
  coltMonarchTokensProvider,
} from './monarch';
import { registerColtInlineCompletions } from './completions';
import { validateColtModel, validateColtSource } from './diagnostics';

let isColtRegistered = false;

/**
 * Registers the Colt language (Monarch tokenizer, language config, inline ghost-text completions)
 * with the Monaco editor instance.
 */
export function registerColtLanguage(monaco: typeof Monaco): void {
  if (isColtRegistered) {
    return;
  }

  // Register language ID
  monaco.languages.register({
    id: COLT_LANGUAGE_ID,
    extensions: ['.colt'],
    aliases: ['Colt', 'colt', 'ColtLang'],
    mimetypes: ['text/x-colt'],
  });

  // Register configuration (brackets, comments, pairs)
  monaco.languages.setLanguageConfiguration(COLT_LANGUAGE_ID, coltLanguageConfiguration);

  // Register Monarch tokenizer matching colt.tmLanguage.json
  monaco.languages.setMonarchTokensProvider(COLT_LANGUAGE_ID, coltMonarchTokensProvider);

  // Register deterministic ghost-text inline completions
  registerColtInlineCompletions(monaco);

  isColtRegistered = true;
}

export {
  COLT_LANGUAGE_ID,
  validateColtModel,
  validateColtSource,
};
