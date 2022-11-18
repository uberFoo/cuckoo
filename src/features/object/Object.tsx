import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Menu, MenuItem } from '@mui/material';

import { ObjectStore, AttributeStore } from '../../app/store';
import { selectObjectById, addObject } from './objectSlice';
import { objectMoveTo, objectResizeBy } from '../paper/paperSlice';
import { Attribute } from '../attribute/Attribute';
import { selectAttributes } from '../attribute/attributeSlice';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import ObjectEditor from './ObjectDialog';

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
    resizeDir: Direction,
    altClick: boolean
};

interface ObjectProps {
    id: string,
    ns: string,
    x: number,
    y: number,
    width: number,
    height: number,
    // uberFoo: any
};

export function Object(props: ObjectProps) {
    let dispatch = useAppDispatch();

    let object: ObjectStore | undefined = useAppSelector((state) => selectObjectById(state, props.id));

    if (object === undefined) {
        dispatch(addObject({ id: props.id, name: "New Object" }));
    }

    let [move, setMove] = useState({
        mouseDown: false,
        x: props.x,
        y: props.y,
        width: props.width,
        height: props.height,
        resizeDir: null,
        altClick: false
    } as State);
    let [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);

    let onMouseDownHandler = (event: React.MouseEvent) => {
        event.stopPropagation();

        // Give the target focus by moving it above the other elements.
        let target = event.target as SVGElement;
        let dir = target.id as Direction;

        // Below we have to move the target element to the _bottom_ of the list of elements.
        let root = target.parentNode;
        let canvas = root?.parentNode;

        canvas?.removeChild(root!);
        canvas?.appendChild(root!);

        if (!event.ctrlKey) {
            setMove({ ...move, mouseDown: true, resizeDir: dir, altClick: false });
        }
    }

    let onMouseMoveHandler = (event: React.MouseEvent) => {
        event.stopPropagation()

        let { mouseDown, x, y, width, height, resizeDir } = move;

        // If mouseDown we are panning. This is wrong, and actually needs to start drawing.
        if (mouseDown && !event.altKey) {
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
    };

    let onMouseUpHandler = (event: React.MouseEvent) => {
        event.stopPropagation();

        let { mouseDown, resizeDir, altClick, width, height, x, y } = move;
        if (mouseDown) {
            if (resizeDir) {
                if (width !== props.width && height !== props.height) {
                    dispatch(objectResizeBy({ id: object!.id, width: width, height: height }));
                }
            } else if (mouseDown && event.altKey) {
                altClick = true;
            } else {
                if (x !== props.x && y !== props.y) {
                    dispatch(objectMoveTo({ id: object!.id, x: x, y: y }))
                }
            }
            setMove({ ...move, mouseDown: false, resizeDir: null, altClick });
        }
    };

    // @ts-ignore
    // props.uberFoo([onMouseMoveHandler, onMouseUpHandler]);

    let contextMenuHandler = (event: React.MouseEvent) => {
        event.preventDefault();
        setContextMenu(
            contextMenu == null ? { x: event.clientX + 2, y: event.clientY - 6 } : null
        );
    };

    let attributes: Array<AttributeStore> = useAppSelector((state) => selectAttributes(state));
    let attributeInstances: Array<AttributeStore> = attributes
        .filter((a) => a.obj_id === props.id)
        .sort((a, b) => {
            if (a.id < b.id) {
                return -1
            } else if (a.id > b.id) {
                return 1;
            } else {
                return 0
            }
        });

    let attributeElements: Array<JSX.Element> = attributeInstances
        .map((a, i) => {
            return <Attribute key={a.id} id={a.id} index={i} />
        });

    let { x, y, width, height } = move;

    let doneEditing = () => {
        if (move.altClick) setMove({ ...move, altClick: false });
    }

    let handleCtxClose = () => { setContextMenu(null) };

    let contextMenuContent =
        <Menu
            open={contextMenu !== null}
            onClose={handleCtxClose}
            anchorReference="anchorPosition"
            anchorPosition={
                contextMenu !== null ? { top: contextMenu.x, left: contextMenu.y } : undefined
            }
        >
            <MenuItem>Undo</MenuItem>
            <MenuItem>Delete</MenuItem>
        </Menu>;

    // if this is new, we need to get data. We determine it's newness in a very lame manner.
    if (props.id === "fubar" || move.altClick) {
        return (
            <ObjectEditor enabled={true} object={object!} attrs={attributeInstances} ns={props.ns} done={doneEditing} />
        );
    } else if (contextMenu) {
        // @ts-ignore
        return ReactDOM.createPortal(contextMenuContent, document.getElementById('root'));
    } else {
        return (
            <g key={props.id} id={props.id} className={"object"} transform={buildTransform(x, y)}
                onMouseDown={onMouseDownHandler} onMouseUp={onMouseUpHandler}
                onMouseMove={onMouseMoveHandler} onMouseLeave={onMouseUpHandler}
            // onContextMenu={contextMenuHandler}
            >
                <rect className={styles.objectRect} width={width} height={height} />
                <text className={styles.objectName} x={width / 2} y={textHeight}>{object!.name}</text>
                <line className={styles.objectBisectLine} x1={0} y1={textHeight * 1.5} x2={width} y2={textHeight * 1.5} />
                <g className={"attrGroup"} transform={"translate(10," + textHeight * 2.5 + ")"}>
                    {attributeElements}
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
}


function buildTransform(x: number, y: number) {
    return 'translate(' + x + ',' + y + ')'
}
