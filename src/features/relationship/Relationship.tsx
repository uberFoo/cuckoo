import React from 'react';
import { useAppSelector } from '../../app/hooks';

import { RelationshipUI, BinaryUI } from '../../app/store';
import { selectRelationshipsById } from './relationshipSlice';
import { Binary } from './Binary';
import { Isa } from './Isa';

import styles from './Relationship.module.css';

interface RelationshipProps {
    id: string,
    ui: RelationshipUI
}

export function Relationship(props: RelationshipProps) {
    let rel = useAppSelector((state) => selectRelationshipsById(state, props.id));

    let render = null;
    let id = undefined;
    console.assert(Object.keys(rel!).length === 1);
    switch (Object.keys(rel!)[0]) {
        case "Binary":
            // @ts-ignore
            render = Binary({ ...props, ui: props.ui.BinaryUI as BinaryUI, rel: rel!.Binary });
            // @ts-ignore
            id = rel!.Binary.id;
            break;

        case "Isa":
            // @ts-ignore
            render = Isa({ ...props, ui: props.ui.IsaUI as IsaUI, rel: rel!.Isa });
            // @ts-ignore
            id = rel!.Isa.id;
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