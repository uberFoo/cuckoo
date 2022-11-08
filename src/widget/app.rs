// use serde::{Deserialize, Serialize};
// use serde_wasm_bindgen::to_value;
use wasm_bindgen::prelude::*;
// use wasm_bindgen_futures::spawn_local;
use yew::prelude::*;

use crate::widget::paper::Paper;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = ["window", "__TAURI__", "tauri"])]
    async fn invoke(cmd: &str, args: JsValue) -> JsValue;

    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[derive(Default, PartialEq, Properties)]
pub struct AppProps {
    children: Children,
}

pub struct App;

// #[derive(Serialize, Deserialize)]
// struct GreetArgs<'a> {
//     name: &'a str,
// }

impl Component for App {
    type Message = ();
    type Properties = AppProps;

    fn create(_ctx: &Context<Self>) -> Self {
        Self
    }

    fn update(&mut self, _: &Context<Self>, _: Self::Message) -> bool {
        false
    }

    fn view(&self, _ctx: &Context<Self>) -> Html {
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

        html! {
            // <main class="container">
                // { &props.children }
                <Paper />
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
                //     <button type="button" onclick={greet} ref={&*button_ref}>{"Greet"}</button>
                // </div>

                // <p><b>{ &*greet_msg }</b></p>
            // </main>
        }
    }
}
