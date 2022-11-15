#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri::{
    AboutMetadata, CustomMenuItem, Menu, MenuItem, Submenu, WindowBuilder, WindowMenuEvent, Wry,
};

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn main() {
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
            Menu::new().add_submenu(Submenu::new(
                "Export",
                Menu::new()
                    .add_item(CustomMenuItem::new(
                        "export_schema".to_owned(),
                        "Export Schema",
                    ))
                    .add_item(CustomMenuItem::new(
                        "export_model".to_owned(),
                        "Export Model",
                    )),
            )),
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
        "export_schema" => {
            println!("export schema");
        }
        "export_model" => {
            println!("export model");
        }
        _ => {}
    }
}
