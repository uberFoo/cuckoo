import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Menu, MenuItem } from '@mui/material';
import { ActionCreators as UndoActionCreators } from 'redux-undo';

import { ObjectWidget } from '../object/Object';
import { Rect, ObjectUI, RelationshipUI, BinaryEnd } from '../../app/store';
import { Relationship } from '../relationship/Relationship';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import {
    addObjectToPaper, selectPaperSingleton, objectResizeBy, objectMoveTo,
    relationshipUpdateBinaryFrom, relationshipUpdateBinaryTo, removeObjectFromPaper,
    relationshipUpdateIsaFrom, relationshipUpdateIsaTo, savePaperOffset
} from './paperSlice';
import ObjectEditor from '../object/ObjectDialog';
import { removeObject, addObject } from '../object/objectSlice';
import { handleObjectMove, handleObjectResize, moveGlyph } from '../../app/utils';

import styles from './Paper.module.css';


const defaultWidth = 3200;
const defaultHeight = 1600;
const defaultGridSize = 25;
const defaultScale = 1.0;
const minScale = 0.4;
const maxScale = 4.5;

interface PaperProps {
    domain: string,
    domain_ns: string,
    x: number,
    y: number,
}

export type Direction = "north" | "south" | "east" | "west" | null;

export interface MoveStruct {
    mouseDown: boolean,
    origin_x: number,
    origin_y: number,
    meta: boolean,
    alt: boolean,
    ctrl: boolean,
    shift: boolean,
    target: {
        node: SVGElement | null,
        type: string
    },
    paper: {
        new_object: NewObject | null
    },
    object: {
        id: string,
        x: number,
        y: number,
        width: number,
        height: number,
        resizeDir: Direction,
        altClick: boolean,
        line: Line | null,
        dirty_m: boolean,
        dirty_r: boolean,
        rels: { target: SVGGElement, x: number, y: number, type: string }[]
    },
    relationship: {
        id: string,
        obj_id: string,
        parent?: SVGGElement,
        end: string,
        dir: string,
        x: number,
        y: number,
    }
};

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
        origin_x: props.x, //window.innerWidth / 2 - paper_obj!.width / 2,
        origin_y: props.y, //window.innerHeight / 2 - paper_obj!.height / 2,
        target: { node: null, type: '' },
        meta: false,
        alt: false,
        ctrl: false,
        shift: false,
        paper: {
            new_object: null
        },
        object: {
            id: '',
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            resizeDir: null,
            altClick: false,
            line: null,
            dirty_m: false,
            dirty_r: false,
            rels: [],
        },
        relationship: {
            id: '',
            obj_id: '',
            end: '',
            x: 0,
            y: 0,
            dir: ''
        }
    });


    let [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);

    let onMouseDownHandler = (event: React.MouseEvent) => {
        event.preventDefault();

        let target = event.target as SVGElement;
        if (typeof target.className !== 'object') {
            // Not an SVGElement
            return;
        }
        let type = target.className.baseVal.split('_')[0];

        switch (type) {
            case 'Paper': {
                let { paper } = move;

                if (event.altKey) {
                    // Start an undo
                    setMove({
                        ...move, mouseDown: true, target: { node: target, type }, alt: true
                    });
                } else if (event.shiftKey) {
                    // Do a redo
                    setMove({
                        ...move, mouseDown: true, target: { node: target, type }, shift: true
                    });
                } else if (event.metaKey) {
                    // Create a new object. We use a Rect struct to hold it's dimensions until
                    // it's instantiated and has it's own coordinates.
                    let { origin_x, origin_y } = move;

                    let x = event.clientX - origin_x;
                    let y = event.clientY - origin_y;

                    setMove({
                        ...move,
                        mouseDown: true,
                        target: { node: target, type },
                        meta: true,
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
                    // At a minimum we need to record that the mouse was down. And the target too!
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

                if (event.altKey) {
                    // This brings up the object editor.
                    setMove({
                        ...move,
                        mouseDown: true,
                        target: { node: target, type },
                        alt: true,
                        object: { ...object, id, x, y, width, height }
                    });
                } else if (event.metaKey) {
                    // This is supposed to be for creating a new relationship.
                    let x = event.clientX - origin_x;
                    let y = event.clientY - origin_y;

                    setMove({
                        ...move,
                        mouseDown: true,
                        target: { node: target, type },
                        meta: true,
                        object: {
                            ...object,
                            id, x, y, width, height,
                            line: { x0: x, y0: y, x1: x, y1: y }
                        }
                    });
                } else if (event.ctrlKey) {
                    // Delete
                    dispatch(removeObjectFromPaper({ id }));
                    // @ts-ignore
                    dispatch(removeObject({ id }));
                } else {
                    // Default dragging
                    setMove({
                        ...move,
                        mouseDown: true,
                        target: { node: target, type },
                        object: {
                            ...object,
                            id, x, y, width, height,
                            resizeDir: dir,
                            altClick: false,
                            dirty_m: false,
                            dirty_r: false,
                            rels: []
                        }
                    });
                }
            }
                break;

            case 'Relationship': {
                let { relationship } = move;
                let root = target.parentNode as SVGGElement;

                let [id, obj_id, dir, end] = root.id.split(':');
                let ui = paper_obj!.relationships[id] as RelationshipUI;

                let { x, y } = relationship;

                switch (Object.keys(ui)[0]) {
                    case 'BinaryUI':
                        // @ts-ignore
                        let props = ui.BinaryUI as BinaryUI;
                        if (end === 'from') {
                            x = props.from.x;
                            y = props.from.y;
                            dir = props.from.dir;
                        } else {
                            x = props.to.x;
                            y = props.to.y;
                            dir = props.to.dir;
                        }
                        break;
                    case 'IsaUI': {
                        // @ts-ignore
                        let props = ui.IsaUI as IsaUI;
                        if (end === 'from') {
                            x = props.from.x;
                            y = props.from.y;
                            dir = props.from.dir;
                        } else {
                            props.to.forEach((to_ui: BinaryEnd, index: number) => {
                                if (to_ui.id === obj_id) {
                                    x = to_ui.x;
                                    y = to_ui.y;
                                    dir = to_ui.dir;
                                }
                            });
                        }
                    }
                        break;
                }

                setMove({
                    ...move, mouseDown: true, target: { node: target, type },
                    relationship: {
                        id: id,
                        obj_id,
                        parent: root,
                        end,
                        dir,
                        x,
                        y
                    }
                });

            }
                break;

            default:
                break;
        }
    };

    let onMouseUpHandler = (event: React.MouseEvent) => {
        let { mouseDown } = move;

        if (mouseDown) {
            let { target } = move;
            let new_obj = false;
            switch (target.type) {
                case 'Paper': {
                    let { mouseDown, paper, object, meta, alt, shift } = move;

                    if (mouseDown) {
                        if (alt) {
                            dispatch(UndoActionCreators.undo());
                        } else if (shift) {
                            dispatch(UndoActionCreators.redo());
                        } else if (meta) {
                            let { x0, y0, x1, y1 } = paper.new_object!;
                            let width = x1 - x0;
                            let height = y1 - y0;

                            if (width > 50 && height > 50) {

                                let obj_ui = {
                                    id: "fubar",
                                    payload: {
                                        x: x0,
                                        y: y0,
                                        width,
                                        height
                                    }
                                };

                                new_obj = true;

                                dispatch(addObject({ id: "fubar", name: "New Object", attributes: {} }));
                                dispatch(addObjectToPaper(obj_ui));
                            }
                        } else {
                            let { origin_x, origin_y } = move;
                            // Presumably we are panning
                            dispatch(savePaperOffset({ x: origin_x, y: origin_y }));
                        }
                    }

                    if (new_obj) {
                        setMove({
                            ...move,
                            mouseDown: false,
                            meta: false,
                            alt: false,
                            ctrl: false,
                            shift: false,
                            target: { node: null, type: '' },
                            paper: { ...paper, new_object: null },
                            // This is PFM. I've created a monster.
                            object: { ...object, id: 'fubar', altClick: true }
                        });
                    } else {
                        setMove({
                            ...move,
                            mouseDown: false,
                            meta: false,
                            alt: false,
                            ctrl: false,
                            shift: false,
                            target: { node: null, type: '' },
                            paper: { ...paper, new_object: null }
                        });
                    }
                }
                    break;

                case 'Object': {
                    let { mouseDown, object, alt, meta } = move;
                    let { altClick, width, height, x, y, dirty_m, dirty_r, rels } = object;

                    let parent = target.node!.parentNode as SVGGElement;
                    let id = parent.id;

                    if (mouseDown) {
                        if (dirty_r) {
                            dispatch(objectResizeBy({ id, width: width, height: height }));
                        }

                        // Panning.
                        if (dirty_m) {
                            for (let r in rels) {
                                let o = rels[r];
                                let t = o.target;
                                let type = o.type;

                                let [id, obj_id, dir, end] = t.id.split(':');

                                let xform = t.transform.baseVal.getItem(0);
                                console.assert(xform.type === SVGTransform.SVG_TRANSFORM_TRANSLATE);
                                let x = xform.matrix.e;
                                let y = xform.matrix.f;

                                if (type === 'binary') {
                                    if (end === 'from') {
                                        dispatch(relationshipUpdateBinaryFrom({ id, from: { id: obj_id, x, y, dir } }));
                                    } else {
                                        dispatch(relationshipUpdateBinaryTo({ id, to: { id: obj_id, x, y, dir } }));
                                    }
                                } else if (type === 'isa') {
                                    let ui = paper_obj?.relationships[id];

                                    if (end === 'from') {
                                        // @ts-ignore
                                        let isa_ui = ui!.IsaUI;
                                        let from = isa_ui?.from;

                                        dispatch(relationshipUpdateIsaFrom({
                                            id, new_from: { ...from, x, y, dir }
                                        }));
                                    } else {
                                        // @ts-ignore
                                        let isa_ui = ui!.IsaUI;

                                        isa_ui.to.forEach((rel_ui: BinaryEnd, index: number) => {
                                            if (rel_ui.id === obj_id) {
                                                dispatch(relationshipUpdateIsaTo({
                                                    id, index, new_to: { ...rel_ui, x, y, dir }
                                                }
                                                ));
                                            }
                                        });
                                    }
                                }
                            }
                            dispatch(objectMoveTo({ id, x, y }))
                        }

                        if (alt) {
                            // Bring up the editor
                            altClick = true;
                        } else if (meta) {
                            // Draw a line for a relationsship.
                            let { line } = object;
                            console.log('up', line);
                        }


                        setMove({
                            ...move,
                            mouseDown: false,
                            alt: false,
                            meta: false,
                            ctrl: false,
                            target: { node: null, type: '' },
                            object: {
                                ...object, resizeDir: null, altClick, dirty_m: false, dirty_r: false,
                            }
                        });
                    }
                }
                    break;

                case 'Relationship': {
                    let { relationship } = move;
                    let { x, y, obj_id, dir, id, end } = relationship;

                    let ui = paper_obj?.relationships[id];

                    switch (Object.keys(ui!)[0]) {
                        case 'BinaryUI':
                            if (end === 'from') {
                                dispatch(relationshipUpdateBinaryFrom({
                                    id, from: { id: obj_id, x, y, dir }
                                }));
                            } else {
                                dispatch(relationshipUpdateBinaryTo({
                                    id, to: { id: obj_id, x, y, dir }
                                }));
                            }
                            break;
                        case 'IsaUI': {
                            // @ts-ignore
                            let isa_ui = ui.IsaUI;

                            if (end === 'from') {
                                dispatch(relationshipUpdateIsaFrom({
                                    id, new_from: { ...isa_ui.from, x, y, dir }
                                }));
                            } else {
                                isa_ui.to.forEach((to_ui: BinaryEnd, index: number) => {
                                    if (to_ui.id === obj_id) {
                                        dispatch(relationshipUpdateIsaTo({
                                            id, index, new_to: { ...to_ui, x, y, dir }
                                        }))
                                    }
                                })

                            }
                        }
                            break;

                        default:
                            console.error('unknown relationship ui', ui!);
                            break
                    }

                    setMove({
                        ...move,
                        mouseDown: false,
                        alt: false,
                        meta: false,
                        ctrl: false,
                        target: { node: null, type: '' }
                    });
                }
                    break;

                default:
                    console.error('MouseUp on unknown type, ', target.type, target);
                    break;
            }
        }
    };

    let onMouseMoveHandler = (event: React.MouseEvent) => {
        let { mouseDown } = move;

        if (mouseDown) {
            let { target } = move;

            switch (target.type) {
                case 'Paper': {
                    let { mouseDown, paper, meta } = move;

                    if (mouseDown) {
                        if (meta) {
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
                    }
                }
                    break;

                case 'Object': {
                    let { mouseDown, object, alt, meta } = move;
                    let { resizeDir } = object;

                    if (mouseDown && !alt) {
                        // Drawing a new relationship.
                        if (meta) {
                            let { line } = object;

                            line!.x1 += event.movementX;
                            line!.y1 += event.movementY;

                            // @ts-ignore
                            setMove({ ...move, object: { line } });

                        } else if (resizeDir) {
                            let new_move = handleObjectResize(move, event);
                            if (new_move)
                                setMove(new_move);
                        } else {
                            let new_move = handleObjectMove(paper_obj!, move, event);
                            if (new_move)
                                setMove(new_move);
                        }
                    }
                }
                    break;

                case 'Relationship': {
                    let { relationship } = move;
                    let { x, y, parent } = relationship;

                    if (parent === undefined) {
                        console.error('undefined parent node');
                        break;
                    }

                    if (event.movementX !== 0 || event.movementY !== 0) {

                        x += event.movementX;
                        y += event.movementY;

                        let [x0, y0, dir0] = moveGlyph(x, y, parent, paper_obj!)!;

                        setMove({
                            ...move, relationship: {
                                // @ts-ignore
                                ...relationship, x: x0, y: y0, dir: dir0
                            }
                        });
                    }
                }
                    break;

                default:
                    console.error('MouseMove on unknown type, ', target.type, target);
                    break;
            }
        }
    };

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

        objectInstances.push(<ObjectWidget key={`${key}${x}${y}${width}${height}`} id={key} x={x} y={y}
            width={width} height={height} origin={origin}
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
        let rel_ui = paper_obj!.relationships[key];

        // @ts-ignore
        relInsts.push(<Relationship key={key} id={key} ui={rel_ui} />); //uberFoo={uberFoo} />);
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

    let doneEditing = () => {
        if (move.object.altClick) {
            let { object } = move;
            setMove({ ...move, object: { ...object, altClick: false } });
        }
    }

    let { origin_x, origin_y, object } = move;
    let { line } = object;

    // if (contextMenu) {
    // @ts-ignore
    // return ReactDOM.createPortal(contextMenuContent, document.getElementById('root'));
    // } else {
    return (
        <>
            {object.altClick &&
                // @ts-ignore
                <ObjectEditor enabled={true} obj_id={move.object.id} ns={props.domain_ns}
                    done={doneEditing}
                />
            }
            <svg id="svg-root" width={paper_obj!.width} height={paper_obj!.height}
                xmlns='http://www.w3.org/2000/svg'
            >
                {/* @ts-ignore */}
                {ReactDOM.createPortal(contextMenuContent, document.getElementById('root'))}
                <g id="paper" pointerEvents="all"
                    transform={"translate(" + origin_x + "," + origin_y + ") scale(" +
                        defaultScale + ")"}
                    onMouseDown={onMouseDownHandler} onMouseUp={onMouseUpHandler}
                    onMouseMove={onMouseMoveHandler} onMouseLeave={onMouseUpHandler}
                // onContextMenu={contextMenuHandler}
                >
                    <rect id="background" width={paper_obj!.width} height={paper_obj!.height}
                        className={styles.paperBase}
                    />
                    <g className={styles.axis}>
                        {x_lines}
                    </g>
                    <g className={styles.axis}>
                        {y_lines}
                    </g>
                    <g id="canvas">
                        {move.paper.new_object !== null && newObject}
                        {line &&
                            <line className={styles.antLine} x1={line.x0} y1={line.y0} x2={line.x1} y2={line.y1} />
                        }
                        <g id="objects">
                            {objectInstances}
                        </g>
                        <g id="relationships">
                            {relInsts}
                        </g>
                    </g>
                </g >
            </svg>
        </>
    )
}
