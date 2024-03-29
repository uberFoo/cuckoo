import React from 'react';

import { useAppSelector, useAppDispatch } from '../../app/hooks';
import { selectObjectById } from '../object/objectSlice';
import { selectRelationshipById, removeRelationship, updateRelationship } from '../relationship/relationshipSlice';
import { removeRelationshipFromPaper } from '../paper/paperSlice';
import { Conditionality, Cardinality, AssociativeUI, GlyphAnchor, Associative as AssociativeStore, Binary, Point } from '../../app/store';
import { makeLine, makeLineToPoint, getRotation, find_intersection } from '../../app/utils';

import styles from './Relationship.module.css';
import { realpath } from 'fs/promises';

interface AssociativeProps {
    id: string,
    ui: AssociativeUI,
    rel: AssociativeStore,
}

export function Associative(props: AssociativeProps) {
    let dispatch = useAppDispatch();

    let relationship = useAppSelector((state) => selectRelationshipById(state, props.id)) as AssociativeStore;

    let [bin_id, extra] = props.id.split('_');
    let binary = useAppSelector((state) => selectRelationshipById(state, bin_id)) as Binary;

    if (relationship)
        // @ts-ignore
        relationship = relationship.Associative;

    if (binary)
        // @ts-ignore
        binary = binary.Binary;

    if (extra === 'assoc' && relationship.one === null && binary) {
        // This is brand new, and we want to transfer as much as we can from the original relationship.
        relationship = { ...relationship, one: binary.from, other: { ...binary.to } };

        relationship.number = binary.number;

        // Remove the original, copied, binary from the store
        dispatch(removeRelationship({ id: bin_id, tag: 'uberFoo' }));
        // And don't forget to remove the binary from the paper
        dispatch(removeRelationshipFromPaper({ id: bin_id, tag: 'uberFoo' }));
        // Update the relationship?
        dispatch(updateRelationship({ id: relationship.id, tag: 'uberFoo' }));
    }

    // debugger;
    let assoc = props.rel;
    // @ts-ignore
    let ui = props.ui;

    let fromObj = useAppSelector((state) => selectObjectById(state, assoc.from.obj_id));
    // @ts-ignore
    let oneObj = useAppSelector((state) => selectObjectById(state, assoc.one.obj_id));
    // @ts-ignore
    let otherObj = useAppSelector((state) => selectObjectById(state, assoc.other.obj_id));

    if (oneObj === undefined || otherObj === undefined) {
        // The only explanation is that this get's called before the dialog, which copies
        // the ids we need. Just bail on rendering until it's sorted.
        return (<></>);
    }

    let id_from = `_${assoc.id}:${fromObj!.id}:assoc:${ui.middle.dir}:from`;
    let id_one = `_${assoc.id}:${oneObj!.id}:assoc:${ui.one.dir}:one`;
    let id_other = `_${assoc.id}:${otherObj!.id}:assoc:${ui.other.dir}:other`;
    let line_assoc_id = `_${assoc.id}:${id_from}`;
    let line_binary_id = `_${assoc.id}:${id_one}:${id_other}`;
    let name_id = `_${assoc.id}:name`;

    let middle_rotation = getRotation(ui.middle.dir);
    let one_rotation = getRotation(ui.one.dir);
    let other_rotation = getRotation(ui.other.dir);

    let from_card = getGlyph(props.rel.from.cardinality);
    // @ts-ignore
    let one_card = getGlyph(props.rel.other?.cardinality);
    // @ts-ignore
    let other_card = getGlyph(props.rel.one?.cardinality);

    // Relationship phrases and conditionality draw on the other side...
    // @ts-ignore
    let one_cond = getConditionality(props.rel.one?.conditionality, ui.other.dir);
    // @ts-ignore
    let other_cond = getConditionality(props.rel.other?.conditionality, ui.one.dir);

    // @ts-ignore
    let one_phrase = makeRelPhrase(`_${props.id}:from`, props.rel.one?.description, ui.other.x,
        ui.other.y, ui.other.offset);
    // @ts-ignore
    let other_phrase = makeRelPhrase(`_${props.id}:to`, props.rel.other?.description, ui.one.x, ui.one.y,
        ui.one.offset);

    let rel_num_offset = getRelPosition(ui.one, ui.other);

    let intersection = findIntersection(ui.middle, { x: ui.one.x, y: ui.one.y }, { x: ui.other.x, y: ui.other.y });
    if (intersection === undefined) {
        intersection = { x: 0, y: 0 };
    }

    return (
        <>
            {/* From g */}
            <g id={id_from} key={id_from} className={styles.relAnchor}
                transform={"translate(" + ui.middle.x + "," + ui.middle.y + ")" +
                    "rotate(" + middle_rotation + ")"}
            >
                {/* This makes the arrows easier to drag. */}
                <rect className={styles.relBoxAssist} x={0} y={-25} width={50} height={50} />
                <path className={styles.relGlyph}
                    d={from_card} />
            </g>
            {/* One g */}
            <g id={id_one} key={id_one} className={styles.relAnchor}
                transform={"translate(" + ui.one.x + "," + ui.one.y + ")" +
                    "rotate(" + one_rotation + ")"}
            >
                {/* This makes the arrows easier to drag. */}
                <rect className={styles.relBoxAssist} x={0} y={-25} width={50} height={50} />
                <path className={styles.relGlyph}
                    d={one_card} />
                {other_cond}
            </g>
            {other_phrase}
            {/* The 'to' g */}
            <g id={id_other} key={id_other} className={styles.relAnchor}
                transform={"translate(" + ui.other.x + "," + ui.other.y + ")" +
                    " rotate(" + other_rotation + ")"}
            >
                {/* This makes the arrows easier to drag. */}
                <rect className={styles.relBoxAssist} x={0} y={-25} width={50} height={50} />
                <path className={styles.relGlyph} d={other_card} />
                {one_cond}
            </g>
            {one_phrase}
            {/* The relationship number */}
            <text id={name_id} className={styles.relName} x={rel_num_offset.x}
                y={rel_num_offset.y}>{"R" + assoc.number}</text>
            {/* The from line. */}
            <path id={line_assoc_id} key={line_assoc_id} className={styles.relLine}
                d={makeLineToPoint(ui.middle, intersection)}
            />
            {/* The one-other line. */}
            <path id={line_binary_id} key={line_binary_id} className={styles.relLine}
                d={makeLine(ui.one, ui.other)}
            />
            {/* This makes it possible to create an associated object relationship */}
            <path id={line_binary_id} className={styles.relLineAssist}
                d={makeLine(ui.one, ui.other)}
            />
        </>
    );
};

let findIntersection = (from: GlyphAnchor, a: Point, b: Point) => {
    let dir = from.dir;
    switch (dir) {
        case 'North': {
            let from0 = { x: from.x, y: from.y };
            let from1 = { x: from.x, y: from.y - 1500 };
            return find_intersection(from0, from1, a, b);
        }
        case 'South': {
            let from0 = { x: from.x, y: from.y };
            let from1 = { x: from.x, y: from.y + 1500 };
            return find_intersection(from0, from1, a, b);
        }
        case 'East': {
            let from0 = { x: from.x, y: from.y };
            let from1 = { x: from.x + 1500, y: from.y };
            return find_intersection(from0, from1, a, b);
        }
        case 'West': {
            let from0 = { x: from.x, y: from.y };
            let from1 = { x: from.x - 1500, y: from.y };
            return find_intersection(from0, from1, a, b);
        }
    }
}

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