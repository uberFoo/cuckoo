import React from 'react';
import { useAppSelector } from '../../app/hooks';

import { RelationshipUI, BinaryUI } from '../../app/store';
import { selectRelationshipById } from './relationshipSlice';
import { Binary } from './Binary';
import { Isa } from './Isa';
import { Associative } from './Associative';

import styles from './Relationship.module.css';

interface RelationshipProps {
    id: string,
    ui: RelationshipUI
}

export function Relationship(props: RelationshipProps) {
    let rel = useAppSelector((state) => selectRelationshipById(state, props.id));

    // This happen when we add an Assoc, which hijacks a binary. React doesn't like this.
    if (rel === undefined) {
        return;
    }

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
            // @ts-ignore
            render = Associative({ ...props, ui: props.ui.AssociativeUI as AsociativeUI, rel: rel!.Associative });
            // @ts-ignore
            id = rel!.Associative.id;
            break;

        default:
            console.error(`bad relationship type`);
            break;
    }

    return (
        <g id={"_" + id!} key={rel!.id} className={styles.relationship}>
            {render}
        </g>
    );
};