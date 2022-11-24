import React from 'react';
import { useAppSelector } from '../../app/hooks';

import { selectObjectById } from '../object/objectSlice';
import { Isa as IsaStore, IsaUI } from '../../app/store';
import { makeTransform } from '../../app/utils';

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

    let id_from = `${props.id}:${fromObj!.id}:${ui.from.dir}:from`;
    let transform = makeTransform(ui.from.x, ui.from.y, ui.from.dir);

    let to_s = ui.to.map(s => {
        let id_to = `${props.id}:${s.id}:${s.dir}:to`;
        let transform = makeTransform(s.x, s.y, s.dir);
        return (
            <g id={id_to} key={id_to} className={styles.relAnchor} transform={transform}>
                <rect x={0} y={-25} width={50} height={50} fillOpacity={0} strokeOpacity={0} />
                <path className={styles.relGlyph} d="M 0 0 L 40 0" />
            </g>
        )
    });

    return (
        <>
            <g id={id_from} key={id_from} className={styles.relAnchor} transform={transform}>
                <rect x={0} y={-25} width={50} height={50} fillOpacity={0} strokeOpacity={0} />
                <path className={styles.relGlyph} d="M 20 0 L 40 0 M 20 -15 L 20 15 M 20 -15 L 0 0 L 20 15" />
            </g>
            {to_s}
        </>
    )
}
