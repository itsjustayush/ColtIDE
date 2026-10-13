//! ColtIDE Desktop Library
//! Clean-room Native IDE for Colt and ColtaneDB by Ayush Bhattacharya

mod colt_commands;
mod fs_bridge;
mod git_bridge;
mod terminal_pty;

use fs_bridge::FsBridgeState;
use terminal_pty::TerminalState;

#[tauri::command]
fn ping() -> String {
    "pong".to_string()
}

pub fn run() {
    let _ = tracing_subscriber::fmt::try_init();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_notification::init())
        .manage(TerminalState::new())
        .manage(FsBridgeState::new())
        .invoke_handler(tauri::generate_handler![
            ping,
            // Colt & ColtaneDB commands
            colt_commands::colt_run_query,
            colt_commands::colt_get_catalog,
            colt_commands::colt_get_plan,
            // File system commands
            fs_bridge::open_folder_dialog,
            fs_bridge::set_workspace_root,
            fs_bridge::read_directory,
            fs_bridge::read_file,
            fs_bridge::write_file,
            // Git status commands
            git_bridge::git_get_status,
            // Terminal PTY commands
            terminal_pty::spawn_pty,
            terminal_pty::write_pty,
            terminal_pty::resize_pty,
            terminal_pty::kill_pty,
        ])
        .run(tauri::generate_context!())
        .expect("error while running ColtIDE desktop application");
}
