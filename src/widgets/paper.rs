use wasm_bindgen::JsCast;
use yew::prelude::*;

#[derive(Debug)]
pub enum PaperMessage {
    MousePosition(i32, i32),
}

#[derive(PartialEq)]
pub struct Paper {
    paper_ref: NodeRef,
    last_x: Option<i32>,
    last_y: Option<i32>,
}

impl Component for Paper {
    type Message = PaperMessage;
    type Properties = ();

    fn create(_ctx: &Context<Self>) -> Self {
        Self {
            paper_ref: NodeRef::default(),
            last_x: None,
            last_y: None,
        }
    }

    fn update(&mut self, _: &Context<Self>, msg: Self::Message) -> bool {
        match msg {
            PaperMessage::MousePosition(x, y) => {
                self.last_x = Some(x);
                self.last_y = Some(y);

                true
            }
        }
    }

    fn view(&self, ctx: &Context<Self>) -> Html {
        let drag = {
            let paper_ref = self.paper_ref.clone();
            let link = ctx.link();

            let last_x = self.last_x;
            let last_y = self.last_y;

            link.callback(move |e: web_sys::MouseEvent| {
                let new_position: Option<(i32, i32)> = e
                    .target()
                    .and_then(|t| t.dyn_into::<web_sys::SvgElement>().ok())
                    .and_then(|svg| {
                        let x = e.screen_x();
                        let y = e.screen_y();

                        let mut dx = 0;
                        let mut dy = 0;

                        if let Some(i) = last_x {
                            dx = i - x;
                        } else {
                        }

                        if let Some(i) = last_y {
                            dy = i - y;
                        } else {
                        }

                        if e.buttons() == 1 && svg.id() == "paper" {
                            // svg is probably the `rect` that is the background. Maybe certainly.
                            // In either case we need to modify the root `g` element that contains
                            // the elements we are displaying.
                            let root = paper_ref.cast::<web_sys::SvgElement>().expect("oh shit");
                            let transforms = root.get_attribute("transform").expect("oh shit");
                            let transforms = transforms
                                .split(' ')
                                .map(|transform| {
                                    if transform.contains("translate") {
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

                                        format!("translate({},{})", x - dx, y - dy)
                                    } else {
                                        transform.to_owned()
                                    }
                                })
                                .collect::<Vec<String>>()
                                .join(" ");

                            root.set_attribute("transform", transforms.as_str())
                                .expect("oh shit");
                        }
                        Some((x, y))
                    });

                PaperMessage::MousePosition(
                    new_position.expect("oh shit").0,
                    new_position.expect("oh shit").1,
                )
            })
        };

        let click = {
            let link = ctx.link();

            let last_x = self.last_x;
            let last_y = self.last_y;

            link.callback(move |e: web_sys::MouseEvent| {
                let new_position: Option<(i32, i32)> = e
                    .target()
                    .and_then(|t| t.dyn_into::<web_sys::SvgElement>().ok())
                    .and_then(|svg| {
                        let x = e.screen_x();
                        let y = e.screen_y();

                        let mut dx = 0;
                        let mut dy = 0;

                        if let Some(i) = last_x {
                            dx = i - x;
                        } else {
                        }

                        if let Some(i) = last_y {
                            dy = i - y;
                        } else {
                        }

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

                            let transform = format!("translate({},{})", x - dx, y - dy);
                            svg.set_attribute("transform", transform.as_str())
                                .expect("oh shit");
                        }
                        Some((x, y))
                    });

                PaperMessage::MousePosition(
                    new_position.expect("oh shit").0,
                    new_position.expect("oh shit").1,
                )
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

        html! {
            <div id="OIM">
                <svg onmousemove={drag} pointer-events="all" width="90%" height="80vh" xmlns="http://www.w3.org/2000/svg">
                    <rect id="paper" width=3200 height=1600 class="paper-base"/>
                        <g id="root g" ref={self.paper_ref.clone()} transform="translate(100,100) scale(1.5)">
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
                        <g id="canvas">
                            <rect id="r0" x=0 y=0 width=100 height=100/>
                            <rect id="r1" x=100 y=100 width=100 height=100/>
                            <g id="nested g" pointer-events="all" onmousemove={click.clone()} transform="translate(0,0)">
                                <rect id="r2" x=200 y=200 width=100 height=100/>
                                <rect id="r3" x=300 y=300 width=100 height=100/>
                            </g>
                            <rect x=3100 y=1500 width=100 height=100/>
                        </g>
                    </g>
                </svg>
            </div>
        }
    }
}
