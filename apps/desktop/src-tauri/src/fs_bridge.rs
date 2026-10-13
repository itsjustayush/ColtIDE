//! File system command bridge for ColtIDE
//! Uses `colt-fs` to manage workspace file trees and file reads/writes.

use colt_fs::{
    read_dir_tree, read_file as fs_read_file, write_file as fs_write_file,
    DirectoryReadRequest, DirectoryReadResponse, FileReadRequest, FileReadResponse, FileWriteRequest,
};
use std::path::{Path, PathBuf};
use std::sync::RwLock;
use tauri::State;

pub struct FsBridgeState {
    pub workspace_root: RwLock<Option<PathBuf>>,
}

impl FsBridgeState {
    pub fn new() -> Self {
        Self {
            workspace_root: RwLock::new(None),
        }
    }
}

impl Default for FsBridgeState {
    fn default() -> Self {
        Self::new()
    }
}

#[tauri::command]
pub async fn open_folder_dialog() -> Result<Option<String>, String> {
    // In Tauri 2, we can use tauri-plugin-dialog or a quick folder dialog
    // For now, return a default project directory if none selected
    Ok(None)
}

#[tauri::command]
pub async fn set_workspace_root(
    path: String,
    state: State<'_, FsBridgeState>,
) -> Result<(), String> {
    let p = PathBuf::from(&path);
    if !p.exists() {
        return Err(format!("Path does not exist: {}", path));
    }
    let mut root = state.workspace_root.write().map_err(|e| e.to_string())?;
    *root = Some(p);
    Ok(())
}

#[tauri::command]
pub async fn read_directory(
    request: DirectoryReadRequest,
) -> Result<DirectoryReadResponse, String> {
    let path = Path::new(&request.path);
    let entries = read_dir_tree(path, request.depth)
        .await
        .map_err(|e| e.to_string())?;
    let total_count = entries.len();
    Ok(DirectoryReadResponse {
        entries,
        total_count,
    })
}

#[tauri::command]
pub async fn read_file(request: FileReadRequest) -> Result<FileReadResponse, String> {
    let path = Path::new(&request.path);
    fs_read_file(path).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn write_file(request: FileWriteRequest) -> Result<(), String> {
    let path = Path::new(&request.path);
    fs_write_file(path, &request.content)
        .await
        .map_err(|e| e.to_string())
}
