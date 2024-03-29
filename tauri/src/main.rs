#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]
use std::{env::set_current_dir, path::PathBuf};

use clap::{command, value_parser, Arg};

use tauri::{AboutMetadata, CustomMenuItem, Menu, MenuItem, Submenu, WindowMenuEvent, Wry};

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn main() {
    let args = command!()
        .arg(
            Arg::new("working_directory")
                .required(false)
                .help("set working directory")
                .value_parser(value_parser!(PathBuf)),
        )
        .get_matches();

    // This isn't going to help me. I can't open files, so I need the debug
    // build to change the code. Sigh.
    if let Some(cwd) = args.get_one::<PathBuf>("working_directory") {
        set_current_dir(cwd).unwrap();
    }

    let menu = Menu::new()
        .add_submenu(Submenu::new(
            "Cuckoo",
            Menu::new()
                .add_native_item(MenuItem::About("Cuckoo".to_owned(), AboutMetadata::new()))
                .add_native_item(MenuItem::Separator)
                .add_native_item(MenuItem::Quit),
        ))
        .add_submenu(Submenu::new(
            "File",
            Menu::new()
                .add_item(
                    CustomMenuItem::new("save_model".to_owned(), "Save")
                        .accelerator("Cmd+s".to_owned()),
                )
                .add_item(CustomMenuItem::new("open_model".to_owned(), "Open Model").disabled())
                .add_native_item(MenuItem::Separator)
                .add_submenu(Submenu::new(
                    "Export",
                    Menu::new()
                        .add_item(CustomMenuItem::new(
                            "export_schema".to_owned(),
                            "Export Schema",
                        ))
                        .add_item(CustomMenuItem::new(
                            "export_model".to_owned(),
                            "Export Model with History",
                        )),
                )),
        ))
        .add_submenu(Submenu::new(
            "Edit",
            Menu::new()
                .add_native_item(MenuItem::Undo)
                .add_native_item(MenuItem::Redo)
                .add_native_item(MenuItem::Separator)
                .add_native_item(MenuItem::Cut)
                .add_native_item(MenuItem::Copy)
                .add_native_item(MenuItem::Paste),
        ))
        .add_submenu(Submenu::new(
            "Selection",
            Menu::new().add_native_item(MenuItem::SelectAll),
        ));

    tauri::Builder::default()
        .menu(menu)
        .on_menu_event(menu_handler)
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

pub fn menu_handler(event: WindowMenuEvent<Wry>) {
    match event.menu_item_id() {
        "open_model" => {
            let _ = event.window().emit("menu-event", "open-model-event");
        }
        "export_schema" => {
            let _ = event.window().emit("menu-event", "export-schema-event");
        }
        "export_model" => {
            let _ = event.window().emit("menu-event", "export-model-event");
        }
        "save_model" => {
            let _ = event.window().emit("menu-event", "save-model-event");
        }
        _ => {}
    }
}
