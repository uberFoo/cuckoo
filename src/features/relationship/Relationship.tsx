import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';

import { Point } from '../../app/store';
import { selectRelationshipsById } from './relationshipSlice';
import { selectObjectById } from '../object/objectSlice';
import { Binary } from './Binary';

import styles from './Relationship.module.css';

interface RelationshipProps {
    id: string
    from: Point,
    to: Point,
    uberFoo: (e: React.MouseEvent) => void
}

export function Relationship(props: RelationshipProps) {
    let dispatch = useAppDispatch();

    let rel = useAppSelector((state) => selectRelationshipsById(state, props.id));

    let render = null;
    let id = undefined;
    console.assert(Object.keys(rel!).length === 1);
    switch (Object.keys(rel!)[0]) {
        case "Binary":
            render = Binary({ ...props, rel: rel! });
            // @ts-ignore
            id = rel!.Binary.id;
            break;
        case "Isa":
            break;
        case "Associative":
            break;

        default:
            console.error(`bad relationship type`);
            break;
    }

    return (
        <g id={id!} key={rel!.id} className={styles.relationship}>
            {render}
        </g>
    );
};