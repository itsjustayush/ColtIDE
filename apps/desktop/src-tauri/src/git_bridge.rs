//! Git operations bridge for ColtIDE using git2

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitRepoStatus {
    pub branch: Option<String>,
    pub is_clean: bool,
    pub ahead: usize,
    pub behind: usize,
    pub changed_count: usize,
}

#[tauri::command]
pub async fn git_get_status(cwd: Option<String>) -> Result<GitRepoStatus, String> {
    let repo_path = cwd.unwrap_or_else(|| ".".to_string());
    let repo = match git2::Repository::discover(&repo_path) {
        Ok(r) => r,
        Err(_) => {
            return Ok(GitRepoStatus {
                branch: Some("main".to_string()),
                is_clean: true,
                ahead: 0,
                behind: 0,
                changed_count: 0,
            });
        }
    };

    let branch = repo
        .head()
        .ok()
        .and_then(|h| h.shorthand().map(|s| s.to_string()))
        .unwrap_or_else(|| "main".to_string());

    let mut status_opts = git2::StatusOptions::new();
    status_opts.include_untracked(true);
    let statuses = repo.statuses(Some(&mut status_opts)).ok();
    let changed_count = statuses.map(|s| s.len()).unwrap_or(0);

    Ok(GitRepoStatus {
        branch: Some(branch),
        is_clean: changed_count == 0,
        ahead: 0,
        behind: 0,
        changed_count,
    })
}
