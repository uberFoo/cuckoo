use serde::{Deserialize, Serialize};
use serde_wasm_bindgen::to_value;
use wasm_bindgen::prelude::*;
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

#[function_component(App)]
pub fn app() -> Html {
    // let greet_input_ref = use_ref(|| NodeRef::default());
    // let button_ref = use_ref(|| NodeRef::default());

    // let name = use_state(|| String::new());

    // let greet_msg = use_state(|| String::new());
    // {
    //     let greet_msg = greet_msg.clone();
    //     let name = name.clone();
    //     let name2 = name.clone();
    //     use_effect_with_deps(
    //         move |_| {
    //             spawn_local(async move {
    //                 if name.is_empty() {
    //                     return;
    //                 }

    //                 // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
    //                 let new_msg =
    //                     invoke("greet", to_value(&GreetArgs { name: &*name }).unwrap()).await;
    //                 log(&new_msg.as_string().unwrap());
    //                 greet_msg.set(new_msg.as_string().unwrap());
    //             });

    //             || {}
    //         },
    //         name2,
    //     );
    // }

    // let greet = {
    //     let name = name.clone();
    //     let greet_input_ref = greet_input_ref.clone();
    //     Callback::from(move |_| {
    //         name.set(
    //             greet_input_ref
    //                 .cast::<web_sys::HtmlInputElement>()
    //                 .unwrap()
    //                 .value(),
    //         );
    //     })
    // };

    // let enter = {
    //     let button_ref = button_ref.clone();

    //     Callback::from(move |e: web_sys::KeyboardEvent| {
    //         let key = e.key();
    //         if key == "Enter" {
    //             if let Some(input) = button_ref.cast::<web_sys::HtmlButtonElement>() {
    //                 input.click();
    //             }
    //         }
    //     })
    // };

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
                <svg width="90%" height="80vh" xmlns="http://www.w3.org/2000/svg">
                // <svg width=1425 height=937 viewBox="0 0 1200 1200" xmlns="http://www.w3.org/2000/svg">
                    <rect width=3200 height=1600 class="paper-base"/>
                        <g transform="translate(-3300, -1600) scale(1.5)">
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
                                <rect x=0 y=0 width=100 height=100/>
                                <rect x=3100 y=1500 width=100 height=100/>
                            </g>
                        </g>
                </svg>
            </div>
            // <div class="row">
            //     <a href="https://tauri.app" target="_blank">
            //         <img src="public/tauri.svg" class="logo tauri" alt="Tauri logo"/>
            //     </a>
            //     <a href="https://yew.rs" target="_blank">
            //         <img src="public/yew.png" class="logo yew" alt="Yew logo"/>
            //     </a>
            // </div>

            // <p>{"Click on the Tauri and Yew logos to learn more."}</p>

            // <p>
            //     {"Recommended IDE setup: "}
            //     <a href="https://code.visualstudio.com/" target="_blank">{"VS Code"}</a>
            //     {" + "}
            //     <a href="https://github.com/tauri-apps/tauri-vscode" target="_blank">{"Tauri"}</a>
            //     {" + "}
            //     <a href="https://github.com/rust-lang/rust-analyzer" target="_blank">{"rust-analyzer"}</a>
            // </p>

            // <div class="row">
            //     <input id="greet-input" ref={&*greet_input_ref} onkeypress={enter} placeholder="Enter a name..." />
                // <button type="button" onclick={greet} ref={&*button_ref}>{"Greet"}</button>
            // </div>

            // <p><b>{ &*greet_msg }</b></p>
        </main>
    }
}
