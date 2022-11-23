import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Menu, MenuItem } from '@mui/material';
import { ActionCreators as UndoActionCreators } from 'redux-undo';

import { ObjectWidget } from '../object/Object';
import { ObjectUI, PaperStore, RelationshipUI, Point } from '../../app/store';
import { Relationship } from '../relationship/Relationship';
import { makeLine, makeTransform } from '../relationship/Binary';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import {
    addObjectToPaper, selectPaperSingleton, objectResizeBy, objectMoveTo, relationshipUpdate,
    relationshipUpdateFrom, relationshipUpdateTo, removeObjectFromPaper
} from './paperSlice';
import ObjectEditor from '../object/ObjectDialog';

import styles from './Paper.module.css';
import { removeObject, addObject } from '../object/objectSlice';


const defaultWidth = 3200;
const defaultHeight = 1600;
const defaultGridSize = 25;
const defaultScale = 1.0;
const minScale = 0.4;
const maxScale = 4.5;

interface PaperProps {
    domain: string,
    domain_ns: string
}

export type Direction = "north" | "south" | "east" | "west" | null;

interface MoveStruct {
    mouseDown: boolean,
    origin_x: number,
    origin_y: number,
    meta: boolean,
    alt: boolean,
    ctrl: boolean,
    target: {
        node: SVGElement | null,
        type: string
    },
    paper: {
        undo: boolean,
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
        rels: { target: SVGGElement, x: number, y: number }[]
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
        meta: false,
        alt: false,
        ctrl: false,
        paper: {
            undo: false,
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
                        ...move, mouseDown: true, target: { node: target, type }, alt: true,
                        paper: { ...paper, undo: true }
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
                        }
                    });
                }
            }
                break;

            case 'Relationship': {
                let { relationship } = move;
                let root = target.parentNode as SVGGElement;
                let [id, obj_id, dir, end] = root.id.split(':');
                let props = paper_obj!.relationships[id] as RelationshipUI;

                let { x, y } = relationship;
                if (end === 'from') {
                    x = props.from.x;
                    y = props.from.y;
                    dir = props.from.dir;
                } else {
                    x = props.to.x;
                    y = props.to.y;
                    dir = props.to.dir;
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
                    let { mouseDown, paper, object, meta } = move;
                    let { undo } = paper;

                    if (undo) {
                        dispatch(UndoActionCreators.undo());

                    } else if (mouseDown && meta) {
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

                        new_obj = true;

                        dispatch(addObject({ id: "fubar", name: "New Object" }));
                        dispatch(addObjectToPaper(obj_ui));
                    } else {
                        // console.log('forwarding mouseup');
                        // // @ts-ignore
                        // mouseMoveCallbacks.map(([foo, bar]) => { if (bar !== null) bar(event); });
                    }

                    if (new_obj) {
                        setMove({
                            ...move,
                            mouseDown: false,
                            meta: false,
                            alt: false,
                            ctrl: false,
                            target: { node: null, type: '' },
                            paper: { ...paper, undo: false, new_object: null },
                            object: { ...object, id: 'fubar', altClick: true }
                        });
                    } else {
                        setMove({
                            ...move,
                            mouseDown: false,
                            meta: false,
                            alt: false,
                            ctrl: false,
                            target: { node: null, type: '' },
                            paper: { ...paper, undo: false, new_object: null }
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

                                let [id, obj_id, dir, end] = t.id.split(':');

                                let xform = t.transform.baseVal.getItem(0);
                                console.assert(xform.type === SVGTransform.SVG_TRANSFORM_TRANSLATE);
                                let x = xform.matrix.e;
                                let y = xform.matrix.f;

                                if (end === 'from') {
                                    dispatch(relationshipUpdateFrom({ id, from: { id: obj_id, x, y, dir } }));
                                } else {
                                    dispatch(relationshipUpdateTo({ id, to: { id: obj_id, x, y, dir } }));
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
                                rels: []
                            }
                        });
                    }
                }
                    break;

                case 'Relationship': {
                    let { relationship } = move;
                    let { x, y, obj_id, dir, id, end } = relationship;

                    let ui = paper_obj?.relationships[id];

                    if (end === 'from') {
                        dispatch(relationshipUpdate({
                            id, ui: {
                                ...ui, from:
                                    { id: obj_id, x, y, dir }
                            }
                        }));
                    } else {
                        dispatch(relationshipUpdate({
                            id, ui: {
                                ...ui,
                                to: { id: obj_id, x, y, dir }
                            }
                        }));
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
                    } else {
                        // console.log('forwarding mouesmove');
                        // // @ts-ignore
                        // mouseMoveCallbacks.map(([foo, bar]) => { if (foo !== null) foo(event) });
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
                    let { target, relationship } = move;
                    let { x, y } = relationship;

                    if (event.movementX !== 0 || event.movementY !== 0) {

                        x += event.movementX;
                        y += event.movementY;

                        let [x0, y0, dir0] = moveGlyph(x, y,
                            target.node!.parentNode as SVGGElement, paper_obj!)!;

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

let handleObjectResize = (move: MoveStruct, event: React.MouseEvent) => {
    if (event.movementX === 0 && event.movementY === 0) {
        return null;
    }

    let { object, target } = move;
    let { x, y, width, height, resizeDir } = object;

    let dirty_m = false;
    let dirty_r = false;

    // Resizing
    let dx = event.movementX;
    let dy = event.movementY;

    // Figure out what to change based on what's being dragged
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

    let parent = target!.node!.parentNode as SVGGElement;

    let xform = parent!.transform.baseVal.getItem(0);
    console.assert(xform.type === SVGTransform.SVG_TRANSFORM_TRANSLATE);

    let kids = parent.children;
    for (let i = 0; i < kids.length; i++) {
        let child = kids[i];

        // @ts-ignore
        let classes = child.className.baseVal.split('_');
        let type = classes[1];
        switch (type) {
            case 'objectRect':
                switch (resizeDir) {
                    case 'north':
                        // @ts-ignore
                        child.setAttribute('height', height);
                        xform.setTranslate(x, y);
                        dirty_m = true;
                        dirty_r = true;
                        break;

                    case 'south':
                        // @ts-ignore
                        child.setAttribute('height', height);
                        dirty_r = true;
                        break;

                    case 'east':
                        // @ts-ignore
                        child.setAttribute('width', width);
                        dirty_r = true;
                        break

                    case 'west':
                        // @ts-ignore
                        child.setAttribute('width', width);
                        xform.setTranslate(x, y);
                        dirty_m = true;
                        dirty_r = true;
                        break;

                    default:
                        break;
                }
                break;

            case 'objectBisectLine':
                // @ts-ignore
                child.setAttribute('x2', width);
                break;

            case 'objectName':
                // @ts-ignore
                child.setAttribute('x', width / 2);
                break;

            default:
                break;
        }

    }

    return {
        ...move,
        object: { ...object, width, height, x, y, dirty_m, dirty_r }
    };

}

let handleObjectMove = (paper_obj: PaperStore, move: MoveStruct, event: React.MouseEvent) => {
    if (event.movementX === 0 && event.movementY === 0) {
        return null;
    }

    let { object, target } = move;
    let { x, y, rels, width, height } = object;

    let parent = target!.node!.parentNode as SVGGElement;
    let id = parent!.id;

    x += event.movementX;
    y += event.movementY;

    let xform = parent!.transform.baseVal.getItem(0);
    console.assert(xform.type === SVGTransform.SVG_TRANSFORM_TRANSLATE);
    xform.setTranslate(x, y);

    if (rels.length === 0) {
        // Now find all the arrows connected to us.
        Object.keys(paper_obj.relationships)
            .map((r_id) => {
                let r = paper_obj.relationships[r_id];
                let from_id = r!.from.id;
                let to_id = r!.to.id;

                // id is the Object.id
                // We call makeGlyph with the x, y coordinates from the other end of the relationship
                if (from_id === id) {
                    let dir = r!.from.dir;
                    // @ts-ignore
                    let glyph = document.getElementById(`${r_id}:${from_id}:${dir}:from`) as SVGGElement;
                    // let xform = glyph.transform.baseVal.getItem(0);
                    // console.assert(xform.type === SVGTransform.SVG_TRANSFORM_TRANSLATE);
                    // let x = xform.matrix.e + event.movementX;
                    // let y = xform.matrix.f + event.movementY;
                    let x0 = r!.from.x;
                    let y0 = r!.from.y;
                    console.log(x, y, x0, y0);

                    moveGlyph(x, y, glyph, paper_obj!, { x0: x0, y0: y0, x1: x + width, y1: y + height });
                    rels.push({ target: glyph, x: x0, y: y0 });
                } else if (to_id === id) {
                    let dir = r!.to.dir;
                    // @ts-ignore
                    let glyph = document.getElementById(`${r_id}:${to_id}:${dir}:to`) as SVGGElement;
                    // let xform = glyph.transform.baseVal.getItem(0);
                    // console.assert(xform.type === SVGTransform.SVG_TRANSFORM_TRANSLATE);
                    // let x = xform.matrix.e + event.movementX;
                    // let y = xform.matrix.f + event.movementY;
                    let x0 = r!.to.x;
                    let y0 = r!.to.y;
                    console.log(x, y, x0, y0);

                    moveGlyph(x, y, glyph, paper_obj!, { x0: x0, y0: y0, x1: x + width, y1: y + height });
                    rels.push({ target: glyph, x: x0, y: y0 });
                }
            });
    } else {
        // Use the cached result. Note that it's using the location of the top left corner of the
        // object, and not the other end of the relationship. I guess this works.
        rels.map((r) => moveGlyph(r.x, r.y, r.target, paper_obj!, { x0: x, y0: y, x1: x + width, y1: y + height }));
    }

    return { ...move, object: { ...object, x, y, dirty_m: true, rels } };
}

let moveGlyph = (x: number, y: number, target: SVGGElement, paper: PaperStore, box?: Rect) => {
    let [id, obj_id, dir, end] = target.id.split(':');
    let orig_dir = dir;

    let obj_ui = paper.objects[obj_id];
    if (obj_ui === undefined) {
        console.error('undefined obj_ui', obj_id);
        return [x, y, ''];
    }

    let rel_ui = paper.relationships[id];
    if (rel_ui === undefined) {
        console.error('undefined rel_ui', id);
        return [x, y, ''];
    }

    let north = box ? box.y0 : obj_ui.y;
    let south = box ? box.y1 : obj_ui.y + obj_ui.height;
    let west = box ? box.x0 : obj_ui.x;
    let east = box ? box.x1 : obj_ui.x + obj_ui.width;

    let dx = x;
    let dy = y;
    // minimize the distance from the other end of the relationship, and not the mouse pointer.
    if (box) {
        if (end === 'from') {
            dx = rel_ui.to.x;
            dy = rel_ui.to.y;
        } else {
            dx = rel_ui.from.x;
            dy = rel_ui.from.y;
        }
    }

    // Find the point on the target boundary that minimizes the distance to (x, y).
    let d_north = distToSegmentSquared({ x: dx, y: dy }, { x: west, y: north }, { x: east, y: north });
    let d_west = distToSegmentSquared({ x: dx, y: dy }, { x: west, y: north }, { x: west, y: south });
    let d_south = distToSegmentSquared({ x: dx, y: dy }, { x: west, y: south }, { x: east, y: south });
    let d_east = distToSegmentSquared({ x: dx, y: dy }, { x: east, y: south }, { x: east, y: north });
    let mins = [d_north, d_west, d_south, d_east];

    let idx = mins.indexOf(Math.min(...mins));

    // This is sort of funky. I'm not even sure of what I want to accomplish. As it stands,
    // the location of the anchor is maintained, and the new location tries to match that of
    // the old location. That's the nested ternary operators.
    // I think what I'd like is for a less abrupt fallback.
    switch (idx) {
        case 0:
            dir = 'North';
            y = north;
            x = x < west ? west : x > east ? east : x;
            break;
        case 1:
            dir = 'West';
            x = west;
            // y = dy;
            y = y < north ? north : y > south ? south : y;
            break;
        case 2:
            dir = 'South';
            y = south;
            // x = dx;
            x = x < west ? west : x > east ? east : x;
            break;
        case 3:
            dir = 'East';
            x = east;
            // y = y <= north ? north + (south - north) / 2 : y >= south ? north + (south - north) / 2 : y;
            y = y < north ? north : y > south ? south : y;
            // y = dy;
            break;

        default:
            console.error('ooops', mins, idx);
            break;
    }

    // console.log(x, y, dx, dy, idx, mins.map(x => Math.sqrt(x)), north, south, east, west);

    // Move the glyph
    target.setAttribute('transform', makeTransform(x, y, dir));

    // this feels dirty
    if (orig_dir !== dir) {
        target.id = target.id.replace(orig_dir, dir);
    }
    // console.log(target, target.parentNode);

    // Move the line
    let grandParent = target.parentNode;
    let kids = grandParent!.children;
    for (let i = 0; i < kids.length; i++) {
        let child = kids[i];
        if (child instanceof SVGPathElement) {
            let d = '';
            if (end === "from") {
                let other = rel_ui.to;
                // @ts-ignore
                d = makeLine({ x, y, dir, id: '' }, other);

            } else {
                let other = rel_ui.from;
                // @ts-ignore
                d = makeLine(other, { x, y, dir, id: '' });
            }

            child.setAttribute('d', d);
        }
    }

    return [x, y, dir];
}

function sqr(x: number) { return x * x }
function dist2(v: Point, w: Point) { return sqr(v.x - w.x) + sqr(v.y - w.y) }
function distToSegmentSquared(p: Point, v: Point, w: Point) {
    var l2 = dist2(v, w);
    if (l2 == 0) return dist2(p, v);
    var t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return dist2(p, {
        x: v.x + t * (w.x - v.x),
        y: v.y + t * (w.y - v.y)
    });
}