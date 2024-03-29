import React from 'react';
import { useAppSelector } from '../../app/hooks';

import { selectObjectById } from '../object/objectSlice';
import { Isa as IsaStore, IsaUI } from '../../app/store';
import { makeLine, makeTransform } from '../../app/utils';

import styles from './Relationship.module.css';

interface IsaProps {
    id: string,
    ui: IsaUI,
    rel: IsaStore,
    d_str: string
}

export function Isa(props: IsaProps) {
    // @ts-ignore
    let ui = props.ui;

    let fromObj = useAppSelector((state) => selectObjectById(state, props.rel.obj_id));

    let id_from = `_${props.id}:${fromObj!.id}:isa:${ui.from.dir}:from`;
    let transform = makeTransform(ui.from.x, ui.from.y, ui.from.dir);

    let to_s = ui.to.map(s => {
        // This is relationship_id:subtype_id:direction:"to"
        let id_to = `_${props.id}:${s.id}:isa:${s.dir}:to`;
        let line_id = `_${props.id}:${s.id}`
        let transform = makeTransform(s.x, s.y, s.dir);
        return (
            <>
                <g id={id_to} key={id_to} className={styles.relAnchor} transform={transform}>
                    <rect className={styles.relBoxAssist} x={0} y={-25} width={50} height={50} />
                    <path className={styles.relGlyph} d="M 0 0 L 40 0" />
                </g>
                <path id={line_id} className={styles.relLine} d={makeLine(s, ui.from)} />
            </>
        )
    });

    return (
        <>
            <g id={id_from} key={id_from} className={styles.relAnchor} transform={transform}>
                <rect className={styles.relBoxAssist} x={0} y={-25} width={50} height={50} />
                <path className={styles.relGlyph}
                    d="M 20 0 L 40 0 M 20 -15 L 20 15 M 20 -15 L 0 0 L 20 15"
                />
                {makeName(props.rel.number, ui.from.dir)}
            </g>
            {to_s}
        </>
    )
}

// I'm hacking these to look better with no guide as to why. See Binary.tsx::getRelPosition.
let makeName = (number: number, dir: string) => {
    switch (dir) {
        case 'North':
            return (
                <g transform={"translate(40, 40) rotate(90)"}>
                    <text className={styles.relName}>{"R" + number}</text>
                </g>
            );
        case 'West':
            return (
                <g transform={"translate(40, 25) rotate(180)"}>
                    <text className={styles.relName}>{"R" + number}</text>
                </g>
            );
        case 'South':
            return (
                <g transform={"translate(40, 55) rotate(270)"}>
                    <text className={styles.relName}>{"R" + number}</text>
                </g>
            );
        case 'East':
            return (
                <g transform={"translate(40, 40) rotate(0)"}>
                    <text className={styles.relName}>{"R" + number}</text>
                </g>
            );
        default:
            console.error('bad dir in getConditionality', dir);
            break;
    }
}
