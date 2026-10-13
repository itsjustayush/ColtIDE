//! ColtFS - Clean filesystem operations and file tree builder for ColtIDE

use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileTreeEntry {
    pub name: String,
    pub path: String,
    pub is_directory: bool,
    pub size: Option<u64>,
    pub children: Option<Vec<FileTreeEntry>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DirectoryReadRequest {
    pub path: String,
    pub depth: u32,
    pub include_total_count: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DirectoryReadResponse {
    pub entries: Vec<FileTreeEntry>,
    pub total_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileReadRequest {
    pub path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileReadResponse {
    pub content: String,
    pub size: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileWriteRequest {
    pub path: String,
    pub content: String,
}

pub async fn read_dir_tree(path: &Path, depth: u32) -> std::io::Result<Vec<FileTreeEntry>> {
    let mut entries = Vec::new();
    let mut dir = tokio::fs::read_dir(path).await?;

    while let Some(entry) = dir.next_entry().await? {
        let file_type = entry.file_type().await?;
        let entry_path = entry.path();
        let name = entry.file_name().to_string_lossy().to_string();

        // Skip hidden dotfiles like .git, node_modules by default
        if name == ".git" || name == "node_modules" || name == "target" {
            continue;
        }

        let is_dir = file_type.is_dir();
        let size = if is_dir {
            None
        } else {
            entry.metadata().await.ok().map(|m| m.len())
        };

        let children = if is_dir && depth > 1 {
            Some(Box::pin(read_dir_tree(&entry_path, depth - 1)).await?)
        } else {
            None
        };

        entries.push(FileTreeEntry {
            name,
            path: entry_path.to_string_lossy().to_string(),
            is_directory: is_dir,
            size,
            children,
        });
    }

    entries.sort_by(|a, b| {
        match (a.is_directory, b.is_directory) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
        }
    });

    Ok(entries)
}

pub async fn read_file(path: &Path) -> std::io::Result<FileReadResponse> {
    let content = tokio::fs::read_to_string(path).await?;
    let size = content.len() as u64;
    Ok(FileReadResponse { content, size })
}

pub async fn write_file(path: &Path, content: &str) -> std::io::Result<()> {
    if let Some(parent) = path.parent() {
        tokio::fs::create_dir_all(parent).await?;
    }
    tokio::fs::write(path, content).await?;
    Ok(())
}
