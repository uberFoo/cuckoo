import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Menu, MenuItem } from '@mui/material';
import { ActionCreators as UndoActionCreators } from 'redux-undo';
import storage from 'redux-persist/lib/storage';
import { ErrorBoundary } from 'react-error-boundary';

import { ObjectWidget } from '../object/Object';
import { BinaryUI, IsaUI, Isa, Binary, Rect, ObjectUI, RelationshipUI, BinaryEnd } from '../../app/store';
import { Relationship } from '../relationship/Relationship';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import {
    addObjectToPaper, selectPaperSingleton, objectResizeBy, objectMoveTo,
    relationshipUpdateBinaryFrom, relationshipUpdateBinaryTo, removeObjectFromPaper,
    relationshipUpdateIsaFrom, relationshipUpdateIsaTo, savePaperOffset,
    relationshipUpdateBinaryRelPhrase, addRelationshipToPaper, removeRelationshipFromPaper, relationshipAddTargetToIsa
} from './paperSlice';
import ObjectEditor from '../object/ObjectDialog';
import BinaryEditor from '../relationship/BinaryDialog';
import IsaEditor from '../relationship/IsaDialog';
import { removeObject, addObject } from '../object/objectSlice';
import {
    handleObjectMove, handleObjectResize, moveGlyph, selectWidgetGElements, getId,
    parseTransform, makeTransform2, get_parent_with_id
}
    from '../../app/utils';
import { addRelationship, removeRelationship, addTargetToIsa } from '../relationship/relationshipSlice';

import styles from './Paper.module.css';

function ErrorFallback({ error, resetErrorBoundary }: any) {
    return (
        <div role="alert">
            <p>Something went wrong:</p>
            <pre style={{ color: 'red' }}>{error.message}</pre>
            <button onClick={resetErrorBoundary}>Undo</button>
        </div>
    )
}

const defaultGridSize = 25;
const defaultScale = 1.0;
// const minScale = 0.4;
// const maxScale = 4.5;

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
        new_object: NewObject,
        selection: NewObject,
        selected_g: Array<SVGGElement> | null
    },
    object: {
        id: string,
        x: number,
        y: number,
        width: number,
        height: number,
        resizeDir: Direction,
        object_dialog: boolean,
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
        dir: string | null,
        x: number,
        y: number,
        dx: number,
        dy: number,
        relationship_dialog: boolean,
        relationship_type: string
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
            new_object: null,
            selection: null,
            selected_g: null,
        },
        object: {
            id: '',
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            resizeDir: null,
            object_dialog: false,
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
            dir: null,
            dx: 0,
            dy: 0,
            relationship_dialog: false,
            relationship_type: ''
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

                // The Nuclear Option. Delete local storage.
                if (event.altKey && event.metaKey && event.shiftKey && event.ctrlKey) {
                    storage.removeItem('persist:root');
                    window.location.reload();
                    return;
                }

                if (event.altKey) {
                    // Start an undo
                    setMove({
                        ...move, mouseDown: true, target: { node: target, type }, alt: true
                    });
                    return;

                } else if (event.shiftKey) {
                    // Do a redo
                    setMove({
                        ...move, mouseDown: true, target: { node: target, type }, shift: true
                    });
                    return;

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
                    return;

                } else if (event.ctrlKey) {
                    // This is for a context menu. Don't need to do anything.
                    // I'm stealing this for grouped widget move.
                    if (paper.selection) {
                        let { origin_x, origin_y } = move;

                        let x = event.clientX - origin_x;
                        let y = event.clientY - origin_y;

                        let { x0, y0, x1, y1 } = paper.selection;
                        let selected = paper.selected_g;

                        //
                        // Clicked outside the selection area. Persist changes.
                        //
                        if (x < x0 || x > x1 || y < y0 || y > y1) {
                            selected?.forEach(g => {
                                let xform = g?.transform.baseVal.getItem(0);
                                console.assert(xform.type === SVGTransform.SVG_TRANSFORM_TRANSLATE);
                                let x = xform.matrix.e;
                                let y = xform.matrix.f;

                                let type = g.className.baseVal.split('_')[0];

                                switch (type) {
                                    case 'Relationship':
                                        let [id, obj_id, type, dir, end] = getId(g)?.split(':')!;

                                        if (!end) {
                                            console.error('oh no', end);
                                            break;
                                        }
                                        let ui = paper_obj?.relationships[id];

                                        if (type === 'binary') {
                                            if (end === 'from') {
                                                // @ts-ignore
                                                let from = ui!.BinaryUI.from;
                                                dispatch(relationshipUpdateBinaryFrom({
                                                    id,
                                                    from: { ...from, id: obj_id, x, y, dir },
                                                    tag: 'uberFoo'
                                                }));
                                            } else {
                                                // @ts-ignore
                                                let to = ui!.BinaryUI.to;
                                                dispatch(relationshipUpdateBinaryTo({
                                                    id,
                                                    to: { ...to, id: obj_id, x, y, dir },
                                                    tag: 'uberFoo'
                                                }));
                                            }
                                        } else if (type === 'isa') {
                                            if (end === 'from') {
                                                // @ts-ignore
                                                let isa_ui = ui!.IsaUI;
                                                let from = isa_ui?.from;

                                                dispatch(relationshipUpdateIsaFrom({
                                                    id, new_from: { ...from, x, y, dir },
                                                    tag: 'uberFoo'
                                                }));
                                            } else {
                                                // @ts-ignore
                                                let isa_ui = ui!.IsaUI;

                                                isa_ui.to.forEach((rel_ui: BinaryEnd, index: number) => {
                                                    if (rel_ui.id === obj_id) {
                                                        dispatch(relationshipUpdateIsaTo({
                                                            id, index, new_to: { ...rel_ui, x, y, dir },
                                                            tag: 'uberFoo'
                                                        }
                                                        ));
                                                    }
                                                });
                                            }
                                        }
                                        break;
                                    case 'Object':
                                        if (!g.id) {
                                            break;
                                        }

                                        dispatch(objectMoveTo({
                                            id: getId(g), x, y,
                                            tag: 'uberFoo'
                                        }));
                                        break;

                                    default:
                                        break;
                                }
                            });

                            setMove({
                                ...move, mouseDown: true, paper: { ...paper, selection: null },
                                target: { node: target, type }
                            });
                            return;

                        } else {
                            // We clicked outside the selection so we reset everything and treat
                            // this as a panning event.
                            setMove({ ...move, mouseDown: true, target: { node: target, type } });
                            return;
                        }
                    } else {
                        // Panning the selection.
                        let { origin_x, origin_y } = move;

                        let x = event.clientX - origin_x;
                        let y = event.clientY - origin_y;

                        setMove({
                            ...move,
                            mouseDown: true,
                            target: { node: target, type },
                            ctrl: true,
                            paper: {
                                ...paper,
                                selection: {
                                    x0: x, y0: y,
                                    x1: x, y1: y
                                }
                            }
                        });
                    }

                    return;
                } else {
                    // No modifier keys means that we are panning.
                    // At a minimum we need to record that the mouse was down. And the target too!
                    setMove({
                        ...move, mouseDown: true, target: { node: target, type }
                    });
                }
            }
                break;

            case 'Object': {
                let { origin_x, origin_y, object } = move;

                let root = target.parentNode as SVGGElement;
                let canvas = root?.parentNode;

                // This moves our <g> to the bottom on the list so that it draws above the others.
                canvas?.removeChild(root!);
                canvas?.appendChild(root!);

                let id = getId(root)!;
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
                    dispatch(removeObject(id));
                } else {
                    // Default dragging
                    let dir = target.id as Direction;
                    setMove({
                        ...move,
                        mouseDown: true,
                        target: { node: target, type },
                        object: {
                            ...object,
                            id, x, y, width, height,
                            resizeDir: dir,
                            object_dialog: false,
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
                let { x, y } = relationship;

                let root = target.parentNode as SVGGElement;
                let rel_type = target.className.baseVal.split('_')[1];

                if (event.ctrlKey) {
                    // Delete
                    let id = getId(target)?.split(':')[0]!;

                    dispatch(removeRelationshipFromPaper({ id }));
                    dispatch(removeRelationship(id));

                    // return early -- leave move alone.
                    return;

                } else if (event.altKey) {
                    // This brings up the relationship editor.
                    target = get_parent_with_id(target);
                    let rel_id = getId(target)?.split(':')[0]!;
                    let rel = paper_obj!.relationships[rel_id];
                    let type = Object.keys(rel!)[0];

                    setMove({
                        ...move,
                        target: { node: target, type },
                        alt: true,
                        relationship: {
                            ...relationship, id: rel_id, relationship_type: type,
                            relationship_dialog: true
                        }
                    });
                    return;

                } else if (rel_type === 'relPhrase') {
                    let [id, end] = getId(target)?.split(':')!;

                    x = Number(target.getAttribute('x'));
                    y = Number(target.getAttribute('y'));

                    setMove({
                        ...move, mouseDown: true,
                        target: { node: target, type },
                        relationship: {
                            id: id,
                            obj_id: '',
                            parent: root,
                            end,
                            dir: '',
                            x,
                            y,
                            dx: 0,
                            dy: 0,
                            relationship_type: '',
                            relationship_dialog: false
                        }
                    })
                    return;

                } else if (rel_type === 'relGlyph' || rel_type === 'relBoxAssist') {
                    let [id, obj_id, _type, dir, end] = getId(root)?.split(':')!;

                    // Dragging the relationship arrows
                    let ui = paper_obj!.relationships[id] as RelationshipUI;

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
                            y,
                            dx: 0,
                            dy: 0,
                            relationship_type: '',
                            relationship_dialog: false
                        }
                    });
                    return;
                }
            }

                console.error("you can't see this");
                break;

            default:
                break;
        }
    };

    let onMouseUpHandler = (event: React.MouseEvent) => {
        event.preventDefault();

        let { mouseDown } = move;

        if (mouseDown) {
            let { target } = move;
            let new_obj = false;
            switch (target.type) {
                case 'Paper': {
                    let { mouseDown, paper, object, meta, alt, shift, ctrl } = move;

                    if (mouseDown) {
                        if (ctrl) {
                            let last = paper.selection;
                            let selected = selectWidgetGElements(last!);

                            setMove({
                                ...move,
                                mouseDown: false,
                                meta: false,
                                alt: false,
                                ctrl: false,
                                shift: false,
                                target: { node: null, type: '' },
                                // @ts-ignore
                                paper: { ...paper, new_object: null, selected_g: selected }
                            });
                            return;

                        } else if (alt) {
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

                                dispatch(addObject({
                                    id: "fubar", name: "New Object",
                                    description: "", attributes: {}
                                }));
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
                            object: { ...object, id: 'fubar', object_dialog: true }
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
                    let { object_dialog, width, height, x, y, dirty_m, dirty_r, rels } = object;

                    let parent = target.node?.parentNode as SVGGElement;
                    let id = getId(parent)!;

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

                                let [id, obj_id, _type, dir, end] = getId(t)?.split(':')!;
                                let ui = paper_obj?.relationships[id];

                                let xform = t.transform.baseVal.getItem(0);
                                console.assert(xform.type === SVGTransform.SVG_TRANSFORM_TRANSLATE);
                                let x = xform.matrix.e;
                                let y = xform.matrix.f;

                                if (type === 'binary') {
                                    if (end === 'from') {
                                        // @ts-ignore
                                        let from = ui!.BinaryUI.from;
                                        dispatch(relationshipUpdateBinaryFrom({
                                            id,
                                            from: { ...from, id: obj_id, x, y, dir }
                                        }));
                                    } else {
                                        // @ts-ignore
                                        let to = ui!.BinaryUI.to;
                                        dispatch(relationshipUpdateBinaryTo({
                                            id,
                                            to: { ...to, id: obj_id, x, y, dir }
                                        }));
                                    }
                                } else if (type === 'isa') {
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
                            object_dialog = true;
                        } else if (meta) {
                            // Draw a line for a relationsship.
                            let { line, x, y, width, height } = object;

                            if (line === null) {
                                console.error("this sucks");
                                return;
                            }

                            let start_obj = id;
                            let target = event.target as SVGElement;
                            let type = target.className.baseVal.split('_')[1];
                            if (type === 'objectRect') {
                                let parent = target.parentNode as SVGGElement;
                                let end_obj = getId(parent)!;

                                // let xform = parent.transform.baseVal.getItem(0);
                                // console.assert(xform.type === SVGTransform.SVG_TRANSFORM_TRANSLATE);
                                // let end_x = xform.matrix.e;
                                // let end_y = xform.matrix.f;
                                // let end_width = Number(target.getAttribute('width'));
                                // let end_height = Number(target.getAttribute('height'));


                                // Doh! I just realized that I don't know which edge was dragged over.
                                // If I figure that out I can do the arrow directions properly.
                                // It's tricky. The line mostly likely will intercept each object
                                // twice. I'd need to figure out which ones to use. Sounds like a
                                // minimization problem. Not worthwhile atm.
                                // let from_intersection = intersection(
                                //     { x: line.x0, y: line.y0 },
                                //     { x: line.x1, y: line.y1 },
                                //     { x, y },
                                //     { x: x + width, y: y + height }
                                // );

                                // let to_intersection = intersection(
                                //     { x: line.x0, y: line.y0 },
                                //     { x: line.x1, y: line.y1 },
                                //     { x: end_x, y: end_y },
                                //     { x: end_x + end_width, y: end_y + end_height }
                                // );

                                // console.log(from_intersection, to_intersection);

                                let relationship_ui: BinaryUI = {
                                    from: {
                                        id: start_obj,
                                        x: line!.x0,
                                        y: line!.y0,
                                        // x: from_intersection!.x,
                                        // y: from_intersection!.y,
                                        offset: {
                                            x: 20,
                                            y: 20
                                        },
                                        dir: 'East'
                                    },
                                    to: {
                                        id: end_obj,
                                        x: line?.x1,
                                        y: line?.y1,
                                        // x: to_intersection!.x,
                                        // y: to_intersection!.y,
                                        offset: {
                                            x: 20,
                                            y: 20
                                        },
                                        dir: 'West'
                                    }
                                };

                                let relationship_state: Binary = {
                                    id: 'foo',
                                    number: 888,
                                    from: {
                                        obj_id: start_obj,
                                        description: '',
                                        cardinality: 'One',
                                        conditionality: 'Unconditional',
                                        formalizing_attribute_name: ''
                                    },
                                    to: {
                                        obj_id: end_obj,
                                        description: '',
                                        cardinality: 'One',
                                        conditionality: 'Unconditional'
                                    }
                                };

                                // @ts-ignore
                                dispatch(addRelationship({ id: 'foo', payload: { Binary: relationship_state } }));
                                dispatch(addRelationshipToPaper({ id: 'foo', payload: { BinaryUI: relationship_ui } }));
                                let { relationship } = move;
                                setMove({
                                    ...move,
                                    mouseDown: false,
                                    meta: false,
                                    object: {
                                        ...object,
                                        line: null
                                    },
                                    relationship: {
                                        ...relationship, id: 'foo',
                                        relationship_type: 'BinaryUI',
                                        relationship_dialog: true
                                    }
                                });
                                return;
                            } else if (type === 'relGlyph' || type === 'relBoxAssist' ||
                                type === 'relName') {
                                // We must be adding a to object to an Isa relationship
                                // @ts-ignore
                                target = get_parent_with_id(target);
                                let [rel_id, to_obj, ...foo] = getId(target)?.split(':')!;
                                // @ts-ignore
                                // let rel_ui = paper_obj!.relationships[rel_id].IsaUI as IsaUI;
                                let to_end: BinaryEnd = ({
                                    id: start_obj,
                                    x: line!.x0,
                                    y: line!.y0,
                                    offset: {
                                        x: 20,
                                        y: 20
                                    },
                                    dir: 'West'
                                });

                                dispatch(addTargetToIsa({ rel_id, to: start_obj }));
                                dispatch(relationshipAddTargetToIsa({ id: rel_id, to_end: to_end }));
                                setMove({
                                    ...move,
                                    mouseDown: false,
                                    meta: false,
                                    object: {
                                        ...object,
                                        line: null
                                    },
                                    relationship: {
                                        ...relationship, id: 'foo',
                                        relationship_type: 'IsaUI',
                                        relationship_dialog: true
                                    }
                                });
                            } else {
                                // You must have dragged it to the paper. Create a new Isa.
                                let relationship_ui: IsaUI = {
                                    from: {
                                        id: start_obj,
                                        x: line!.x0,
                                        y: line!.y0,
                                        offset: {
                                            x: 20,
                                            y: 20
                                        },
                                        dir: 'South'
                                    },
                                    to: []
                                };

                                let relationship_state: Isa = {
                                    id: 'foo',
                                    number: 888,
                                    obj_id: start_obj,
                                    subtypes: []
                                };

                                // @ts-ignore
                                dispatch(addRelationship({ id: 'foo', payload: { Isa: relationship_state } }));
                                dispatch(addRelationshipToPaper({ id: 'foo', payload: { IsaUI: relationship_ui } }));
                                let { relationship } = move;
                                setMove({
                                    ...move,
                                    mouseDown: false,
                                    meta: false,
                                    object: {
                                        ...object,
                                        line: null
                                    },
                                    relationship: {
                                        ...relationship, id: 'foo',
                                        relationship_dialog: false
                                    }
                                });
                                return;
                            }
                        }


                        setMove({
                            ...move,
                            mouseDown: false,
                            alt: false,
                            meta: false,
                            ctrl: false,
                            target: { node: null, type: '' },
                            object: {
                                ...object, resizeDir: null, object_dialog, dirty_m: false, dirty_r: false,
                                line: null
                            }
                        });
                    }
                }
                    break;

                case 'Relationship': {
                    let { relationship, target } = move;
                    let { x, y, obj_id, dir, id, end, relationship_type, relationship_dialog }
                        = relationship;

                    // These, among others, aren't defined when a relPhrase is dragged.
                    if (dir !== null && obj_id !== undefined) {
                        let ui = paper_obj?.relationships[id];

                        switch (Object.keys(ui!)[0]) {
                            case 'BinaryUI':
                                if (end === 'from') {
                                    // @ts-ignore
                                    let from = ui!.BinaryUI.from;
                                    dispatch(relationshipUpdateBinaryFrom({
                                        id,
                                        from: { ...from, id: obj_id, x, y, dir }
                                    }));
                                } else if (end === 'to') {
                                    // @ts-ignore
                                    let to = ui!.BinaryUI.to;
                                    dispatch(relationshipUpdateBinaryTo({
                                        id,
                                        to: { ...to, id: obj_id, x, y, dir }
                                    }));
                                } else {
                                    console.error('unknown end', end);
                                }
                                break;
                            case 'IsaUI': {
                                // @ts-ignore
                                let isa_ui = ui.IsaUI;

                                if (end === 'from') {
                                    dispatch(relationshipUpdateIsaFrom({
                                        id, new_from: { ...isa_ui.from, x, y, dir }
                                    }));
                                } else if (end === 'to') {
                                    isa_ui.to.forEach((to_ui: BinaryEnd, index: number) => {
                                        if (to_ui.id === obj_id) {
                                            dispatch(relationshipUpdateIsaTo({
                                                id, index, new_to: { ...to_ui, x, y, dir }
                                            }))
                                        }
                                    })
                                } else {
                                    console.error('unknown end', end);
                                }
                            }
                                break;

                            default:
                                console.error('unknown relationship ui', ui!);
                                break
                        }
                    } else if (target!.node!.className.baseVal.split('_')[1] === 'relPhrase') {
                        // Assume rel phrase drag
                        let { dx, dy } = relationship;
                        dispatch(relationshipUpdateBinaryRelPhrase({ id, end, offset: { x: dx, y: dy } }));
                    }

                    setMove({
                        ...move,
                        mouseDown: false,
                        alt: false,
                        meta: false,
                        ctrl: false,
                        target: { node: null, type: '' },
                        relationship: {
                            id,
                            obj_id: '',
                            end: '',
                            x: 0,
                            y: 0,
                            dir: null,
                            dx: 0,
                            dy: 0,
                            relationship_type,
                            relationship_dialog
                        }
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
        event.preventDefault();

        let { mouseDown } = move;

        if (mouseDown) {
            let { target } = move;

            switch (target.type) {
                case 'Paper': {
                    let { mouseDown, paper, meta, ctrl } = move;

                    if (mouseDown) {
                        if (ctrl) {
                            let last = paper.selection;
                            let { x1, y1 } = last!;

                            // New Selection
                            x1 += event.movementX;
                            y1 += event.movementY;

                            setMove({
                                ...move,
                                paper: {
                                    ...paper,
                                    selection:
                                    {
                                        ...last!,
                                        x1, y1
                                    }
                                }
                            });
                        } else if (meta) {
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
                            if (paper.selection) {
                                let { origin_x, origin_y } = move;
                                let last = paper.selection;
                                let selected = paper.selected_g;
                                let { x0, y0, x1, y1 } = last!;

                                x0 += event.movementX;
                                y0 += event.movementY;
                                x1 += event.movementX;
                                y1 += event.movementY;

                                let x = event.clientX - origin_x;
                                let y = event.clientY - origin_y;

                                if (x < x0 || x > x1 || y < y0 || y > y1) {
                                    // Moving outside of the selection area. Just pan the paper.
                                    // Panning -- super important. We are maintaining our origin
                                    origin_x += event.movementX;
                                    origin_y += event.movementY;

                                    // This forces an update -- good here.
                                    setMove({ ...move, origin_x, origin_y });
                                    return;
                                }

                                // We need to scoop up all the g elements within our bounds.
                                selected?.forEach(g => {
                                    let xform = g?.getAttribute('transform');
                                    let values = parseTransform(xform);
                                    let x = 0;
                                    let y = 0;
                                    let rotate = 0;
                                    // @ts-ignore
                                    if (values.translate) {
                                        // @ts-ignore
                                        [x, y] = values.translate;
                                    }
                                    // @ts-ignore
                                    if (values.rotate) {
                                        // @ts-ignore
                                        rotate = values.rotate[0]
                                    }

                                    g?.setAttribute('transform',
                                        makeTransform2(+x + event.movementX, +y + event.movementY,
                                            +rotate));
                                });

                                setMove({
                                    ...move,
                                    paper: {
                                        ...paper,
                                        selection:
                                        {
                                            x0, y0, x1, y1
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
                            setMove({ ...move, object: { ...object, line } });

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
                    let { x, y, parent, dx, dy } = relationship;

                    if (parent === undefined) {
                        console.error('undefined parent node');
                        break;
                    }

                    if (event.movementX !== 0 || event.movementY !== 0) {

                        x += event.movementX;
                        y += event.movementY;
                        dx += event.movementX;
                        dy += event.movementY;

                        let type = target.node!.className.baseVal.split('_')[1];

                        let x0 = x;
                        let y0 = y;
                        let dir0 = null;

                        if (type === 'relGlyph' || type === 'relBoxAssist') {
                            [x0, y0, dir0] = moveGlyph(x, y, parent, paper_obj!)!;
                        } else if (type === 'relPhrase') {
                            target.node!.setAttribute('x', `${x}`);
                            target.node!.setAttribute('y', `${y}`);
                        }

                        setMove({
                            ...move, relationship: {
                                ...relationship, x: x0, y: y0, dir: dir0, dx, dy
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

    let doubleClickHandler = (event: React.MouseEvent) => {
        event.preventDefault();

        let target = event.target as SVGElement;
        let type = target.className.baseVal.split('_')[0];

        switch (type) {
            case 'Paper':
                window.location.reload()
                break;
            case 'Object':
                // This brings up the object editor.
                setMove({
                    ...move, object: { ...move.object, object_dialog: true }
                });
                break;
            case 'Relationship': {
                target = get_parent_with_id(target);
                let rel_id = getId(target)?.split(':')[0]!;
                let rel = paper_obj!.relationships[rel_id];
                let type = Object.keys(rel!)[0];
                setMove({
                    ...move, relationship: {
                        ...move.relationship,
                        relationship_dialog: true,
                        relationship_type: type
                    }
                });
            }
                break;
            default:
                console.error('unknown double click target', type);
                break;
        }

    };

    let contextMenuHandler = (event: React.MouseEvent) => {
        event.preventDefault();
        let { origin_x, origin_y } = move;
        setContextMenu(
            contextMenu == null ? { x: event.clientX + 2, y: event.clientY - 6 } : null
        );
    };

    let handleCtxClose = () => {
        setMove({ ...move, mouseDown: false });
        setContextMenu(null)
    };

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

    let select_box = null;
    if (move.paper.selection) {
        let { x0, y0, x1, y1 } = move.paper.selection;
        let width = x1 - x0;
        let height = y1 - y0;

        select_box = <rect className={styles.antLine} x={x0} y={y0} width={width}
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
        if (move.object.object_dialog) {
            let { object } = move;
            setMove({ ...move, mouseDown: false, object: { ...object, object_dialog: false } });
        } else if (move.relationship.relationship_dialog) {
            let { relationship } = move;
            setMove({
                ...move, relationship: { ...relationship, relationship_dialog: false }
            });
        }
    }

    let { origin_x, origin_y, object, relationship } = move;
    let { line } = object;

    if (contextMenu) {
        // @ts-ignore
        return ReactDOM.createPortal(contextMenuContent, document.getElementById('root'));
    } else {
        return (
            <ErrorBoundary
                FallbackComponent={ErrorFallback}
                onReset={() => dispatch(UndoActionCreators.undo())}
            >
                {object.object_dialog &&
                    // @ts-ignore
                    <ObjectEditor enabled={true} obj_id={move.object.id} ns={props.domain_ns}
                        done={doneEditing}
                    />
                }
                {relationship.relationship_dialog && relationship.relationship_type === 'BinaryUI' &&
                    // @ts-ignore
                    <BinaryEditor id={move.relationship.id} ns={props.domain_ns}
                        done={doneEditing}
                    />
                }
                {relationship.relationship_dialog && relationship.relationship_type === 'IsaUI' &&
                    // @ts-ignore
                    <IsaEditor id={move.relationship.id} ns={props.domain_ns} done={doneEditing}
                    />
                }
                <svg id="svg-root" width={paper_obj!.width} height={paper_obj!.height}
                    xmlns='http://www.w3.org/2000/svg'
                >

                    {/* I guess there's a portal for the context menu. Makes sense, it was just
                    difficult to notice.
                     */}
                    {/* @ts-ignore */}
                    {ReactDOM.createPortal(contextMenuContent, document.getElementById('root'))}

                    <g id="paper" pointerEvents="all"
                        transform={"translate(" + origin_x + "," + origin_y + ") scale(" +
                            defaultScale + ")"}
                        onMouseDown={onMouseDownHandler} onMouseUp={onMouseUpHandler}
                        onMouseMove={onMouseMoveHandler} onMouseLeave={onMouseUpHandler}
                        onContextMenu={e => e.preventDefault()}
                        onDoubleClick={doubleClickHandler}
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
                                <line className={styles.antLine} x1={line.x0} y1={line.y0}
                                    x2={line.x1} y2={line.y1} />
                            }
                            <g id="objects">
                                {objectInstances}
                            </g>
                            <g id="relationships">
                                {relInsts}
                            </g>
                            {move.paper.selection !== null && select_box}
                        </g>
                    </g >
                </svg>
            </ErrorBoundary>
        )
    }
}
