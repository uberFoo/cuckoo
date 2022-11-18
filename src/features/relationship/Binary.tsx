import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';

import { selectRelationshipsById } from './relationshipSlice';
import { selectObjectById } from '../object/objectSlice';
import { relationshipUpdate, selectObjectUIById } from '../paper/paperSlice';
import { RelationshipUI, Point, RelationshipStore } from '../../app/store';

import styles from './Relationship.module.css';
import { x } from '@tauri-apps/api/path-e12e0e34';

interface Move {
    mouseDown: boolean,
    target: SVGGElement | null,
    x: number,
    y: number,
    d: string
}

interface BinaryProps {
    id: string
    from: Point,
    to: Point,
    rel: RelationshipStore
    // uberFoo: any
}

export function Binary(props: BinaryProps) {
    let dispatch = useAppDispatch();

    let rel = props.rel;
    // @ts-ignore
    let binary = rel!.Binary;

    let fromObj = useAppSelector((state) => selectObjectById(state, binary.from.obj_id));
    let fromUI = useAppSelector((state) => selectObjectUIById(state, fromObj!.id));

    let toObj = useAppSelector((state) => selectObjectById(state, binary.to.obj_id));
    let toUI = useAppSelector((state) => selectObjectUIById(state, toObj!.id));

    let id_from = `${binary.id}:${fromObj!.id}`;
    let id_to = `${binary.id}:${toObj!.id}`;
    let line_id = `${id_from}:${id_to}`



    let [move, setMove] = useState<Move>({
        mouseDown: false,
        target: null,
        x: 0,
        y: 0,
        d: "M " + props.from.x + " " + props.from.y + " L " + props.to.x + " " + props.to.y
    });

    let onMouseDownHandler = (event: React.MouseEvent) => {
        event.stopPropagation();

        // props.uberFoo([onMouseMoveHandler, onMouseUpHandler]);

        let target = event.target as SVGElement;
        let parent: SVGGElement | null = target!.parentNode as SVGGElement;
        if (parent.id == id_from || parent.id == id_to) {
            let xform = parent!.transform.baseVal.getItem(0);
            console.assert(xform.type === SVGTransform.SVG_TRANSFORM_TRANSLATE);
            let matrix = xform.matrix;

            setMove({ ...move, mouseDown: true, target: parent, x: matrix.e, y: matrix.f });
        } else {
            if (parent.id === fromObj!.id) {
                target = (document.getElementById(id_from) as unknown) as SVGElement;
                parent = target!.parentNode as SVGGElement;

                setMove({ ...move, mouseDown: true, target: parent, x: props.from.x, y: props.from.y });
            } else if (parent.id === toObj!.id) {
                target = (document.getElementById(id_to) as unknown) as SVGElement;
                parent = target!.parentNode as SVGGElement;

                setMove({ ...move, mouseDown: true, target: parent, x: props.to.x, y: props.to.y });
            } else {
                console.log("I don't know to whom I'm attached.", parent);
            }
        }
    };

    let onMouseMoveHandler = (event: React.MouseEvent) => {
        event.stopPropagation();

        // props.uberFoo([onMouseMoveHandler, onMouseUpHandler]);

        let dx = event.movementX;
        let dy = event.movementY;

        let { mouseDown, target, x, y, d } = move;

        x += dx;
        y += dy;

        if (mouseDown) {
            if (target?.id === id_from) {
                if (x < fromUI!.x) {
                    x = fromUI!.x;
                } else if (x > fromUI!.x + fromUI!.width) {
                    x = fromUI!.x + fromUI!.width;
                }

                if (y < fromUI!.y) {
                    y = fromUI!.y;
                } else if (y > fromUI!.y + fromUI!.height) {
                    y = fromUI!.y + fromUI!.height;
                }

                d = "M " + x + " " + y + " L " + props.to.x + " " + props.to.y;
            } else if (target?.id === id_to) {
                if (x < toUI!.x) {
                    x = toUI!.x;
                } else if (x > toUI!.x + toUI!.width) {
                    x = toUI!.x + toUI!.width;
                }

                if (y < toUI!.y) {
                    y = toUI!.y;
                } else if (y > toUI!.y + toUI!.height) {
                    y = toUI!.y + toUI!.height;
                }

                d = "M " + props.from.x + " " + props.from.y + " L " + x + " " + y
            } else {
                console.error("WTF?");
            }

            let xform = target!.transform.baseVal.getItem(0);
            xform.setTranslate(x, y);

            setMove({ ...move, x, y, d });
        }
    };

    let onMouseUpHandler = (event: React.MouseEvent) => {
        event.stopPropagation()

        let { x, y, target, mouseDown } = move;

        if (mouseDown) {
            // Turn off the spigot. React.useState can't keep up with the events.
            // props.uberFoo([null, null]);

            if (target?.id === id_from) {
                dispatch(relationshipUpdate({ id: props.id, ui: { from: { x, y }, to: props.to } }));
            } else if (target?.id === id_to) {
                dispatch(relationshipUpdate({ id: props.id, ui: { to: { x, y }, from: props.from } }));
            } else {
                console.error('fubared again', target);
            }
        }

        setMove({ ...move, mouseDown: false, target: null });
    };

    return (
        <>
            <g id={id_from} key={id_from} className={styles.relAnchor}
                transform={"translate(" + props.from.x + "," + props.from.y + ") rotate(270)"}
                onMouseDown={onMouseDownHandler} onMouseUp={onMouseUpHandler}
                onMouseMove={onMouseMoveHandler} onMouseLeave={onMouseUpHandler}
            >
                {/* This makes the arrows easier to drag. */}
                <rect x={0} y={-25} width={50} height={50} fillOpacity={0} strokeOpacity={0} />
                <path d={"M 20 -10 L 0 0 L 20 10 M 35 -10 L 15 0 L 35 10 M 0 0 L 40 0"} />
            </g>
            <g id={id_to} key={id_to} className={styles.relAnchor}
                transform={"translate(" + props.to.x + "," + props.to.y + ") rotate(90)"}
                onMouseDown={onMouseDownHandler} onMouseUp={onMouseUpHandler}
                onMouseMove={onMouseMoveHandler} onMouseLeave={onMouseUpHandler}
            >
                <rect x={0} y={-25} width={50} height={50} fillOpacity={0} strokeOpacity={0} />
                <path d={"M 20 -10 L 0 0 L 20 10 M 0 0 L 40 0"} />
            </g>
            <path id={line_id} className={styles.relLine} d={move.d} />
            <text className={styles.relName} x={(props.to.x + props.from.x) / 2}
                y={(props.to.y + props.from.y) / 2}>{"R" + binary.number}</text>
        </>
    );
};