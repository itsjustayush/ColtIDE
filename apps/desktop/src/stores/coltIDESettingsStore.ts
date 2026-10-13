/**
 * ColtIDE Settings Store — the disk-backed permission/mode config at
 * `<workspace>/.coltide/settings.json` (plus user + local overlays).
 *
 * This is distinct from `settingsStore.ts`, which holds UI preferences
 * (fonts, theme, editor settings) persisted to localStorage. This store
 * mirrors the Rust-owned settings file and subscribes to the backend's
 * `settings:changed` event so external edits (user hand-editing the JSON)
 * are reflected immediately.
 */

import { create } from 'zustand';

import { settingsLoad } from '../lib/backend';
import type {
	PermissionMode,
	PermissionsConfig,
	ColtIDESettings,
} from '../bindings';

const EMPTY_SETTINGS: ColtIDESettings = {
	permissions: {
		defaultMode: null,
		allow: [],
		deny: [],
		ask: [],
		additionalDirectories: [],
		disableAcceptMode: false,
	} as PermissionsConfig,
	modes: {
		debug: {
			reviewInterval: 3,
			initialGoalCapture: 'firstMessage',
		},
	},
	skills: {
		importClaudeUser: true,
		importClaudePlugins: true,
		importClaudeProject: true,
		importCodex: true,
		onboardingShown: false,
	},
	plugins: {
		adapterClaudePlugins: true,
		adapterCodexUser: true,
	},
	plannerNotes: '',
};

interface ColtIDESettingsState {
	/** Fully-merged settings (user → project → local). `null` until first load. */
	settings: ColtIDESettings | null;
	/** Workspace path the currently-loaded settings belong to. */
	workspace: string | null;
	/** True while an async load is in flight. */
	loading: boolean;
	/** Most recent load/save error, if any. */
	error: string | null;

	/** Load merged settings for a workspace. Replaces any prior load. */
	load: (workspace: string) => Promise<ColtIDESettings>;
	/** Apply settings pushed by the backend `settings:changed` event. */
	applyBackendUpdate: (settings: ColtIDESettings) => void;
	/** Reset the store (e.g. on workspace switch before loading the new one). */
	clear: () => void;
}

export const useColtIDESettingsStore = create<ColtIDESettingsState>()((set, get) => ({
	settings: null,
	workspace: null,
	loading: false,
	error: null,

	load: async (workspace: string) => {
		set({ loading: true, error: null });
		try {
			const merged = await settingsLoad(workspace);
			set({ settings: merged, workspace, loading: false });
			return merged;
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			set({ error: msg, loading: false });
			throw e;
		}
	},

	applyBackendUpdate: (settings: ColtIDESettings) => {
		// Only apply if workspace has been set — otherwise wait for the next explicit load.
		if (get().workspace) {
			set({ settings });
		}
	},

	clear: () => set({ settings: null, workspace: null, error: null, loading: false }),
}));

// =============================================================================
// Convenience selectors
// =============================================================================

/** Returns the fully-merged settings or an empty sentinel while loading. */
export const useColtIDESettings = (): ColtIDESettings =>
	useColtIDESettingsStore((s) => s.settings ?? EMPTY_SETTINGS);

/** Returns just the permissions slice. */
export const usePermissionsConfig = (): PermissionsConfig =>
	useColtIDESettingsStore((s) => (s.settings ?? EMPTY_SETTINGS).permissions);

/** The configured default mode for new sessions (falls back to 'default'). */
export const useDefaultPermissionMode = (): PermissionMode =>
	useColtIDESettingsStore(
		(s) => (s.settings?.permissions.defaultMode ?? 'default') as PermissionMode
	);

/** Debug-mode review interval (turns between check-ins). */
export const useDebugReviewInterval = (): number =>
	useColtIDESettingsStore((s) => s.settings?.modes.debug.reviewInterval ?? 3);
