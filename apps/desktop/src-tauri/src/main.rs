//! ColtIDE - Native IDE for Colt and ColtaneDB
//! Entry point

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    colt_desktop_lib::run();
}
