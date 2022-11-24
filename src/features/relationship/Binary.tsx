import React from 'react';
import { useAppSelector } from '../../app/hooks';

import { selectObjectById } from '../object/objectSlice';
import { Conditionality, Cardinality, BinaryUI, BinaryEnd, Binary as BinaryStore } from '../../app/store';
import { makeLine, getRotation } from '../../app/utils';

import styles from './Relationship.module.css';

interface BinaryProps {
    id: string,
    ui: BinaryUI,
    rel: BinaryStore,
}

export function Binary(props: BinaryProps) {
    let binary = props.rel;
    // @ts-ignore
    let ui = props.ui;

    let fromObj = useAppSelector((state) => selectObjectById(state, binary.from.obj_id));
    let toObj = useAppSelector((state) => selectObjectById(state, binary.to.obj_id));

    let id_from = `${binary.id}:${fromObj!.id}:${ui.from.dir}:from`;
    let id_to = `${binary.id}:${toObj!.id}:${ui.to.dir}:to`;
    let line_id = `${id_from}:${id_to}`

    let from_rotation = getRotation(ui.from.dir);
    let to_rotation = getRotation(ui.to.dir);

    let from_card = getGlyph(props.rel.from.cardinality);
    let to_card = getGlyph(props.rel.to.cardinality);

    let from_cond = getConditionality(props.rel.from.conditionality);
    let to_cond = getConditionality(props.rel.to.Conditionality);

    return (
        <>
            <g id={id_from} key={id_from} className={styles.relAnchor}
                transform={"translate(" + ui.from.x + "," + ui.from.y + ")" +
                    "rotate(" + from_rotation + ")"}
            >
                {/* This makes the arrows easier to drag. */}
                <rect x={0} y={-25} width={50} height={50} fillOpacity={0} strokeOpacity={0} />
                <path className={styles.relGlyph}
                    d={from_card} />
                {from_cond}
            </g>
            <g id={id_to} key={id_to} className={styles.relAnchor}
                transform={"translate(" + ui.to.x + "," + ui.to.y + ")" +
                    " rotate(" + to_rotation + ")"}
            >
                <rect x={0} y={-25} width={50} height={50} fillOpacity={0} strokeOpacity={0} />
                <path className={styles.relGlyph} d={to_card} />
                {to_cond}
            </g>
            <text className={styles.relName} x={(ui.to.x + ui.from.x) / 2}
                y={(ui.to.y + ui.from.y) / 2}>{"R" + binary.number}</text>
            <path id={line_id} className={styles.relLine}
                d={makeLine(ui.from, ui.to)}
            />
        </>
    );
};

let getGlyph = (card: Cardinality) => {
    switch (card) {
        case 'One':
            return "M 20 -10 L 0 0 L 20 10 M 0 0 L 40 0";
        case 'Many':
            return "M 20 -10 L 0 0 L 20 10 M 35 -10 L 15 0 L 35 10 M 0 0 L 40 0";

        default:
            console.error('bad card', card);
            break;
    }
}

let getConditionality = (cond: Conditionality) => {
    switch (cond) {
        case 'Conditional':
            return <text x={20} y={20}>c</text>
        case 'Unconditional':
            return (<></>)
    }
}