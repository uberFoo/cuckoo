import React, { Component } from 'react';
import { v5 as uuid } from 'uuid';

import styles from './Object.module.css';

export interface ObjectStore {
    id: string,
    name: string,
    key_letter: string
}

interface ObjectProps {
    domain: string,
    domain_ns: string
}

export class Object extends Component<ObjectProps, {}> {
    x: number;
    y: number;
    width: number;
    height: number;
    state: ObjectStore;

    constructor(props: ObjectProps) {
        super(props);

        this.x = 0;
        this.y = 0;
        this.width = 300;
        this.height = 150;

        this.state = {
            id: uuid('Object', props.domain_ns),
            name: 'Object',
            key_letter: 'O'
        };
    }
}
