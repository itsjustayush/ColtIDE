//! Terminal PTY implementation for ColtIDE
//! Cross-platform pseudo-terminal management using `portable-pty`.

use portable_pty::{native_pty_system, Child, CommandBuilder, MasterPty, PtySize};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::io::{Read, Write};
use std::path::PathBuf;
use std::sync::{Arc, Mutex, RwLock};
use tauri::{AppHandle, Emitter, State};

#[derive(Serialize)]
pub struct SpawnResult {
    pub id: String,
    pub shell: String,
}

#[derive(Serialize, Clone)]
struct TerminalDataPayload {
    id: String,
    data: String,
}

#[derive(Serialize, Clone)]
struct TerminalExitPayload {
    id: String,
    code: Option<u32>,
}

#[derive(Serialize, Clone)]
#[serde(tag = "type", content = "payload")]
enum TerminalBackendEvent {
    #[serde(rename = "terminal:data")]
    Data(TerminalDataPayload),
    #[serde(rename = "terminal:exit")]
    Exit(TerminalExitPayload),
}

struct TerminalInstance {
    master: Box<dyn MasterPty + Send>,
    writer: Arc<Mutex<Box<dyn Write + Send>>>,
    child: Arc<Mutex<Box<dyn Child + Send + Sync>>>,
}

pub type TerminalsMap = Arc<RwLock<HashMap<String, TerminalInstance>>>;

pub struct TerminalState {
    pub terminals: TerminalsMap,
}

impl TerminalState {
    pub fn new() -> Self {
        Self {
            terminals: Arc::new(RwLock::new(HashMap::new())),
        }
    }
}

impl Default for TerminalState {
    fn default() -> Self {
        Self::new()
    }
}

fn detect_default_shell() -> (String, Vec<String>) {
    #[cfg(windows)]
    {
        // On Windows prefer PowerShell, fallback to cmd
        if let Ok(ps) = std::env::var("COMSPEC") {
            ("powershell.exe".to_string(), vec!["-NoLogo".to_string()])
        } else {
            ("cmd.exe".to_string(), vec![])
        }
    }
    #[cfg(not(windows))]
    {
        let shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/sh".to_string());
        (shell, vec![])
    }
}

#[tauri::command]
pub async fn spawn_pty(
    cwd: Option<String>,
    shell: Option<String>,
    cols: Option<u16>,
    rows: Option<u16>,
    env: Option<HashMap<String, String>>,
    state: State<'_, TerminalState>,
    app: AppHandle,
) -> Result<SpawnResult, String> {
    let pty_system = native_pty_system();
    let size = PtySize {
        rows: rows.unwrap_or(24),
        cols: cols.unwrap_or(80),
        pixel_width: 0,
        pixel_height: 0,
    };

    let pair = pty_system.openpty(size).map_err(|e| e.to_string())?;

    let (shell_cmd, default_args) = detect_default_shell();
    let cmd_name = shell.unwrap_or(shell_cmd);
    let mut cmd = CommandBuilder::new(&cmd_name);
    for arg in default_args {
        cmd.args(vec![arg]);
    }

    if let Some(dir) = cwd {
        cmd.cwd(PathBuf::from(dir));
    }

    if let Some(env_vars) = env {
        for (k, v) in env_vars {
            cmd.env(k, v);
        }
    }

    cmd.env("TERM", "xterm-256color");
    cmd.env("COLT_IDE", "1");

    let child = pair.slave.spawn_command(cmd).map_err(|e| e.to_string())?;
    drop(pair.slave);

    let reader = pair.master.try_clone_reader().map_err(|e| e.to_string())?;
    let writer = pair.master.take_writer().map_err(|e| e.to_string())?;

    let id = uuid::Uuid::new_v4().to_string();
    let child_arc = Arc::new(Mutex::new(child));
    let writer_arc = Arc::new(Mutex::new(writer));

    let instance = TerminalInstance {
        master: pair.master,
        writer: writer_arc,
        child: child_arc.clone(),
    };

    state
        .terminals
        .write()
        .map_err(|e| e.to_string())?
        .insert(id.clone(), instance);

    let id_clone = id.clone();
    let terminals_clone = state.terminals.clone();
    std::thread::Builder::new()
        .name(format!("colt-pty-{}", &id[..8]))
        .spawn(move || {
            read_loop(reader, &id_clone, &app, &child_arc, &terminals_clone);
        })
        .map_err(|e| e.to_string())?;

    Ok(SpawnResult {
        id,
        shell: cmd_name,
    })
}

#[tauri::command]
pub async fn write_pty(
    id: String,
    data: String,
    state: State<'_, TerminalState>,
) -> Result<(), String> {
    let terminals = state.terminals.read().map_err(|e| e.to_string())?;
    let instance = terminals.get(&id).ok_or_else(|| "Terminal not found".to_string())?;
    let mut writer = instance.writer.lock().map_err(|e| e.to_string())?;
    writer.write_all(data.as_bytes()).map_err(|e| e.to_string())?;
    writer.flush().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn resize_pty(
    id: String,
    cols: u16,
    rows: u16,
    state: State<'_, TerminalState>,
) -> Result<(), String> {
    let mut terminals = state.terminals.write().map_err(|e| e.to_string())?;
    let instance = terminals.get_mut(&id).ok_or_else(|| "Terminal not found".to_string())?;
    instance
        .master
        .resize(PtySize {
            rows,
            cols,
            pixel_width: 0,
            pixel_height: 0,
        })
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn kill_pty(id: String, state: State<'_, TerminalState>) -> Result<(), String> {
    let mut terminals = state.terminals.write().map_err(|e| e.to_string())?;
    if let Some(instance) = terminals.remove(&id) {
        if let Ok(mut child) = instance.child.lock() {
            let _ = child.kill();
        }
    }
    Ok(())
}

fn read_loop(
    mut reader: Box<dyn Read + Send>,
    id: &str,
    app: &AppHandle,
    child: &Arc<Mutex<Box<dyn Child + Send + Sync>>>,
    terminals: &TerminalsMap,
) {
    let mut buf = [0u8; 4096];
    loop {
        match reader.read(&mut buf) {
            Ok(0) | Err(_) => break,
            Ok(n) => {
                let data = String::from_utf8_lossy(&buf[..n]).to_string();
                let event = TerminalBackendEvent::Data(TerminalDataPayload {
                    id: id.to_string(),
                    data,
                });
                let _ = app.emit("terminal-event", &event);
            }
        }
    }

    let exit_code = child
        .lock()
        .ok()
        .and_then(|mut c| c.wait().ok())
        .map(|status| if status.success() { 0 } else { 1 });

    let exit_event = TerminalBackendEvent::Exit(TerminalExitPayload {
        id: id.to_string(),
        code: exit_code,
    });
    let _ = app.emit("terminal-event", &exit_event);

    if let Ok(mut map) = terminals.write() {
        map.remove(id);
    }
}
