/**
 * Singleton settings stream listener.
 *
 * Listens for `settings:changed` backend events (emitted when any scope of
 * `.coltide/settings.json` is written via the Tauri API) and pushes the new
 * fully-merged settings into the coltIDESettingsStore.
 *
 * Follows the same pattern as useGitStream / useTerminalStream.
 */

import { useEffect } from 'react';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';

import type { BackendEvent } from '../bindings/BackendEvent';
import { useColtIDESettingsStore } from '../stores/coltIDESettingsStore';

export function useColtIDESettingsStream(): void {
  useEffect(() => {
    let cancelled = false;
    let unlisten: UnlistenFn | null = null;

    listen<BackendEvent>('backend-event', (event) => {
      const payload = event.payload;
      if (payload.type === 'settings:changed') {
        useColtIDESettingsStore.getState().applyBackendUpdate(payload.payload.settings);
      }
    })
      .then((fn) => {
        if (cancelled) {
          fn();
        } else {
          unlisten = fn;
        }
      })
      .catch((err) => {
        console.error('Failed to listen to settings events:', err);
      });

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, []);
}
