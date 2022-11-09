use gloo::console::log;
use std::collections::HashMap;
use uuid::Uuid;
use wasm_bindgen::JsCast;
use yew::prelude::*;

use crate::widget::{object::ObjectWidget, Coord};

const PAPER_WIDTH: i32 = 6400;
const PAPER_HEIGHT: i32 = 3200;

#[derive(Debug, PartialEq)]
struct Object {
    start: Coord,
    end: Coord,
}

#[derive(Debug)]
pub struct MouseState {
    pos: Coord,
    enabled: bool,
}

#[derive(Debug)]
pub enum PaperMessage {
    Translate(Coord),
    TranslateObject((String, Coord)),
    MouseDown(Coord),
    MouseUp(Coord),
    MouseMove(Coord),
    None,
}

#[derive(PartialEq)]
pub struct Paper {
    paper_ref: NodeRef,
    nascent_object_id: String,
    drawing: bool,
    objects: HashMap<String, Object>,
    translate: Coord,
}

impl Component for Paper {
    type Message = PaperMessage;
    type Properties = ();

    fn create(_ctx: &Context<Self>) -> Self {
        Self {
            paper_ref: NodeRef::default(),
            nascent_object_id: String::new(),
            drawing: false,
            objects: HashMap::new(),
            translate: Coord { x: 0, y: 0 },
        }
    }

    fn update(&mut self, _: &Context<Self>, msg: Self::Message) -> bool {
        match msg {
            PaperMessage::MouseDown(c) => {
                self.drawing = true;

                let start = Coord {
                    x: c.x - self.translate.x,
                    y: c.y - self.translate.y,
                };
                let end = Coord {
                    x: c.x - self.translate.x,
                    y: c.y - self.translate.y,
                };

                let id = Uuid::new_v4().to_string();
                self.nascent_object_id = id.clone();
                self.objects.insert(id, Object { start, end });

                true
            }
            PaperMessage::MouseUp(c) => {
                self.drawing = false;
                if let Some(object) = self.objects.get_mut(&self.nascent_object_id) {
                    if object.end.x - object.start.x < 125 || object.end.y - object.start.y < 125 {
                        log!(format!(
                            "up {},{}",
                            object.end.x - object.start.x,
                            object.end.y - object.start.y
                        )
                        .as_str());
                        self.objects.remove(&self.nascent_object_id);
                    }
                }

                true
            }
            PaperMessage::MouseMove(c) => {
                if self.drawing {
                    if let Some(object) = self.objects.get_mut(&self.nascent_object_id) {
                        object.end.x += c.x - self.translate.x;
                        object.end.y += c.y - self.translate.y;

                        log!(format!(
                            "{},{}",
                            object.end.x - object.start.x,
                            object.end.y - object.start.y
                        )
                        .as_str());

                        true
                    } else {
                        panic!("bad stuff");
                    }
                } else {
                    false
                }
            }
            PaperMessage::None => false,
            PaperMessage::Translate(c) => {
                self.translate = c;

                true
            }
            PaperMessage::TranslateObject((id, c)) => {
                if let Some(object) = self.objects.get_mut(&id) {
                    object.start.x += c.x - self.translate.x;
                    object.start.y += c.y - self.translate.y;
                    object.end.x += c.x - self.translate.x;
                    object.end.y += c.y - self.translate.y;

                    true
                } else {
                    false
                }
            }
        }
    }

    fn view(&self, ctx: &Context<Self>) -> Html {
        let move_handler = {
            let link = ctx.link();

            let x = self.translate.x;
            let y = self.translate.y;
            let drawing = self.drawing;

            link.callback(move |e: web_sys::MouseEvent| {
                let svg = e
                    .target()
                    .expect("target")
                    .dyn_into::<web_sys::SvgElement>()
                    .expect("svg");

                // ⌘-click pans the paper
                if e.buttons() == 1 && svg.id() == "paper" && e.meta_key() {
                    PaperMessage::Translate(Coord {
                        x: x + e.movement_x(),
                        y: y + e.movement_y(),
                    })
                // Drawing an object
                } else if e.buttons() == 1 && drawing {
                    PaperMessage::MouseMove(Coord {
                        x: e.movement_x(),
                        y: e.movement_y(),
                    })
                // Move something
                } else if e.buttons() == 1 {
                    PaperMessage::TranslateObject((
                        svg.id(),
                        Coord {
                            x: x + e.movement_x(),
                            y: y + e.movement_y(),
                        },
                    ))
                } else {
                    PaperMessage::None
                }
            })
        };

        let down_handler = {
            let link = ctx.link();

            link.callback(move |e: web_sys::MouseEvent| {
                let svg = e
                    .target()
                    .expect("target")
                    .dyn_into::<web_sys::SvgElement>()
                    .expect("svgelement");
                if svg.id() == "paper" && !e.meta_key() {
                    PaperMessage::MouseDown(Coord {
                        x: e.client_x(),
                        y: e.client_y(),
                    })
                } else {
                    PaperMessage::None
                }
            })
        };

        let up_handler = {
            let link = ctx.link();
            let drawing = self.drawing;

            link.callback(move |e: web_sys::MouseEvent| {
                let svg = e
                    .target()
                    .expect("target")
                    .dyn_into::<web_sys::SvgElement>()
                    .expect("svgelement");

                if drawing && !e.meta_key() {
                    PaperMessage::MouseUp(Coord {
                        x: e.client_x(),
                        y: e.client_y(),
                    })
                } else {
                    PaperMessage::None
                }
            })
        };

        // This business is to draw the lines on the graph paper
        let mut x_nums = Vec::new();
        let mut it = 0..PAPER_WIDTH + 1;
        while let Some(i) = it.next() {
            x_nums.push(i);
            it.nth(23); // why 23? I'd have expected 24.
        }

        let mut y_nums = Vec::new();
        let mut it = 0..PAPER_HEIGHT + 1;
        while let Some(i) = it.next() {
            y_nums.push(i);
            it.nth(23);
        }

        let paper_width = PAPER_WIDTH.to_string();
        let paper_height = PAPER_HEIGHT.to_string();

        let transform = format!("translate({}, {})", self.translate.x, self.translate.y);
        html! {
            <div id="OIM">

                // <svg id="svg-root" width="90%" height="80vh" xmlns="http://www.w3.org/2000/svg">
                <svg id="svg-root" xmlns="http://www.w3.org/2000/svg">
                    <g id="baz" onmousemove={move_handler} onmousedown={down_handler} onmouseup={up_handler} pointer-events="all" ref={self.paper_ref.clone()} transform={ transform }>
                        <rect id="paper" pointer-events="all" width={ paper_width.clone() } height={ paper_height.clone() } class="paper-base"/>
                        <g class="y axis">
                            {
                                x_nums.into_iter().map(|i| {
                                    html!{<line x1={i.to_string()} y1=0 x2={i.to_string()} y2={ paper_height.clone() }/>}
                                }).collect::<Html>()
                            }
                        </g>
                        <g class="x axis">
                            {
                                y_nums.into_iter().map(|i| {
                                    html!{<line x1=0 y1={i.to_string()} x2={ paper_width.clone() } y2={i.to_string()}/>}
                                }).collect::<Html>()
                            }
                        </g>
                        <g id="canvas" pointer-events="all">
                            { self.objects.iter().map(|(i, c)| {
                                let x = c.start.x.to_string();
                                let y = c.start.y.to_string();
                                let width = (c.end.x - c.start.x).to_string();
                                let height = (c.end.y - c.start.y).to_string();
                                html! {
                                    <ObjectWidget id= { i.clone() } x={ x } y={ y } width={ width } height={ height }/>
                                }
                            }).collect::<Html>() }
                        </g>
                    </g>
                </svg>
            </div>
        }
    }
}
