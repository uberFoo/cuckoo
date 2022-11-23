import React from 'react';

import {
    ObjectStore, AttributeStore, RelationshipStore
} from '../../app/store';
import { selectObjectById, selectObjects } from './objectSlice';
import { Attribute } from '../attribute/Attribute';
import { selectAttributes } from '../attribute/attributeSlice';
import { getAttributeType, useAppSelector } from '../../app/hooks';
import { selectRelationships } from '../relationship/relationshipSlice';

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

export function ObjectWidget(props: ObjectProps) {
    let objects = useAppSelector(state => selectObjects(state));
    let object: ObjectStore | undefined = useAppSelector((state) => selectObjectById(state, props.id));

    console.log(objects);

    // let [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);

    // let contextMenuHandler = (event: React.MouseEvent) => {
    //     event.preventDefault();
    //     setContextMenu(
    //         contextMenu == null ? { x: event.clientX + 2, y: event.clientY - 6 } : null
    //     );
    // };

    let attributes: Array<AttributeStore> = useAppSelector((state) => selectAttributes(state));
    let attributeInstances: Array<AttributeStore> = attributes
        .filter(a => a.obj_id === props.id)
        .sort((a, b) => {
            if (a.id < b.id) {
                return -1
            } else if (a.id > b.id) {
                return 1;
            } else {
                return 0
            }
        });

    let relationships: Array<RelationshipStore> = useAppSelector((state) => selectRelationships(state));
    let relAttrs = relationships.filter(r => {
        // @ts-ignore
        if (r.Binary !== undefined) {
            // @ts-ignore
            if (r.Binary.from.obj_id === props.id) {
                return true;
            }
        }

        return false;
    }).map(r => {
        // @ts-ignore
        if (r.Binary !== undefined) {
            // @ts-ignore
            let obj = objects.filter(o => o.id === r.Binary.to.obj_id)[0];

            // @ts-ignore
            return { name: r.Binary.from.formalizing_attr, id: r.Binary.id, is_ref: true, type: `&${obj.name} (R${r.Binary.number})` };
        }
        return null;
        // @ts-ignore
    }).filter(r => r !== null).forEach(r => attributeInstances.push(r));;



    let attributeElements: Array<JSX.Element> = attributeInstances
        .map((a, i) => {
            let is_ref = false;
            if (a.is_ref !== undefined) {
                is_ref = a.is_ref;
            }
            return <Attribute key={a.id} id={a.id} name={a.name} type={a.type} is_ref={is_ref} index={i} />
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
