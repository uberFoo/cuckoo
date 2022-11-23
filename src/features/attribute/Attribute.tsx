import React from 'react';

import { selectAttributeById } from './attributeSlice';
import { getAttributeType, useAppSelector } from '../../app/hooks';
import { AttributeStore } from '../../app/store';

import styles from './Attribute.module.css';

// Same thing is in Object :-(
const textHeight = 20;

interface AttributeProps {
    id: string,
    name: string,
    type: string,
    is_ref: boolean,
    index: number
}

export function Attribute(props: AttributeProps) {
    // let attribute: AttributeStore | undefined = useAppSelector((state) => selectAttributeById(state, props.id));

    let y = textHeight * props.index;
    // let name = attribute!.name;
    // let { type, is_ref } = getAttributeType(attribute!);
    let style = props.is_ref ? styles.referentialAttributeType : styles.attributeType;
    // Keep these in our back pocket:
    //      •: \u2022
    //      ⦿: \u29bf
    //      ◦: \u25e6
    let bullet = props.is_ref ? '\u2023 ' : '\u2043 ';

    return (
        <text className={styles.attribute} x={0} y={y} >
            {bullet + props.name + ':\t'}
            <tspan className={style}>{props.type}</tspan>
        </text>
    )
}