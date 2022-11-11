import React from 'react';

import { ObjectStore, Extent } from '../../app/store';
import { selectObjectById } from './objectSlice';
import { useAppSelector } from '../../app/hooks';

import styles from './Object.module.css';

interface ObjectProps {
    id: string,
}

export function Object(props: ObjectProps) {
    let object: ObjectStore | undefined = useAppSelector((state) => selectObjectById(state, props.id));

    if (object) {
        return (
            <g id={object.id} className={"object"} transform={buildTransform(object.extent)}>
                <rect className={styles.objectRect} width={object.extent.width} height={object.extent.height} />
                <text className={styles.objectName} x={object.extent.width / 2} y={20}>{object.name}</text>
                <line className={styles.objectBisectLine} x1={0} y1={20 * 1.5} x2={object.extent.width} y2={20 * 1.5} />
            </g>
        );
    } else {
        return (
            < p > {"fubared"}</p >
        )
    }
}

function buildTransform(e: Extent) {
    return 'translate(' + e.x + ',' + e.y + ')'
}
