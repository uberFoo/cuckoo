import React, { Component } from 'react';
import { v5 as uuid } from 'uuid';

import { ObjectStore } from '../../app/store';
import styles from './Object.module.css';

interface ObjectProps {
    domain: string,
    domain_ns: string
}

export class Object extends Component<ObjectProps, {}> {
    state: ObjectStore;

    constructor(props: ObjectProps) {
        super(props);

        this.state = {
            id: uuid('Object', props.domain_ns),
            name: 'Object',
            key_letter: 'O',
            extent: {
                x: 0,
                y: 0,
                width: 300,
                height: 150
            }
        };
    }
}
