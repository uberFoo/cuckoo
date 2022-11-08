use uuid::Uuid;
use yew::{prelude::*, virtual_dom::AttrValue};

use crate::widget::{log, Coord};

#[derive(PartialEq)]
pub struct ObjectWidget {
    id: Uuid,
    name: String,
    key_letter: String,
}

#[derive(PartialEq, Properties)]
pub struct ObjectProps {
    pub x: AttrValue,
    pub y: AttrValue,
    pub width: AttrValue,
    pub height: AttrValue,
}

impl Component for ObjectWidget {
    type Message = ();
    type Properties = ObjectProps;

    fn create(_ctx: &Context<Self>) -> Self {
        Self {
            id: uuid::Uuid::new_v4(),
            name: "Object".to_string(),
            key_letter: "O".to_string(),
        }
    }

    fn update(&mut self, _: &Context<Self>, _: Self::Message) -> bool {
        false
    }

    fn view(&self, ctx: &Context<Self>) -> Html {
        let x = ctx.props().x.clone();
        let y = ctx.props().y.clone();
        let width = ctx.props().width.clone();
        let height = ctx.props().height.clone();
        let translate = format!("translate({},{})", ctx.props().x, ctx.props().y);
        let width_num: i32 = ctx.props().width.parse().expect("width");

        html! {
            <g id={ self.id.to_string() } class="object" title={ self.name.clone() }
                    transform={ translate } pointer-events="all">
                <rect class="object-rect" width={ width.clone() } height={ height.clone() } />
                <text class="object-name" x={ (width_num / 2).to_string() } y=20 >
                    { self.name.clone() }
                </text>
                <line class="object-bisect-line" x1=0 y1=30 x2={ width.clone() } y2=30 />
                <g class="attr-group" transform="translate(10, 50)">
                </g>
            </g>
        }
    }
}