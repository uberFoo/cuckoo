use gloo::console::log;
use std::collections::HashMap;
use uuid::Uuid;
use wasm_bindgen::JsCast;
use yew::prelude::*;

use crate::widget::{object::ObjectWidget, Coord};

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
    None,
}

#[derive(PartialEq)]
pub struct Paper {
    paper_ref: NodeRef,
    // last_x: Option<i32>,
    // last_y: Option<i32>,
    down_at: Coord,
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
            // last_x: None,
            // last_y: None,
            down_at: Coord { x: 0, y: 0 },
            drawing: false,
            objects: HashMap::new(),
            translate: Coord { x: 0, y: 0 },
        }
    }

    fn update(&mut self, _: &Context<Self>, msg: Self::Message) -> bool {
        match msg {
            PaperMessage::MouseDown(c) => {
                self.down_at = c;
                self.drawing = true;

                true
            }
            PaperMessage::MouseUp(c) => {
                // Create a new -- something. For now Object.
                log!(format!("new: ({:#?},{:#?})", self.down_at, c).as_str());
                let start = Coord {
                    x: self.down_at.x - self.translate.x,
                    y: self.down_at.y - self.translate.y,
                };
                let end = Coord {
                    x: c.x - self.translate.x,
                    y: c.y - self.translate.y,
                };
                let id = Uuid::new_v4().to_string();
                self.objects.insert(id, Object { start, end });
                self.drawing = false;

                true
            }
            PaperMessage::None => {
                self.drawing = false;

                false
            }
            PaperMessage::Translate(c) => {
                self.drawing = false;
                self.translate = c;

                true
            }
            PaperMessage::TranslateObject((id, c)) => {
                self.drawing = false;

                if let Some(object) = self.objects.get_mut(&id) {
                    object.start.x += (c.x - self.translate.x);
                    object.start.y += (c.y - self.translate.y);
                    object.end.x += (c.x - self.translate.x);
                    object.end.y += (c.y - self.translate.y);

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
                    log!(format!("down: ({}, {})", e.client_x(), e.client_y()).as_str());

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

                if drawing && svg.id() == "paper" && !e.meta_key() {
                    log!(format!("up: ({}, {})", e.client_x(), e.client_y()).as_str());
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
        let mut it = 0..3201;
        while let Some(i) = it.next() {
            x_nums.push(i);
            it.nth(23); // why 23? I'd have expected 24.
        }

        let mut y_nums = Vec::new();
        let mut it = 0..1601;
        while let Some(i) = it.next() {
            y_nums.push(i);
            it.nth(23);
        }

        let transform = format!("translate({}, {})", self.translate.x, self.translate.y);
        html! {
            <div id="OIM">
                // <svg id="svg-root" width="90%" height="80vh" xmlns="http://www.w3.org/2000/svg">
                <svg id="svg-root" xmlns="http://www.w3.org/2000/svg">
                    <g id="baz" onmousemove={move_handler} onmousedown={down_handler} onmouseup={up_handler} pointer-events="all" ref={self.paper_ref.clone()} transform={ transform }>
                        <rect id="paper" pointer-events="all" width=3200 height=1600 class="paper-base"/>
                        <g class="y axis">
                            {
                                x_nums.into_iter().map(|i| {
                                    html!{<line x1={i.to_string()} y1=0 x2={i.to_string()} y2=1600/>}
                                }).collect::<Html>()
                            }
                        </g>
                        <g class="x axis">
                            {
                                y_nums.into_iter().map(|i| {
                                    html!{<line x1=0 y1={i.to_string()} x2=3200 y2={i.to_string()}/>}
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
