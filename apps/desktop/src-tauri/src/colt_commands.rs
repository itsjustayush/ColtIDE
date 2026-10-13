//! Colt commands IPC wrapper delegating to colt-core

use colt_core::{ColtCatalog, ExecutionPlan, QueryResult};

#[tauri::command]
pub async fn colt_run_query(query: String, connection: Option<String>) -> Result<QueryResult, String> {
    colt_core::run_query(&query, connection.as_deref()).await
}

#[tauri::command]
pub async fn colt_get_catalog() -> Result<ColtCatalog, String> {
    Ok(colt_core::get_catalog())
}

#[tauri::command]
pub async fn colt_get_plan(query: String) -> Result<ExecutionPlan, String> {
    Ok(colt_core::get_plan(&query))
}
