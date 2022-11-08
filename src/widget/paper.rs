use wasm_bindgen::JsCast;
use yew::prelude::*;

use crate::widget::{log, object::ObjectWidget, Coord};

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
    objects: Vec<Object>,
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
            objects: Vec::new(),
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
                log(format!("new: ({:#?},{:#?})", self.down_at, c).as_str());
                let start = Coord {
                    x: self.down_at.x - self.translate.x,
                    y: self.down_at.y - self.translate.y,
                };
                let end = Coord {
                    x: c.x - self.translate.x,
                    y: c.y - self.translate.y,
                };
                self.objects.push(Object { start, end });
                self.drawing = false;

                true
            }
            PaperMessage::None => false,
            PaperMessage::Translate(c) => {
                self.translate = c;

                true
            }
        }
    }

    fn view(&self, ctx: &Context<Self>) -> Html {
        let move_handler = {
            let paper_ref = self.paper_ref.clone();
            let link = ctx.link();

            let x = self.translate.x;
            let y = self.translate.y;

            link.callback(move |e: web_sys::MouseEvent| {
                let shift: Option<()> = e
                    .target()
                    .and_then(|t| t.dyn_into::<web_sys::SvgElement>().ok())
                    .and_then(|svg| {
                        let mut shift = None;

                        if e.buttons() == 1 && svg.id() == "paper" {
                            // ⌘-click pans the paper
                            if e.meta_key() {
                                // svg is probably the `rect` that is the background. Maybe certainly.
                                // In either case we need to modify the root `g` element that contains
                                // the elements we are displaying.
                                // let root =
                                //     paper_ref.cast::<web_sys::SvgElement>().expect("oh shit");
                                // let transforms = root.get_attribute("transform").expect("oh shit");
                                // let transforms = transforms
                                //     .split(' ')
                                //     .map(|transform| {
                                //         if transform.contains("translate") {
                                //             let x: i32 = transform
                                //                 .split('(')
                                //                 .nth(1)
                                //                 .expect("oh shit")
                                //                 .split(',')
                                //                 .next()
                                //                 .expect("oh shit")
                                //                 .parse()
                                //                 .expect("oh shit");

                                //             let y: i32 = transform
                                //                 .split('(')
                                //                 .nth(1)
                                //                 .expect("oh shit")
                                //                 .split(',')
                                //                 .nth(1)
                                //                 .expect("oh shit")
                                //                 .split(')')
                                //                 .next()
                                //                 .expect("oh shit")
                                //                 .parse()
                                //                 .expect("oh shit");

                                //             format!(
                                //                 "translate({},{})",
                                //                 x + e.movement_x(),
                                //                 y + e.movement_y()
                                //             )
                                //         } else {
                                //             transform.to_owned()
                                //         }
                                //     })
                                //     .collect::<Vec<String>>()
                                //     .join(" ");

                                // root.set_attribute("transform", transforms.as_str())
                                //     .expect("oh shit");

                                shift = Some(());
                            } else {
                                // We are drawing something -- for now it's an object
                            }
                        }

                        shift
                    });

                if shift.is_some() {
                    PaperMessage::Translate(Coord {
                        x: x + e.movement_x(),
                        y: y + e.movement_y(),
                    })
                } else {
                    PaperMessage::None
                }
            })
        };

        let down_handler = {
            let link = ctx.link();

            // let enabled = self.down_at.0.is_some();

            link.callback(move |e: web_sys::MouseEvent| {
                let svg = e
                    .target()
                    .expect("target")
                    .dyn_into::<web_sys::SvgElement>()
                    .expect("svgelement");
                if svg.id() == "paper" && !e.meta_key() {
                    log(format!("down: ({}, {})", e.client_x(), e.client_y()).as_str());
                    // PaperMessage::MouseEvent(MouseState {
                    //     pos: Coord {
                    //         x: e.client_x(),
                    //         y: e.client_y(),
                    //     },
                    //     enabled: true,
                    // })
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
                    log(format!("up: ({}, {})", e.client_x(), e.client_y()).as_str());
                    PaperMessage::MouseUp(Coord {
                        x: e.client_x(),
                        y: e.client_y(),
                    })
                } else {
                    PaperMessage::None
                }
            })
        };

        let click = {
            let link = ctx.link();

            link.callback(move |e: web_sys::MouseEvent| {
                let _: Option<()> = e
                    .target()
                    .and_then(|t| t.dyn_into::<web_sys::SvgElement>().ok())
                    // Need the parent <g>, which can't receive mouse events.
                    .and_then(|svg| {
                        svg.parent_element()
                            .expect("oh shit")
                            .dyn_into::<web_sys::SvgElement>()
                            .ok()
                    })
                    .and_then(|svg| {
                        if e.buttons() == 1 {
                            let transform = svg.get_attribute("transform").expect("oh shit");
                            let x: i32 = transform
                                .split('(')
                                .nth(1)
                                .expect("oh shit")
                                .split(',')
                                .next()
                                .expect("oh shit")
                                .parse()
                                .expect("oh shit");

                            let y: i32 = transform
                                .split('(')
                                .nth(1)
                                .expect("oh shit")
                                .split(',')
                                .nth(1)
                                .expect("oh shit")
                                .split(')')
                                .next()
                                .expect("oh shit")
                                .parse()
                                .expect("oh shit");

                            let transform =
                                format!("translate({},{})", x + e.movement_x(), y + e.movement_y());
                            svg.set_attribute("transform", transform.as_str())
                                .expect("oh shit");
                        }

                        e.stop_propagation();
                        None
                    });

                PaperMessage::None

                // PaperMessage::MouseEvent(MouseState {
                //     pos: Coord {
                //         x: e.client_x(),
                //         y: e.client_y(),
                //     },
                //     enabled: false,
                // })
            })
        };

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

        let translate = format!("translate({}, {})", self.translate.x, self.translate.y);
        html! {
            <div id="OIM">
                // <svg id="svg-root" width="90%" height="80vh" xmlns="http://www.w3.org/2000/svg">
                <svg id="svg-root" xmlns="http://www.w3.org/2000/svg">
                    <g id="baz" onmousemove={move_handler} onmousedown={down_handler} onmouseup={up_handler} pointer-events="all" ref={self.paper_ref.clone()} transform={ translate }>
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
                            { self.objects.iter().map(|c| {
                                let x = c.start.x.to_string();
                                let y = c.start.y.to_string();
                                let width = (c.end.x - c.start.x).to_string();
                                let height = (c.end.y - c.start.y).to_string();
                                html! {
                                    <ObjectWidget x={ x } y={ y } width={ width } height={ height }/>
                                }
                            }).collect::<Html>() }
                        </g>
                    </g>
                </svg>
            </div>
        }
    }
}
