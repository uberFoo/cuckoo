import React, { useState } from 'react';
import { v5 as uuid } from 'uuid';

import { Object } from '../object/Object';
import { PaperStore, ObjectStore } from '../../app/store';
import { useAppSelector } from '../../app/hooks';
import { selectObjects } from '../object/objectSlice';
import { selectPaperById, selectPapers, getPaperIds } from './paperSlice';

import styles from './Paper.module.css';

const defaultWidth = 3200;
const defaultHeight = 1600;
const defaultGridSize = 25;
const defaultScale = 1.25;
const minScale = 0.4;
const maxScale = 4.5;
const defaultPosition = [0, 0];

interface PaperProps {
    domain: string,
    domain_ns: string
}

export function Paper(props: PaperProps) {
    let [move, setMove] = useState({ mouseDown: false, x: defaultPosition[0], y: defaultPosition[1] });

    let onMouseDownHandler = (event: React.MouseEvent) => {
        // This forces an update -- bad here.
        setMove({ ...move, mouseDown: true });
    }

    let onMouseUpHandler = (event: React.MouseEvent) => {
        // This forces an update -- bad here.
        setMove({ ...move, mouseDown: false });
    }

    let onMouseMoveHandler = (event: React.MouseEvent) => {
        let { mouseDown, x, y } = move;
        // If mouseDown we are panning. This is wrong, and actually needs to start drawing.
        if (mouseDown) {
            x += event.movementX;
            y += event.movementY;

            // This forces an update -- good here.
            setMove({ mouseDown, x, y });
        }
    }

    let paperIds: Array<string> = useAppSelector((state) => getPaperIds(state));
    let paper: PaperStore | undefined = useAppSelector((state) => selectPaperById(state, paperIds[0]));


    let objects: Array<ObjectStore> = useAppSelector((state) => selectObjects(state));
    let objectInstances: Array<JSX.Element> = objects.map((o) => {
        return <Object key={o.id} id={o.id} />
    });

    let x_lines = [];
    for (let i = 0; i < paper!.height + 1; i += defaultGridSize) {
        x_lines.push(<line x1={0} y1={i} x2={paper!.width} y2={i} />);
    }

    let y_lines = [];
    for (let i = 0; i < paper!.width + 1; i += defaultGridSize) {
        y_lines.push(<line x1={i} y1={0} x2={i} y2={paper!.height} />);
    }

    let { mouseDown, x, y } = move;

    return (
        <g id="paper" pointerEvents="all" transform={"translate(" + x + "," + y + ") scale(" + defaultScale + ")"}
            onMouseDown={onMouseDownHandler} onMouseUp={onMouseUpHandler} onMouseMove={onMouseMoveHandler} onMouseLeave={onMouseUpHandler}>
            < rect id="background" width={paper!.width} height={paper!.height} className={styles.paperBase} />
            <g className={styles.axis}>
                {x_lines}
            </g>
            <g className={styles.axis}>
                {y_lines}
            </g>
            <g id="canvas">
                {objectInstances}
            </g>
        </g >
    )
}