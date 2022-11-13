import React from 'react';

import { selectAttributeById } from './attributeSlice';
import { selectObjectById } from '../object/objectSlice';
import { getAttributeType, useAppSelector } from '../../app/hooks';
import { AttributeStore, ObjectStore } from '../../app/store';

import styles from './Attribute.module.css';

// Same thing is in Object :-(
const textHeight = 20;

interface AttributeProps {
    id: string,
    index: number
}

export function Attribute(props: AttributeProps) {
    let attribute: AttributeStore | undefined = useAppSelector((state) => selectAttributeById(state, props.id));

    let y = textHeight * props.index;
    let name = attribute!.name;
    let { type, is_ref } = getAttributeType(attribute!);
    let style = is_ref ? styles.referentialAttributeType : styles.attributeType;
    // if (typeof type === 'object') {
    //     let obj_id = type.foreign_key;
    //     let obj: ObjectStore | undefined = useAppSelector((state) => selectObjectById(state, obj_id));
    //     let type = obj!.name;
    // }
    return (
        <text className={styles.attribute} x={0} y={y} >
            {/* fill={"#EA9648"} > */}
            {name + ':\t'}
            <tspan className={style}>{type}</tspan>
        </text>
    )
}