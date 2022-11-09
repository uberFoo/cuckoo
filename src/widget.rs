pub mod paper;

#[derive(Clone, Debug)]
pub struct Coord {
    x: i32,
    y: i32,
}

impl Coord {
    pub fn new(x: i32, y: i32) -> Self {
        Coord { x, y }
    }
}
