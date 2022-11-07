use serde::{Deserialize, Serialize};
use serde_wasm_bindgen::to_value;
use wasm_bindgen::{prelude::*, JsCast};
use wasm_bindgen_futures::spawn_local;
use yew::prelude::*;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = ["window", "__TAURI__", "tauri"])]
    async fn invoke(cmd: &str, args: JsValue) -> JsValue;

    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

// #[derive(Serialize, Deserialize)]
// struct GreetArgs<'a> {
//     name: &'a str,
// }

// #[function_component(Paper)]
// pub fn paper() -> Html {

// }

#[derive(Debug)]
pub enum AppMessage {
    MousePosition(i32, i32),
    None,
}

pub struct App {
    paper_ref: NodeRef,
    last_x: Option<i32>,
    last_y: Option<i32>,
}

impl Component for App {
    type Message = AppMessage;
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
            AppMessage::MousePosition(x, y) => {
                self.last_x = Some(x);
                self.last_y = Some(y);

                // log(format!("{:#?} ({:#?},{:#?})", msg, self.last_x, self.last_y).as_str());
                true
            }
            AppMessage::None => false,
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

                AppMessage::MousePosition(
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

                AppMessage::MousePosition(
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
            <main class="container">
                <div id="OIM">
                    <svg onmousemove={drag} pointer-events="all" width="90%" height="80vh" xmlns="http://www.w3.org/2000/svg">
                        <rect id="paper" width=3200 height=1600 class="paper-base"/>
                            // <g ref={&*paper_ref} onmousedown={drag} transform="translate(-3500, -1600) scale(1.5)">
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
                                        <rect x=200 y=200 width=200 height=200 transform="translate(0,0)" pointer-events="all" fill-opacity="0"/>
                                        <rect id="r2" x=200 y=200 width=100 height=100 transform="translate(0,0)"/>
                                        <rect id="r3" x=300 y=300 width=100 height=100/>
                                    </g>
                                    <rect x=3100 y=1500 width=100 height=100/>
                                </g>
                            </g>
                    </svg>
                </div>
            </main>

        }
    }
}

// #[function_component(App)]
// pub fn app() -> Html {
//     // let greet_input_ref = use_ref(|| NodeRef::default());
//     // let button_ref = use_ref(|| NodeRef::default());

//     let paper_ref = use_ref(|| NodeRef::default());

//     // let name = use_state(|| String::new());

//     // let greet_msg = use_state(|| String::new());
//     // {
//     //     let greet_msg = greet_msg.clone();
//     //     let name = name.clone();
//     //     let name2 = name.clone();
//     //     use_effect_with_deps(
//     //         move |_| {
//     //             spawn_local(async move {
//     //                 if name.is_empty() {
//     //                     return;
//     //                 }

//     //                 // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
//     //                 let new_msg =
//     //                     invoke("greet", to_value(&GreetArgs { name: &*name }).unwrap()).await;
//     //                 log(&new_msg.as_string().unwrap());
//     //                 greet_msg.set(new_msg.as_string().unwrap());
//     //             });

//     //             || {}
//     //         },
//     //         name2,
//     //     );
//     // }

//     let drag = {
//         let paper_ref = paper_ref.clone();
//         let mut last_x: Option<i32> = None;
//         let mut last_y: Option<i32> = None;

//         Callback::from(move |e: web_sys::MouseEvent| {
//             e.target()
//                 .and_then(|t| t.dyn_into::<web_sys::SvgElement>().ok())
//                 .and_then(|svg| {
//                     let x = e.screen_x();
//                     let y = e.screen_y();

//                     if let Some(c) = last_x {
//                         let dx = c - x;
//                         // last_x = Some(x)
//                     } else {
//                         // last_x = Some(x)
//                     }

//                     if let Some(c) = last_y {
//                         let dy = c - y;
//                         // last_y = Some(y)
//                     } else {
//                         // last_y = Some(y)
//                     }

//                     log(format!(
//                         "{:#?}: ({},{}) ({})",
//                         svg.id(),
//                         e.screen_x(),
//                         e.screen_y(),
//                         e.buttons()
//                     )
//                     .as_str());

//                     if e.buttons() == 1 && svg.id() == "paper" {
//                         // svg is probably the `rect` that is the background. Maybe certainly. In
//                         // either case we need to modify the root `g` element that contains the
//                         // elements we are displaying.
//                         let root = paper_ref.cast::<web_sys::SvgElement>().unwrap();
//                         let attrs = root.get_attribute_names();
//                         // log(format!("{:#?}", attrs).as_str());
//                         let transforms = root.get_attribute("transform").unwrap();
//                         let transforms = transforms
//                             .split(' ')
//                             .map(|transform| {
//                                 if transform.contains("translate") {
//                                     let x: u16 = transform
//                                         .split('(')
//                                         .nth(1)
//                                         .unwrap()
//                                         .split(',')
//                                         .next()
//                                         .unwrap()
//                                         .parse()
//                                         .unwrap();

//                                     let y: u16 = transform
//                                         .split('(')
//                                         .nth(1)
//                                         .unwrap()
//                                         .split(',')
//                                         .nth(1)
//                                         .unwrap()
//                                         .split(')')
//                                         .next()
//                                         .unwrap()
//                                         .parse()
//                                         .unwrap();
//                                     log(format!("({},{})", x, y).as_str());
//                                     log(transform);
//                                     transform
//                                 } else {
//                                     transform
//                                 }
//                             })
//                             .collect::<Vec<&str>>();
//                         // log(transforms[0]);
//                     }
//                     Some(())
//                 });
//         })
//     };

//     let click = {
//         Callback::from(move |e: web_sys::MouseEvent| {
//             log("click");
//         })
//     };

//     // let greet = {
//     //     let name = name.clone();
//     //     let greet_input_ref = greet_input_ref.clone();
//     //     Callback::from(move |_| {
//     //         name.set(
//     //             greet_input_ref
//     //                 .cast::<web_sys::HtmlInputElement>()
//     //                 .unwrap()
//     //                 .value(),
//     //         );
//     //     })
//     // };

//     // let enter = {
//     //     let button_ref = button_ref.clone();

//     //     Callback::from(move |e: web_sys::KeyboardEvent| {
//     //         let key = e.key();
//     //         if key == "Enter" {
//     //             if let Some(input) = button_ref.cast::<web_sys::HtmlButtonElement>() {
//     //                 input.click();
//     //             }
//     //         }
//     //     })
//     // };

//     let mut x_nums = Vec::new();
//     let mut it = 0..3201;
//     while let Some(i) = it.next() {
//         x_nums.push(i);
//         it.nth(23); // why 23? I'd have expected 24.
//     }

//     let mut y_nums = Vec::new();
//     let mut it = 0..1601;
//     while let Some(i) = it.next() {
//         y_nums.push(i);
//         it.nth(23);
//     }

//     log("Hello World");

//     html! {
//         <main class="container">
//             <div id="OIM">
//                 <svg onmousemove={drag} pointer-events="all" width="90%" height="80vh" xmlns="http://www.w3.org/2000/svg">
//                     // <g onmousemove={drag} pointer-events="all"/>
//                     <rect id="paper" width=3200 height=1600 class="paper-base"/>
//                         // <g ref={&*paper_ref} onmousedown={drag} transform="translate(-3500, -1600) scale(1.5)">
//                         <g id="root g" ref={&*paper_ref} transform="translate(100,100) scale(1.5)">
//                             <g class="y axis">
//                                 {
//                                     x_nums.into_iter().map(|i| {
//                                         html!{<line x1={i.to_string()} y1=0 x2={i.to_string()} y2=1600/>}
//                                     }).collect::<Html>()
//                                 }
//                             </g>
//                             <g class="x axis">
//                                 {
//                                     y_nums.into_iter().map(|i| {
//                                         html!{<line x1=0 y1={i.to_string()} x2=3200 y2={i.to_string()}/>}
//                                     }).collect::<Html>()
//                                 }
//                             </g>
//                             <g id="canvas">
//                                 <rect id="r0" onmousedown={click.clone()} x=0 y=0 width=100 height=100/>
//                                 <rect id="r1" onmousedown={click.clone()} x=100 y=100 width=100 height=100/>
//                                 <g id="nested g" onmousedown={click}>
//                                     <rect id="r2" x=200 y=200 width=100 height=100/>
//                                     <rect id="r3" x=300 y=300 width=100 height=100/>
//                                 </g>
//                                 <rect x=3100 y=1500 width=100 height=100/>
//                             </g>
//                         </g>
//                 </svg>
//             </div>
//             // <div class="row">
//             //     <a href="https://tauri.app" target="_blank">
//             //         <img src="public/tauri.svg" class="logo tauri" alt="Tauri logo"/>
//             //     </a>
//             //     <a href="https://yew.rs" target="_blank">
//             //         <img src="public/yew.png" class="logo yew" alt="Yew logo"/>
//             //     </a>
//             // </div>

//             // <p>{"Click on the Tauri and Yew logos to learn more."}</p>

//             // <p>
//             //     {"Recommended IDE setup: "}
//             //     <a href="https://code.visualstudio.com/" target="_blank">{"VS Code"}</a>
//             //     {" + "}
//             //     <a href="https://github.com/tauri-apps/tauri-vscode" target="_blank">{"Tauri"}</a>
//             //     {" + "}
//             //     <a href="https://github.com/rust-lang/rust-analyzer" target="_blank">{"rust-analyzer"}</a>
//             // </p>

//             // <div class="row">
//             //     <input id="greet-input" ref={&*greet_input_ref} onkeypress={enter} placeholder="Enter a name..." />
//                 // <button type="button" onclick={greet} ref={&*button_ref}>{"Greet"}</button>
//             // </div>

//             // <p><b>{ &*greet_msg }</b></p>
//         </main>
//     }
// }
