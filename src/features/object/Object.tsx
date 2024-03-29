import React from 'react';

import {
    ObjectStore, RelationshipStore
} from '../../app/store';
import { selectObjectById, selectObjects } from './objectSlice';
import { Attribute } from '../attribute/Attribute';
import { useAppSelector } from '../../app/hooks';
import { selectRelationships } from '../relationship/relationshipSlice';
import { makeTransform } from '../../app/utils';

import styles from './Object.module.css';


const textHeight = 20;
const cornerSize = 14;

interface ObjectProps {
    id: string,
    x: number,
    y: number,
    width: number,
    height: number,
    origin: { x: number, y: number },
};

export function ObjectWidget(props: ObjectProps) {
    let objects = useAppSelector(state => selectObjects(state));
    let object: ObjectStore | undefined = useAppSelector((state) => selectObjectById(state, props.id));

    let attributeInstances = { ...object!.attributes };

    let relationships: Array<RelationshipStore> = useAppSelector((state) => selectRelationships(state));
    relationships.filter(r => {
        if (r !== undefined) {
            // @ts-ignore
            if (r.Binary !== undefined) {
                // @ts-ignore
                if (r.Binary.from.obj_id === props.id) {
                    return true;
                }
                // @ts-ignore
            } else if (r.Associative !== undefined) {
                // @ts-ignore
                if (r.Associative.from.obj_id === props.id) {
                    return true;
                }
            }
        }

        return false;
    }).map(r => {
        // Thsy removes the referrential attributes.
        return null;
        // @ts-ignore
        if (r.Binary !== undefined) {
            // @ts-ignore
            let obj = objects.filter(o => o.id === r.Binary.to.obj_id)[0];

            return {
                // @ts-ignore
                name: r.Binary.from.formalizing_attribute_name,
                // @ts-ignore
                id: r.Binary.id, is_ref: true,
                // @ts-ignore
                type: `&${obj.name} (R${r.Binary.number})`
            };
            // @ts-ignore
        } else if (r.Associative !== undefined) {
            // @ts-ignore
            let one_obj = objects.filter(o => o.id === r.Associative.one.obj_id)[0];

            // @ts-ignore
            let other_obj = objects.filter(o => o.id === r.Associative.other.obj_id)[0];

            return [
                {
                    // @ts-ignore
                    name: r.Associative.from.one_referential_attribute,
                    // @ts-ignore
                    id: r.Associative.one.obj_id, is_ref: true,
                    // @ts-ignore
                    type: `&${one_obj.name} (R${r.Associative.number})`
                },
                {
                    // @ts-ignore
                    name: r.Associative.from.other_referential_attribute,
                    // @ts-ignore
                    id: r.Associative.other.obj_id, is_ref: true,
                    // @ts-ignore
                    type: `&${other_obj.name} (R${r.Associative.number})`
                }
            ];
        }
        return null;
        // @ts-ignore
    }).flat().filter(r => r !== null).forEach(r => attributeInstances[r.id] = r);

    let attributeElements: Array<JSX.Element> = Object.keys(attributeInstances)
        .filter((id, _) => {
            let a = attributeInstances[id];
            return a!.name !== 'id';
        })
        .map((id, i) => {
            let a = attributeInstances[id];

            let is_ref = false;
            if (a!.is_ref !== undefined) {
                is_ref = a!.is_ref;
            }
            return <Attribute key={a!.id} id={a!.id} name={a!.name} type={a!.type} is_ref={is_ref} index={i} />
        });

    return (
        <>
            <g id={`_${props.id}`} key={props.id} className={"Object"}
                transform={makeTransform(props.x, props.y)}
            >
                <rect className={styles.objectRect} width={props.width} height={props.height} />
                <text className={styles.objectName} x={props.width / 2} y={textHeight}>
                    {/* {object!.name} &nbsp; ({object!.key_letter}) */}
                    {object!.name}
                </text>
                <line className={styles.objectBisectLine} x1={0} y1={textHeight * 1.5} x2={props.width}
                    y2={textHeight * 1.5}
                />
                <g className={"attrGroup"} transform={"translate(10," + textHeight * 2.5 + ")"}>
                    {attributeElements}
                </g>
                {/* These are for resizing */}
                {/* East */}
                <line id={"east"} className={`${styles.resize} ${styles.relAttach} ${styles.ewResize}`}
                    x1={props.width} y1={cornerSize} x2={props.width} y2={props.height - cornerSize} />
                {/* North */}
                <line id={"north"} className={`${styles.resize} ${styles.relAttach} ${styles.nsResize}`}
                    x1={cornerSize} y1={"0"} x2={props.width - cornerSize} y2={0} />
                {/* West */}
                <line id={"west"} className={`${styles.resize} ${styles.relAttach} ${styles.ewResize}`}
                    x1={0} y1={cornerSize} x2={0} y2={props.height - cornerSize} />
                {/* South */}
                <line id={"south"} className={`${styles.resize} ${styles.relAttach} ${styles.nsResize}`}
                    x1={cornerSize} y1={props.height} x2={props.width - cornerSize} y2={props.height} />
            </g >
        </>
    );
}