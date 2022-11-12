import React, { useState } from 'react';

import { ObjectStore } from '../../app/store';
import { selectObjectById, moveTo, resizeBy } from './objectSlice';
import { useAppSelector, useAppDispatch } from '../../app/hooks';

import styles from './Object.module.css';

// 		var nameBBox = g.select('.object-name').node().getBBox();
// var txtHeight = nameBBox.height,
//     txtClassX = function (d) { return d.value.w / 2.0; },
//     txtClassY = function () { return txtHeight; },
//     sepLine = function () { return txtHeight * 1.5; },
//     txtAttrBoxX = function () { return 10; },
//     txtAttrBoxY = function () { return txtHeight * 2.5; },
//     txtAttrY = function (d, i) { return i * txtHeight; };
const textHeight = 20;
const cornerSize = 14;

type Direction = "north" | "south" | "east" | "west" | null;
interface State {
    mouseDown: boolean,
    x: number,
    y: number,
    width: number,
    height: number,
    resizeDir: Direction
};

interface ObjectProps {
    id: string,
};

export function Object(props: ObjectProps) {
    // Why the undefined? I'd die happy knowing.
    let object: ObjectStore | undefined = useAppSelector((state) => selectObjectById(state, props.id));
    let dispatch = useAppDispatch();
    let [move, setMove] = useState({
        mouseDown: false,
        x: object!.extent.x,
        y: object!.extent.y,
        width: object!.extent.width,
        height: object!.extent.height,
        resizeDir: null
    } as State);

    let onMouseDownHandler = (event: React.MouseEvent) => {
        // This forces an update -- bad here.
        event.stopPropagation()

        let target = event.target as SVGElement;
        let dir = target.id as Direction;

        // Below we have to move the target element to the _bottom_ of the list of elements.
        let root = target.parentNode;
        let canvas = root?.parentNode;

        canvas?.removeChild(root!);
        canvas?.appendChild(root!);
        console.log(canvas?.childNodes);

        setMove({ ...move, mouseDown: true, resizeDir: dir });
    }

    let onMouseUpHandler = (event: React.MouseEvent) => {
        // This forces an update -- bad here.
        event.stopPropagation();

        if (move.resizeDir) {
            dispatch(resizeBy({ id: object!.id, width: move.width, height: move.height }));
        } else if (move.mouseDown) {
            dispatch(moveTo({ id: object!.id, x: move.x, y: move.y }))
        }
        setMove({ ...move, mouseDown: false, resizeDir: null });
    }

    let onMouseMoveHandler = (event: React.MouseEvent) => {
        event.stopPropagation()

        let { mouseDown, x, y, width, height, resizeDir } = move;

        // If mouseDown we are panning. This is wrong, and actually needs to start drawing.
        if (mouseDown) {
            if (resizeDir) {
                let dx = event.movementX;
                let dy = event.movementY;
                switch (resizeDir) {
                    case 'north':
                        y += dy;
                        if (dy < 0) {
                            height += -dy;
                        } else {
                            height -= dy
                        }
                        break;
                    case 'south':
                        height += dy;
                        break;
                    case 'east':
                        width += dx;
                        break;
                    case 'west':
                        x += dx;
                        if (dx < 0) {
                            width += -dx;
                        } else {
                            width -= dx;
                        }
                        break;

                    default:
                        console.log('WTF');
                        break;
                }
            } else {
                x += event.movementX;
                y += event.movementY;
            }

            // This forces an update -- good here.
            setMove({ ...move, mouseDown, x, y, width, height, resizeDir });
        }
    }

    let { mouseDown, x, y, width, height } = move;

    return (
        <g key={object!.id} id={object!.id} className={"object"} transform={buildTransform(x, y)}
            onMouseDown={onMouseDownHandler} onMouseUp={onMouseUpHandler}
            onMouseMove={onMouseMoveHandler} onMouseLeave={onMouseUpHandler} >
            <rect className={styles.objectRect} width={width} height={height} />
            <text className={styles.objectName} x={width / 2} y={textHeight}>{object!.name}</text>
            <line className={styles.objectBisectLine} x1={0} y1={textHeight * 1.5} x2={width} y2={textHeight * 1.5} />
            <g className={"attrGroup"} transform={"translate(10," + textHeight * 2.5 + ")"}>
                <text className={styles.objectAttr} x={0} y={textHeight} fill={"#EA9648"} font-style={"normal"}>id</text>
                {/* attributes go here */}
            </g>
            {/* These are for resizing */}
            {/* East */}
            <line id={"east"} className={`${styles.resize} ${styles.relAttach} ${styles.ewResize}`}
                x1={width} y1={cornerSize} x2={width} y2={height - cornerSize} />
            {/* North */}
            <line id={"north"} className={`${styles.resize} ${styles.relAttach} ${styles.nsResize}`}
                x1={cornerSize} y1={"0"} x2={width - cornerSize} y2={0} />
            {/* West */}
            <line id={"west"} className={`${styles.resize} ${styles.relAttach} ${styles.ewResize}`}
                x1={0} y1={cornerSize} x2={0} y2={height - cornerSize} />
            {/* South */}
            <line id={"south"} className={`${styles.resize} ${styles.relAttach} ${styles.nsResize}`}
                x1={cornerSize} y1={height} x2={width - cornerSize} y2={height} />
        </g >
    );
}

function buildTransform(x: number, y: number) {
    return 'translate(' + x + ',' + y + ')'
}
