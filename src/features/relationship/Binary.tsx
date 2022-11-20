import React from 'react';
import { useAppSelector } from '../../app/hooks';

import { selectObjectById } from '../object/objectSlice';
import { BinaryEnd, Binary as BinaryStore } from '../../app/store';

import styles from './Relationship.module.css';

interface BinaryProps {
    id: string
    from: BinaryEnd,
    to: BinaryEnd,
    rel: BinaryStore,
    d_str: string
    // uberFoo: any
}

export function Binary(props: BinaryProps) {
    let binary = props.rel;

    let fromObj = useAppSelector((state) => selectObjectById(state, binary.from.obj_id));
    let toObj = useAppSelector((state) => selectObjectById(state, binary.to.obj_id));

    let id_from = `${binary.id}:${fromObj!.id}:from`;
    let id_to = `${binary.id}:${toObj!.id}:to`;
    let line_id = `${id_from}:${id_to}`

    let from_rotation = getRotation(props.from.dir);
    let to_rotation = getRotation(props.to.dir);

    return (
        <>
            <g id={id_from} key={id_from} className={styles.relAnchor}
                transform={"translate(" + props.from.x + "," + props.from.y + ")" +
                    "rotate(" + from_rotation + ")"}
            >
                {/* This makes the arrows easier to drag. */}
                <rect x={0} y={-25} width={50} height={50} fillOpacity={0} strokeOpacity={0} />
                <path className={styles.relGlyph} d={"M 20 -10 L 0 0 L 20 10 M 35 -10 L 15 0 L 35 10 M 0 0"} />
            </g>
            <g id={id_to} key={id_to} className={styles.relAnchor}
                transform={"translate(" + props.to.x + "," + props.to.y + ")" +
                    " rotate(" + to_rotation + ")"}
            >
                <rect x={0} y={-25} width={50} height={50} fillOpacity={0} strokeOpacity={0} />
                <path className={styles.relGlyph} d={"M 20 -10 L 0 0 L 20 10 M 0 0"} />
            </g>
            <text className={styles.relName} x={(props.to.x + props.from.x) / 2}
                y={(props.to.y + props.from.y) / 2}>{"R" + binary.number}</text>
            {/* Notice how we are relying on the output of our moving here, but above location
              * comes from props. Seems messy.
             */}
            <path id={line_id} className={styles.relLine}
                d={"M " + props.from.x + " " + props.from.y + " L " + props.to.x + " " + props.to.y}
            />
        </>
    );
};

let getRotation = (dir: string) => {
    switch (dir) {
        case 'North':
            return 270;
            break;
        case 'South':
            return 90;
            break;
        case 'East':
            return 0;
            break;
        case 'West':
            return 180

        default:
            console.error('bad direction');
            break;
    }
}