import React, { useState } from 'react';
import { v5 as uuid } from 'uuid';

import { Object } from '../object/Object';
import { PaperStore, ObjectStore } from '../../app/store';
import { useAppSelector } from '../../app/hooks';
import { selectObjects } from '../object/objectSlice';
import { selectPaperById, selectPapers, getPaperIds } from './paperSlice';

import styles from './Paper.module.css';
// import { selectAll } from '@testing-library/user-event/dist/types/event';

const width = 3200;
const height = 1600;
const gridSize = 25;
const defaultScale = 1.25;
const minScale = 0.4;
const maxScale = 4.5;
const defaultPosition = [0, 0];

interface PaperProps {
    domain: string,
    domain_ns: string
}

export function Paper(props: PaperProps) {
    // All the bits we need to draw ourselves
    // x: number;
    // y: number;
    // scale: number;
    // ref: SVGGElement | null;
    // x_lines: Array<JSX.Element>;
    // y_lines: Array<JSX.Element>;

    // state: PaperStore;
    // //
    // // Things needed to pan and zoom
    // mouseDown: Boolean;
    // // gestureHandler;

    // constructor(props: PaperProps) {

    //     super(props);
    //     let [x, y] = defaultPosition;
    //     this.x = x;
    //     this.y = y;
    //     this.scale = defaultScale;
    //     this.ref = null;
    let x_lines = [];
    for (let i = 0; i < height + 1; i += gridSize) {
        x_lines.push(<line x1={0} y1={i} x2={width} y2={i} />);
    }

    let y_lines = [];
    for (let i = 0; i < width + 1; i += gridSize) {
        y_lines.push(<line x1={i} y1={0} x2={i} y2={height} />);
    }

    //     this.state = {
    //         width: width,
    //         height: height,
    //         domain_name: props.domain,
    //         domain_ns: props.domain_ns,
    //         // objects: [],
    //         // attributes: [],
    //         // relationships: []
    //     };

    //     console.log(this.state);

    //     this.mouseDown = false;
    //     // this.gestuerHandler = useDrag(())

    //     // Bind Callbacks to this. Still?
    //     this.onMouseDownHandler = this.onMouseDownHandler.bind(this);
    //     this.onMouseUpHandler = this.onMouseUpHandler.bind(this);
    //     this.onMouseMoveHandler = this.onMouseMoveHandler.bind(this);
    // }

    // componentDidMount(): void {
    // this.ref!.onmouseDown = this.onMouseDownHandler;
    // }

    let [move, setMove] = useState({ mouseDown: false, x: defaultPosition[0], y: defaultPosition[1] });

    let onMouseDownHandler = (event: React.MouseEvent) => {
        // console.log(`down: ${this}`);
        setMove({ ...move, mouseDown: true });
        // styles.paperBase.cursor = "grabbing";
    }

    let onMouseUpHandler = (event: React.MouseEvent) => {
        setMove({ ...move, mouseDown: false });
    }

    let onMouseMoveHandler = (event: React.MouseEvent) => {
        let { mouseDown, x, y } = move;
        // If mouseDown we are panning. This is wrong, and actually needs to start drawing.
        if (mouseDown) {
            x += event.movementX;
            y += event.movementY;

            setMove({ mouseDown, x, y });

            // forceUpdate();
        }
    }

    // render(): React.ReactNode {
    let paperIds: Array<string> = useAppSelector((state) => getPaperIds);
    let paper: PaperStore | undefined = useAppSelector((state) => selectPaperById(state, paperIds[0]));
    let objects: Array<ObjectStore> = useAppSelector((state) => selectObjects(state));
    let objectInstances: Array<JSX.Element> = objects.map((o) => {
        return <Object key={o.id} id={o.id} />
    });

    let { mouseDown, x, y } = move;

    return (
        <g id="paper" pointerEvents="all" transform={"translate(" + x + "," + y + ") scale(" + defaultScale + ")"}
            onMouseDown={onMouseDownHandler} onMouseUp={onMouseUpHandler} onMouseMove={onMouseMoveHandler} onMouseLeave={onMouseUpHandler}>
            < rect id="background" width={width} height={height} className={styles.paperBase} />
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
    // }
}
//     function onMouseDownHandler(event: React.MouseEvent) {
//         // console.log(`down: ${this}`);
//         this.mouseDown = true;
//     }

//     function onMouseUpHandler(event: React.MouseEvent) {
//         // console.log(`up: ${this}`);
//         this.mouseDown = false;
//     }

//     function onMouseMoveHandler(event: React.MouseEvent) {
//         // If mouseDown we are panning. This is wrong, and actually needs to start drawing.
//         if (this.mouseDown) {
//             this.x += event.movementX;
//             this.y += event.movementY;

//             this.forceUpdate();
//         }
//     }
// }