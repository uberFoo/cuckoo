import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Menu, MenuItem } from '@mui/material';

import { ObjectStore, AttributeStore } from '../../app/store';
import { selectObjectById } from './objectSlice';
import { Attribute } from '../attribute/Attribute';
import { selectAttributes } from '../attribute/attributeSlice';
import { useAppSelector } from '../../app/hooks';

import styles from './Object.module.css';

const textHeight = 20;
const cornerSize = 14;

interface ObjectProps {
    id: string,
    x: number,
    y: number,
    width: number,
    height: number,
    origin: { x: number, y: number },
};

export function Object(props: ObjectProps) {
    let object: ObjectStore | undefined = useAppSelector((state) => selectObjectById(state, props.id));

    // let [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);

    // let contextMenuHandler = (event: React.MouseEvent) => {
    //     event.preventDefault();
    //     setContextMenu(
    //         contextMenu == null ? { x: event.clientX + 2, y: event.clientY - 6 } : null
    //     );
    // };

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


    // let handleCtxClose = () => { setContextMenu(null) };

    // let contextMenuContent =
    //     <Menu
    //         open={contextMenu !== null}
    //         onClose={handleCtxClose}
    //         anchorReference="anchorPosition"
    //         anchorPosition={
    //             contextMenu !== null ? { top: contextMenu.x, left: contextMenu.y } : undefined
    //         }
    //     >
    //         <MenuItem>Undo</MenuItem>
    //         <MenuItem>Delete</MenuItem>
    //     </Menu>;


    return (
        <>
            {/* {contextMenu && ReactDOM.createPortal(contextMenuContent,
                document.getElementById('root') as Element)} */}
            <g key={props.id} id={props.id} className={"object"}
                transform={buildTransform(props.x, props.y)}
            >
                <rect className={styles.objectRect} width={props.width} height={props.height} />
                <text className={styles.objectName} x={props.width / 2} y={textHeight}>{object!.name}</text>
                <line className={styles.objectBisectLine} x1={0} y1={textHeight * 1.5} x2={props.width}
                    y2={textHeight * 1.5}
                />
                <g className={"attrGroup"} transform={"translate(10," + textHeight * 2.5 + ")"}>
                    {attributeElements}
                </g>
                {/* These are for resizing */}
                {/* East */}
                <line id={"east"} className={`${styles.resize} ${styles.relAttach} ${styles.ewResize}`}
                    x1={props.width} y1={cornerSize} x2={props.width} y2={props.height - cornerSize} />
                {/* North */}
                <line id={"north"} className={`${styles.resize} ${styles.relAttach} ${styles.nsResize}`}
                    x1={cornerSize} y1={"0"} x2={props.width - cornerSize} y2={0} />
                {/* West */}
                <line id={"west"} className={`${styles.resize} ${styles.relAttach} ${styles.ewResize}`}
                    x1={0} y1={cornerSize} x2={0} y2={props.height - cornerSize} />
                {/* South */}
                <line id={"south"} className={`${styles.resize} ${styles.relAttach} ${styles.nsResize}`}
                    x1={cornerSize} y1={props.height} x2={props.width - cornerSize} y2={props.height} />
            </g >
        </>
    );
}


function buildTransform(x: number, y: number) {
    return 'translate(' + x + ',' + y + ')'
}
