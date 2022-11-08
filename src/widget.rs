use wasm_bindgen::prelude::*;

pub mod app;
mod object;
mod paper;

// #[wasm_bindgen]
// extern "C" {
//     #[wasm_bindgen(js_namespace = console)]
//     fn log(s: &str);
// }

#[derive(Clone, Debug, PartialEq)]
pub struct Coord {
    x: i32,
    y: i32,
}

impl Coord {
    pub fn new(x: i32, y: i32) -> Self {
        Coord { x, y }
    }
}
