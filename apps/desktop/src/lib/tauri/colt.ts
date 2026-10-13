/**
 * Tauri IPC wrappers for ColtaneDB operations
 */

import { invoke } from '@tauri-apps/api/core';

export interface QueryResult {
  success: boolean;
  columns: string[];
  rows: Record<string, unknown>[];
  row_count: number;
  execution_time_ms: number;
  target_engine: string;
  plan_summary: string;
  error?: string | null;
}

export interface ConnectionInfo {
  alias: string;
  engine: string;
  env_var: string;
  is_default: boolean;
  status: string;
}

export interface CollectionInfo {
  name: string;
  backend: string;
  mode: string;
  fields_count: number;
}

export interface MeldInfo {
  name: string;
  kind: 'LINK' | 'SYNC' | 'CONSTRAINT';
  source: string;
  target: string;
  guarantee: string;
}

export interface ColtCatalog {
  connections: ConnectionInfo[];
  collections: CollectionInfo[];
  melds: MeldInfo[];
}

export interface PlanStep {
  step: number;
  engine: string;
  operation: string;
  target: string;
  consistency: string;
}

export interface ExecutionPlan {
  query: string;
  steps: PlanStep[];
  total_estimated_cost: string;
}

/**
 * Execute a Colt query across multi-engine connections
 */
export async function runColtQuery(query: string, connection?: string): Promise<QueryResult> {
  return invoke<QueryResult>('colt_run_query', { query, connection });
}

/**
 * Retrieve active ColtaneDB catalog (connections, collections, melds)
 */
export async function getColtCatalog(): Promise<ColtCatalog> {
  return invoke<ColtCatalog>('colt_get_catalog');
}

/**
 * Get the compiled multi-engine execution plan for a query
 */
export async function getColtPlan(query: string): Promise<ExecutionPlan> {
  return invoke<ExecutionPlan>('colt_get_plan', { query });
}
