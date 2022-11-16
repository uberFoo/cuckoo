import React, { useState } from 'react';
import { ActionCreators as UndoActionCreators } from 'redux-undo';

import { Object } from '../object/Object';
import { PaperStore, ObjectStore, ObjectUI, store } from '../../app/store';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { selectObjects } from '../object/objectSlice';
import { addPaper, addObjectToPaper, selectPaperSingleton, selectPaperIds } from './paperSlice';
import { addObject } from '../object/objectSlice';
// import { addUI } from '../object/objectUISlice';

import styles from './Paper.module.css';

const defaultWidth = 3200;
const defaultHeight = 1600;
const defaultGridSize = 25;
const defaultScale = 1.0;
const minScale = 0.4;
const maxScale = 4.5;
const defaultPosition = [
    window.innerWidth / 2 - defaultWidth / 2,
    window.innerHeight / 2 - defaultHeight / 2
];

interface PaperProps {
    domain: string,
    domain_ns: string
}

interface MoveStruct {
    mouseDown: boolean,
    undo: boolean,
    x: number,
    y: number,
    new_object: NewObject
};
interface Point {
    start_x: number,
    start_y: number,
    end_x: number,
    end_y: number,
}

type NewObject = Point | null;

export function Paper(props: PaperProps) {
    let dispatch = useAppDispatch();

    let paper = useAppSelector((state) => selectPaperSingleton(state));

    let [move, setMove] = useState({
        mouseDown: false,
        undo: false,
        x: window.innerWidth / 2 - paper!.width / 2,
        y: window.innerHeight / 2 - paper!.height / 2,
        new_object: null
    } as MoveStruct);

    let onMouseDownHandler = (event: React.MouseEvent) => {
        if (event.metaKey) {
            setMove({ ...move, undo: true });
        } else if (event.altKey) {
            let { x, y } = move;

            setMove({
                ...move, mouseDown: true, new_object: {
                    start_x: event.clientX - x, start_y: event.clientY - y,
                    end_x: event.clientX - x, end_y: event.clientY - y
                }
            });
        } else {
            // This forces an update -- bad here.
            setMove({ ...move, mouseDown: true });
        }
    }

    let onMouseUpHandler = (event: React.MouseEvent) => {
        let { undo } = move;
        if (undo) {
            dispatch(UndoActionCreators.undo());
        } else if (event.altKey) {
            let { start_x, start_y, end_x, end_y } = move.new_object!;
            let width = end_x - start_x;
            let height = end_y - start_y;


            let obj_ui = {
                id: "fubar",
                payload: {
                    x: start_x,
                    y: start_y,
                    width,
                    height
                }
            };


            dispatch(addObjectToPaper(obj_ui));
        }
        // This forces an update -- bad here.
        setMove({ ...move, mouseDown: false, undo: false, new_object: null });
    }

    let onMouseMoveHandler = (event: React.MouseEvent) => {
        let { mouseDown } = move;

        if (mouseDown) {
            if (event.altKey) {
                let last = move.new_object;
                let { end_x, end_y } = last!;

                // New Object
                end_x += event.movementX;
                end_y += event.movementY;

                setMove({
                    ...move, mouseDown, new_object: {
                        ...last!,
                        end_x, end_y
                    }
                });
            } else {
                // Panning
                let { x, y } = move;

                x += event.movementX;
                y += event.movementY;

                // This forces an update -- good here.
                setMove({ ...move, mouseDown, x, y });
            }

        }
    }

    let objectInstances: Array<JSX.Element> = [];
    for (let key in paper!.objects) {
        let { x, y, width, height } = paper!.objects[key] as ObjectUI;
        // This crazy key thing is what makes React redraw the entire Component. We need this to
        // happen when we undo.
        objectInstances.push(<Object key={`${key}${x}${y}${width}${height}`} id={key} x={x} y={y} width={width} height={height} ns={props.domain_ns} />);
    }

    let newObject = null;
    if (move.new_object !== null) {
        let { x, y } = move;
        let { start_x, start_y, end_x, end_y } = move.new_object;
        let width = end_x - start_x;
        let height = end_y - start_y;
        newObject = <rect className={styles.antLine} x={start_x} y={start_y} width={width} height={height} />;
    }


    // This is for the background. There's an SVG thing that can do a fill given a swatch that I
    // should look into.
    let x_lines = [];
    for (let i = 0; i < paper!.height + 1; i += defaultGridSize) {
        x_lines.push(<line x1={0} y1={i} x2={paper!.width} y2={i} />);
    }

    let y_lines = [];
    for (let i = 0; i < paper!.width + 1; i += defaultGridSize) {
        y_lines.push(<line x1={i} y1={0} x2={i} y2={paper!.height} />);
    }
    //
    let { mouseDown, x, y } = move;

    return (
        <svg id="svg-root" width={paper!.width} height={paper!.height} xmlns='http://www.w3.org/2000/svg'>
            < g id="paper" pointerEvents="all" transform={"translate(" + x + "," + y + ") scale(" + defaultScale + ")"}
                onMouseDown={onMouseDownHandler} onMouseUp={onMouseUpHandler} onMouseMove={onMouseMoveHandler} onMouseLeave={onMouseUpHandler} >
                < rect id="background" width={paper!.width} height={paper!.height} className={styles.paperBase} />
                <g className={styles.axis}>
                    {x_lines}
                </g>
                <g className={styles.axis}>
                    {y_lines}
                </g>
                <g id="canvas">
                    {move.new_object !== null && newObject}
                    {objectInstances}
                </g>
            </g >
        </svg>
    )
}