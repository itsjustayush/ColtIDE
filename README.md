# ColtIDE

<div align="center">

![ColtIDE Logo](https://raw.githubusercontent.com/itsjustayush/ColtIDE/master/apps/desktop/src-tauri/icons/icon.png)

### The Native Desktop IDE for ColtLang & ColtaneDB

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Built with Tauri](https://img.shields.io/badge/Tauri-2.0-24C8D8.svg?logo=tauri&logoColor=white)](https://tauri.app)
[![Powered by Rust](https://img.shields.io/badge/Rust-2021_Edition-orange.svg?logo=rust&logoColor=white)](https://www.rust-lang.org)
[![React 19](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Bun](https://img.shields.io/badge/Bun-1.1+-fbf0df.svg?logo=bun&logoColor=black)](https://bun.sh)

**ColtIDE** is an ultra-fast, local-first, native desktop development environment engineered specifically for the [Colt programming language](https://github.com/itsjustayush/ColtLang) and [ColtaneDB](https://coltanedb.io). Built with Rust, Tauri 2, and React 19, ColtIDE delivers near-instant startup, zero Electron memory bloat, and an integrated toolchain for writing, planning, and executing Colt queries.

[Features](#key-features) • [Architecture](#architecture--monorepo-layout) • [Getting Started](#getting-started) • [Tech Stack](#tech-stack) • [Development](#development-workflow) • [License](#license)

</div>

---

## Overview

Modern data-intensive systems and custom query languages demand high-performance developer tooling. Traditional web-wrapped IDEs consume gigabytes of RAM and introduce sluggish latency. 

**ColtIDE** solves this by pairing a lightweight, compiled Rust engine with a hardware-accelerated React 19 interface. Designed from the ground up for the ColtLang ecosystem:

- **ColtLang Native**: First-class support for `.colt` files, including custom syntax tokens, Monarch grammar, diagnostics, and catalog inspection.
- **Extreme Speed & Efficiency**: Native Rust core powered by Tauri 2 and Tokio, running with a tiny fraction of the memory footprint of Chromium/Electron-based IDEs.
- **Local-First & Offline**: All file parsing, AST generation, query planning, and workspace indexing happen 100% on your machine.
- **Unified Tooling**: Seamlessly unifies the code editor, interactive PTY terminals, Git worktrees, database schema explorer, and AI assistant into a single cohesive interface.

---

## Key Features

### 1. Monaco Code Editor for ColtLang
- Custom Monarch tokenizer and theme syntax highlighting for Colt declarations, statements, functions, and query blocks.
- Smart auto-indentation, bracket pair colorization, folding ranges, and symbol navigation.
- Integrated file breadcrumbs, minimap, multi-cursor editing, and quick command palette (`Ctrl+P` / `Cmd+P`).

### 2. Multi-Session PTY Terminal
- Built on `portable-pty` and `xterm.js` for true native pseudoterminal performance.
- Supports PowerShell, CMD, Bash, Zsh, and custom shells with full 24-bit ANSI truecolor support.
- Split panes, multiple concurrent terminal tabs, and session persistence.
- Automatic injection of `COLT_IDE=1` into child shell environments.

### 3. ColtaneDB & Query Engine Integration
- Direct integration with `colt-core` for query parsing, catalog inspection, and AST analysis.
- Live query plan visualization and execution profiling.
- Interactive schema explorer for tables, collections, indices, and views.

### 4. Native Git & Worktree Control
- Embedded Git tracking powered natively by `libgit2` via Rust.
- Real-time file change status, side-by-side visual diffs, staged hunk management, and branch switching.
- Isolated Git worktree management for multitasking across branches without switching working directories.

### 5. Workspace File Explorer & File Watcher
- Real-time filesystem synchronization powered by `colt-fs` and background notification threads.
- Inline file/folder creation, deletion, renaming, drag-and-drop reorganization, and system file explorer reveal.
- Multi-root project workspaces with fast fuzzy search.

### 6. ColtIDE Assistant
- Native AI co-pilot designed to inspect declarative Colt schemas, generate complex database queries, and explain plan optimizations.
- Multi-provider support (OpenAI, Anthropic Claude, Google Gemini, Ollama local models).
- Voice commands and hotkey-triggered developer actions.

---

## Architecture & Monorepo Layout

ColtIDE is structured as a modular workspace cleanly separating native systems logic from frontend rendering:

```
ColtIDE/
├── crates/
│   ├── colt-core/             # Language catalog, query planner, and execution models
│   └── colt-fs/               # Workspace filesystem tree traversal and file watcher
├── apps/
│   └── desktop/
│       ├── src-tauri/         # Native desktop backend (Tauri 2 commands, PTY, Git bridge)
│       │   ├── src/           # Command handlers, state management, and platform bridges
│       │   ├── Cargo.toml     # Tauri backend dependencies
│       │   └── tauri.conf.json# Window specifications, capabilities, and bundle config
│       └── src/               # React 19 frontend
│           ├── components/    # Editor, terminal, panels, settings, and sidebar components
│           ├── hooks/         # Custom React hooks (settings, appearance, workspace streams)
│           ├── lib/tauri/     # Type-safe TypeScript wrappers for Tauri IPC commands
│           └── stores/        # Zustand state stores (workspaces, editor, git, terminals)
├── packages/
│   └── ui/                    # Shared UI component library (@colt/ui)
├── docs/                      # Technical specifications, architecture docs, and release guides
└── .coltide/                  # Project workspace configs, skills, and plans
```

### IPC Bridge Pattern

Communication between the React frontend and the Rust backend follows a strict type-safe IPC model:

1. **Rust Tauri Commands**: Strongly typed Rust async functions exposed in `apps/desktop/src-tauri/src/` via `#[tauri::command]`.
2. **TypeScript IPC Wrappers**: Encapsulated wrappers in `apps/desktop/src/lib/tauri/` providing end-to-end type safety.
3. **Reactive Streaming Events**: Real-time events (such as PTY output streams, file watcher invalidations, and long-running query executions) stream from Rust to React over Tauri's event bus.

---

## Tech Stack

| Component | Technology | Description |
|---|---|---|
| **Desktop Shell** | [Tauri 2](https://tauri.app) | Lightweight, secure, multi-platform native windowing framework |
| **Native Backend** | [Rust](https://www.rust-lang.org) (2021) | Safe, high-concurrency engine powering core IDE infrastructure |
| **Frontend Framework** | [React 19](https://react.dev) | High-performance UI rendering with concurrent React features |
| **Language & Bundler** | [TypeScript](https://www.typescriptlang.org) + [Vite](https://vitejs.dev) | Rapid HMR, strict type checking, and optimized asset bundling |
| **Package Manager** | [Bun](https://bun.sh) | Lightning-fast JavaScript package management and scripting |
| **Code Editor** | [Monaco Editor](https://microsoft.github.io/monaco-editor/) | Desktop-class code editor engine customized for `.colt` syntax |
| **Terminal Emulator** | [xterm.js](https://xtermjs.org) + `portable-pty` | True cross-platform VT100 / xterm PTY terminal emulation |
| **Source Control** | `git2` (libgit2) | Native C-level Git repository manipulation and diffing |
| **State Management** | [Zustand 5](https://github.com/pmndrs/zustand) + Immer | Scalable, boilerplate-free state management |
| **Styling** | [Tailwind CSS](https://tailwindcss.com) | Modern, responsive dark/light theme design token system |

---

## Getting Started

### Prerequisites

Ensure you have the following installed on your development machine:

1. **Bun** >= 1.1:
   ```bash
   # Windows (PowerShell)
   powershell -c "irm bun.sh/install.ps1 | iex"

   # macOS / Linux
   curl -fsSL https://bun.sh/install | bash
   ```
2. **Rust** >= 1.77:
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```
   *Note for Windows users: Install the `stable-x86_64-pc-windows-gnu` toolchain via `rustup default stable-gnu` if MSVC build tools are not installed.*

3. **Node.js** >= 20 (for auxiliary toolchains)

---

## Development Workflow

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/itsjustayush/ColtIDE.git
cd ColtIDE

# Install workspace dependencies without running lifecycle build hooks
bun install --ignore-scripts
```

### 2. Verify Rust Crates

Verify that the core crates (`colt-core`, `colt-fs`) compile cleanly:

```bash
cargo check -p colt-core -p colt-fs
```

### 3. Run the Frontend (Web Dev Mode)

For rapid UI development, launch the Vite dev server with hot module reloading:

```bash
bun run dev
```

Visit `http://localhost:5173` in your browser.

### 4. Run the Full Native Desktop App

Launch the full Tauri desktop application with the native Rust backend connected:

```bash
bun run tauri dev
```

---

## Building for Production

To create an optimized, standalone native desktop executable / installer for your operating system:

```bash
# Build desktop production binary (exe / dmg / deb / appimage)
bun run tauri build
```

Compiled application bundles will be located in:
`apps/desktop/src-tauri/target/release/bundle/`

---

## Keyboard Shortcuts

| Shortcut (Win/Linux) | Shortcut (macOS) | Action |
|---|---|---|
| `Ctrl + P` | `Cmd + P` | Quick File Open / Palette |
| `Ctrl + \`` | `Cmd + \`` | Toggle Integrated Terminal |
| `Ctrl + B` | `Cmd + B` | Toggle Primary Sidebar |
| `Ctrl + S` | `Cmd + S` | Save Active File |
| `Ctrl + Shift + F` | `Cmd + Shift + F` | Global Project Search |
| `Ctrl + Shift + G` | `Cmd + Shift + G` | Open Source Control Panel |
| `Ctrl + ,` | `Cmd + ,` | Open Settings |

---

## Contributing

We welcome contributions to ColtIDE! To get started:

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/colt-lsp-completion`).
3. Commit your changes (`git commit -m 'feat: implement Colt LSP symbol completion'`).
4. Push to the branch (`git push origin feature/colt-lsp-completion`).
5. Open a Pull Request.

Please ensure that `cargo check -p colt-core -p colt-fs` and `bun run lint` pass before submitting your PR.

---

## Authors & Maintainers

- **Ayush Bhattacharya** - *Founder & Lead Architect* - [@itsjustayush](https://github.com/itsjustayush) - `ayush@coltanedb.io`
- **ColtaneDB Team** - [https://coltanedb.io](https://coltanedb.io)

---

## License

ColtIDE is licensed under the [MIT License](./LICENSE).
