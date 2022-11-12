import React from 'react';

import { AttributeStore } from '../../app/store';

import styles from './Attribute.module.css';

interface AttributeProps {
    id: number
}

export function Attribute(props: AttributeProps) {
    return (
        <text className={styles.objectAttr} x={0} y={13} fill={"#EA9648"} font-style={"normal"}>id</text>
    )
}