import React from 'react';
import { useAppSelector } from '../../app/hooks';

import { selectObjectById } from '../object/objectSlice';
import { Conditionality, Cardinality, BinaryUI, GlyphAnchor, Binary as BinaryStore } from '../../app/store';
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

    let id_from = `_${binary.id}:${fromObj!.id}:binary:${ui.from.dir}:from`;
    let id_to = `_${binary.id}:${toObj!.id}:binary:${ui.to.dir}:to`;
    let line_id = `_${binary.id}:${id_from}:${id_to}`;
    let name_id = `_${binary.id}:name`;

    let from_rotation = getRotation(ui.from.dir);
    let to_rotation = getRotation(ui.to.dir);

    let from_card = getGlyph(props.rel.from.cardinality);
    let to_card = getGlyph(props.rel.to.cardinality);

    let from_cond = getConditionality(props.rel.from.conditionality, ui.from.dir);
    let to_cond = getConditionality(props.rel.to.conditionality, ui.to.dir);

    let from_phrase = makeRelPhrase(`_${props.id}:from`, props.rel.from.description, ui.from.x,
        ui.from.y, ui.from.offset);
    let to_phrase = makeRelPhrase(`_${props.id}:to`, props.rel.to.description, ui.to.x, ui.to.y,
        ui.to.offset);

    let rel_num_offset = getRelPosition(ui.from, ui.to);

    return (
        <>
            {/* From g */}
            <g id={id_from} key={id_from} className={styles.relAnchor}
                transform={"translate(" + ui.from.x + "," + ui.from.y + ")" +
                    "rotate(" + from_rotation + ")"}
            >
                {/* This makes the arrows easier to drag. */}
                <rect className={styles.relBoxAssist} x={0} y={-25} width={50} height={50} />
                <path className={styles.relGlyph}
                    d={from_card} />
                {from_cond}
            </g>
            {from_phrase}
            {/* The 'to' g */}
            <g id={id_to} key={id_to} className={styles.relAnchor}
                transform={"translate(" + ui.to.x + "," + ui.to.y + ")" +
                    " rotate(" + to_rotation + ")"}
            >
                {/* This makes the arrows easier to drag. */}
                <rect className={styles.relBoxAssist} x={0} y={-25} width={50} height={50} />
                <path className={styles.relGlyph} d={to_card} />
                {to_cond}
            </g>
            {to_phrase}
            {/* The relationship number */}
            <text id={name_id} className={styles.relName} x={rel_num_offset.x}
                y={rel_num_offset.y}>{"R" + binary.number}</text>
            {/* The line. */}
            <path id={line_id} key={line_id} className={styles.relLine}
                d={makeLine(ui.from, ui.to)}
            />
            {/* This makes it possible to create an associated object relationship */}
            <path id={line_id} className={styles.relLineAssist}
                d={makeLine(ui.from, ui.to)}
            />
        </>
    );
};

// I don't really know the rules, I'm just hand editing positions like this until it looks good.
// I could just make them draggable...
let getRelPosition = (from: GlyphAnchor, to: GlyphAnchor) => {
    let x = (from.x + to.x) / 2;
    let y = (from.y + to.y) / 2;

    if (from.dir === 'South' && to.dir === 'South') {
        y += 35;
    } else if (from.dir === 'South' && to.dir === 'North') {
        x += 10;
    } else if (from.dir === 'North' && to.dir === 'North') {
        y -= 20;
    } else if (from.dir === 'East' && to.dir === 'North') {
        x += 25;
        y += 15;
    } else if (from.dir === 'West' && to.dir === 'North') {
        x -= 10;
        y += 15;
    } else if (from.dir === 'South' && to.dir === 'East') {
        x -= 10;
        y += 10;
    } else if (from.dir === 'South' && to.dir === 'West') {
        x -= 25;
    }

    return { x, y };
}

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

let getConditionality = (cond: Conditionality, dir: string) => {
    if (cond === 'Conditional') {
        switch (dir) {
            case 'North':
                return (
                    <g transform={"translate(40, 20) rotate(90)"}>
                        <text>c</text>
                    </g>
                );
            case 'West':
                return (
                    <g transform={"translate(40, 20) rotate(180)"}>
                        <text>c</text>
                    </g>
                );
            case 'South':
                return (
                    <g transform={"translate(40, 20) rotate(270)"}>
                        <text>c</text>
                    </g>
                );
            case 'East':
                return (
                    <g transform={"translate(40, 20) rotate(0)"}>
                        <text>c</text>
                    </g>
                );
            default:
                console.error('bad dir in getConditionality', dir);
                break;
        }
    } else if (cond === 'Unconditional') {
        return (<></>);
    }
}

let makeRelPhrase = (id: string, phrase: string, x: number, y: number, offset: { x: number, y: number }) => {
    return (
        <text id={id} key={id} className={styles.relPhrase} x={x + offset.x} y={y + offset.y} >
            {phrase}
        </ text >
    )
}