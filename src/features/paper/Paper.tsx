import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Menu, MenuItem } from '@mui/material';
import { ActionCreators as UndoActionCreators } from 'redux-undo';

import { Object, Direction } from '../object/Object';
import { ObjectUI, RelationshipUI } from '../../app/store';
import { Relationship } from '../relationship/Relationship';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import {
    addObjectToPaper, selectPaperSingleton, objectResizeBy, objectMoveTo
} from './paperSlice';

import styles from './Paper.module.css';
import { Microwave } from '@mui/icons-material';

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
    origin_x: number,
    origin_y: number,
    target: {
        node: SVGElement | null,
        type: string
    },
    paper: {
        undo: boolean,
        new_object: NewObject | null
    },
    object: {
        x: number,
        y: number,
        width: number,
        height: number,
        resizeDir: Direction,
        altClick: boolean,
        line: Line | null,
        dirty: boolean
    }
};
interface Rect {
    x0: number,
    y0: number,
    x1: number,
    y1: number,
}

type Line = Rect;

type NewObject = Rect | null;

export function Paper(props: PaperProps) {
    // let mouseMoveCallbacks: any[] = [];
    // let uberFoo = (bar: []) => {
    //     mouseMoveCallbacks.push(bar);
    // };

    let dispatch = useAppDispatch();

    let paper_obj = useAppSelector((state) => selectPaperSingleton(state));

    let origin = {
        x: window.innerWidth / 2 - paper_obj!.width / 2,
        y: window.innerHeight / 2 - paper_obj!.height / 2,
    };

    let [move, setMove] = useState<MoveStruct>({
        mouseDown: false,
        origin_x: window.innerWidth / 2 - paper_obj!.width / 2,
        origin_y: window.innerHeight / 2 - paper_obj!.height / 2,
        target: { node: null, type: '' },
        paper: {
            undo: false,
            new_object: null
        },
        object: {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            resizeDir: null,
            altClick: false,
            line: null,
            dirty: false
        }
    });

    let [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);

    let onMouseDownHandler = (event: React.MouseEvent) => {
        let target = event.target as SVGElement;
        if (typeof target.className !== 'object') {
            // Not an SVGElement
            return;
        }
        let type = target.className.baseVal.split('_')[0];

        switch (type) {
            case 'Paper': {
                let { paper } = move;

                if (event.metaKey) {
                    // Start an undo
                    setMove({
                        ...move, mouseDown: true, target: { node: target, type },
                        paper: { ...paper, undo: true }
                    });
                } else if (event.altKey) {
                    // Create a new object. We use a Rect struct to hold it's dimensions until
                    // it's instantiated and has it's own coordinates.
                    let { origin_x, origin_y } = move;

                    let x = event.clientX - origin_x;
                    let y = event.clientY - origin_y;

                    setMove({
                        ...move,
                        mouseDown: true,
                        target: { node: target, type },
                        paper: {
                            ...paper,
                            new_object: {
                                x0: x, y0: y,
                                x1: x, y1: y
                            }
                        }
                    });
                } else if (event.ctrlKey) {
                    // This is for a context menu. Don't need to do anything.
                } else {
                    // At a minimum we need to record that the mouse was down.
                    setMove({ ...move, mouseDown: true, target: { node: target, type } });
                }
            }
                break;

            case 'Object': {
                let { origin_x, origin_y, object } = move;
                let dir = target.id as Direction;

                let root = target.parentNode as SVGGElement;
                let canvas = root?.parentNode;

                // This moves our <g> to the bottom on the list so that it draws above the others.
                canvas?.removeChild(root!);
                canvas?.appendChild(root!);

                let id = root.id;
                let props = paper_obj!.objects[id] as ObjectUI;
                let x = props.x;
                let y = props.y;
                let width = props.width;
                let height = props.height;

                if (event.metaKey) {
                    let x = event.clientX - origin_x;
                    let y = event.clientY - origin_y;

                    setMove({
                        ...move,
                        mouseDown: true,
                        target: { node: target, type },
                        object: {
                            ...object,
                            x, y, width, height,
                            line: { x0: x, y0: y, x1: x, y1: y }
                        }
                    });
                } else {
                    setMove({
                        ...move,
                        mouseDown: true,
                        target: { node: target, type },
                        object: {
                            ...object,
                            x, y, width, height,
                            resizeDir: dir,
                            altClick: false,
                            dirty: false
                        }
                    });
                }
            }
                break;

            default:
                console.error('MouseDown on unknown type, ', type);
                break;
        }
    }

    let onMouseUpHandler = (event: React.MouseEvent) => {
        let { target } = move;

        switch (target.type) {
            case 'Paper': {
                let { mouseDown, paper } = move;
                let { undo } = paper;

                if (undo) {
                    dispatch(UndoActionCreators.undo());
                } else if (mouseDown && event.altKey) {
                    let { x0, y0, x1, y1 } = paper.new_object!;
                    let width = x1 - x0;
                    let height = y1 - y0;

                    let obj_ui = {
                        id: "fubar",
                        payload: {
                            x: x0,
                            y: y0,
                            width,
                            height
                        }
                    };

                    dispatch(addObjectToPaper(obj_ui));
                } else {
                    // console.log('forwarding mouseup');
                    // // @ts-ignore
                    // mouseMoveCallbacks.map(([foo, bar]) => { if (bar !== null) bar(event); });
                }

                setMove({
                    ...move,
                    mouseDown: false,
                    paper: { ...paper, undo: false, new_object: null }
                });
            }
                break;

            case 'Object': {
                let { mouseDown, object } = move;
                let { resizeDir, altClick, width, height, x, y, dirty } = object;

                let parent = target.node!.parentNode as SVGGElement;
                let id = parent.id;
                // if (id == null) {
                //     console.error("can't access id via parentNode", target.node);
                // }
                // let props = paper_obj!.objects[id] as ObjectUI;

                if (mouseDown) {
                    if (resizeDir) {
                        if (dirty) {
                            // console.log('dispatch resize');
                            dispatch(objectResizeBy({ id, width: width, height: height }));
                        }
                    } else if (event.altKey) {
                        altClick = true;
                    } else if (event.metaKey) {
                        let { line } = object;
                        console.log('up', line);
                    } else {
                        // if (x !== props.x && y !== props.y) {
                        if (dirty) {
                            // console.log('dispatch moveto');
                            dispatch(objectMoveTo({ id, x, y }))
                        }
                    }

                    setMove({
                        ...move,
                        mouseDown: false,
                        object: {
                            ...object, resizeDir: null, altClick, dirty: false
                        }
                    });
                }
            }
                break;

            default:
                console.error('MouseUp on unknown type, ', target.type);
                break;
        }

    }

    let onMouseMoveHandler = (event: React.MouseEvent) => {
        let { target } = move;

        switch (target.type) {
            case 'Paper': {
                let { mouseDown, paper } = move;

                if (mouseDown) {
                    if (event.altKey) {
                        let last = paper.new_object;
                        let { x1, y1 } = last!;

                        // New Object
                        x1 += event.movementX;
                        y1 += event.movementY;

                        setMove({
                            ...move,
                            paper: {
                                ...paper,
                                new_object:
                                {
                                    ...last!,
                                    x1, y1
                                }
                            }
                        });
                    } else {
                        // Panning -- super important. We are maintaining our origin
                        let { origin_x, origin_y } = move;

                        origin_x += event.movementX;
                        origin_y += event.movementY;

                        // This forces an update -- good here.
                        setMove({ ...move, origin_x, origin_y });
                    }
                } else {
                    // console.log('forwarding mouesmove');
                    // // @ts-ignore
                    // mouseMoveCallbacks.map(([foo, bar]) => { if (foo !== null) foo(event) });
                }
            }
                break;

            case 'Object': {
                let { mouseDown, object, target } = move;
                let { x, y, width, height, resizeDir } = object;

                let parent = target!.node!.parentNode as SVGGElement;

                // If mouseDown we are panning. This is wrong, and actually needs to start drawing.
                if (mouseDown && !event.altKey) {
                    if (event.metaKey) {
                        let { line } = object;

                        line!.x1 += event.movementX;
                        line!.y1 += event.movementY;

                        // @ts-ignore
                        setMove({ ...move, object: { line } });

                    } else if (resizeDir) {
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

                        // TODO: Preview!
                        setMove({
                            ...move,
                            object: { ...object, width, height, x, y, dirty: true }
                        });
                    } else {
                        x += event.movementX;
                        y += event.movementY;

                        let xform = parent!.transform.baseVal.getItem(0);
                        console.assert(xform.type === SVGTransform.SVG_TRANSFORM_TRANSLATE);
                        xform.setTranslate(x, y);

                        setMove({ ...move, object: { ...object, x, y, dirty: true } });
                    }
                }
            }

                break;

            default:
                console.error('MouseMove on unknown type, ', target.type);
                break;
        }

    }

    let contextMenuHandler = (event: React.MouseEvent) => {
        event.preventDefault();
        setContextMenu(
            contextMenu == null ? { x: event.clientX + 2, y: event.clientY - 6 } : null
        );
    };

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


    let objectInstances: Array<JSX.Element> = [];
    for (let key in paper_obj!.objects) {
        let { x, y, width, height } = paper_obj!.objects[key] as ObjectUI;
        // This crazy key thing is what makes React redraw the entire Component. We need this to
        // happen when we undo.
        objectInstances.push(<Object key={`${key}${x}${y}${width}${height}`} id={key} x={x} y={y}
            width={width} height={height} ns={props.domain_ns} origin={origin}
        // @ts-ignore
        // uberFoo={uberFoo}
        />);
    }

    let newObject = null;
    if (move.paper.new_object !== null) {
        let { x0, y0, x1, y1 } = move.paper.new_object;
        let width = x1 - x0;
        let height = y1 - y0;

        newObject = <rect className={styles.antLine} x={x0} y={y0} width={width}
            height={height} />;
    }

    let relInsts: Array<JSX.Element> = [];
    for (let key in paper_obj!.relationships) {
        let { from, to } = paper_obj!.relationships[key] as RelationshipUI;

        // @ts-ignore
        relInsts.push(<Relationship key={key} id={key} from={from} to={to} />); //uberFoo={uberFoo} />);
    }

    // This is for the background. There's an SVG thing that can do a fill given a swatch that I
    // should look into.
    let x_lines = [];
    for (let i = 0; i < paper_obj!.height + 1; i += defaultGridSize) {
        x_lines.push(<line x1={0} y1={i} x2={paper_obj!.width} y2={i} />);
    }

    let y_lines = [];
    for (let i = 0; i < paper_obj!.width + 1; i += defaultGridSize) {
        y_lines.push(<line x1={i} y1={0} x2={i} y2={paper_obj!.height} />);
    }
    //
    let { origin_x, origin_y } = move;

    // if (contextMenu) {
    // @ts-ignore
    // return ReactDOM.createPortal(contextMenuContent, document.getElementById('root'));
    // } else {
    return (
        <svg id="svg-root" width={paper_obj!.width} height={paper_obj!.height} xmlns='http://www.w3.org/2000/svg'>
            {/* @ts-ignore */}
            {ReactDOM.createPortal(contextMenuContent, document.getElementById('root'))}
            < g id="paper" pointerEvents="all"
                transform={"translate(" + origin_x + "," + origin_y + ") scale(" +
                    defaultScale + ")"}
                onMouseDown={onMouseDownHandler} onMouseUp={onMouseUpHandler}
                onMouseMove={onMouseMoveHandler} onMouseLeave={onMouseUpHandler}
            // onContextMenu={contextMenuHandler}
            >
                < rect id="background" width={paper_obj!.width} height={paper_obj!.height} className={styles.paperBase} />
                <g className={styles.axis}>
                    {x_lines}
                </g>
                <g className={styles.axis}>
                    {y_lines}
                </g>
                <g id="canvas">
                    {move.paper.new_object !== null && newObject}
                    {objectInstances}
                    {relInsts}
                </g>
            </g >
        </svg>
    )
    // }
}