import React, { FormEvent } from 'react';
import { useFormik } from 'formik';
import {
    Dialog, DialogTitle, TextField, DialogContent, DialogActions, Button, FormGroup, FormLabel,
    List, ListItemButton, ListItemText, ListItemSecondaryAction, IconButton, FormControl,
    InputLabel, Select, MenuItem, SelectChangeEvent, Divider
} from '@mui/material';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { v5 as uuid } from 'uuid';

import { AttributeStore, Type } from '../../app/store';
import { selectAttributes } from '../attribute/attributeSlice';
import { useAppSelector, useAppDispatch, getAttributeType } from '../../app/hooks';
import { replaceObject, selectObjectById } from './objectSlice';
import { objectChangeId } from '../paper/paperSlice';
import { updateObjectReference, updateReferentialAttribute, addAttribute, removeAttribute } from '../attribute/attributeSlice'

interface Props {
    enabled: boolean,
    obj_id: string,
    ns: string,
    done: () => void
}

let TYPES = ['Uuid', 'String', 'Integer', 'Float', 'Boolean'];

// Modal.setAppElement('#modal-root');
const ObjectEditor = (props: Props) => {
    let dispatch = useAppDispatch();

    let object = useAppSelector((state) => selectObjectById(state, props.obj_id));
    let attributes: Array<AttributeStore> = useAppSelector((state) => selectAttributes(state));
    const formik = useFormik({
        initialValues: {
            // @ts-ignore
            objectName: object.name,
        },
        onSubmit: (values) => save(values)
    });
    let [attrType, setAttrType] = React.useState('');

    if (object === undefined) {
        console.error("can't find object in the store", props.obj_id);
        return;
    }

    let obj_attrs = attributes.filter((a) => a.obj_id === props.obj_id);

    let save = (values: { objectName: string }) => {
        // @ts-ignore
        if (values.objectName !== object.name) {
            let new_id = uuid(values.objectName, props.ns);
            // If the name changed then so will the id, which is how our attributes refer to us. We
            // also need to update any referential attributes.
            attributes
                .filter((a) => a.obj_id === props.obj_id)
                .map((a) => dispatch(updateObjectReference({ id: a.id, obj_id: new_id })));
            attributes
                .filter((a) => typeof a.type === 'object' && a.type.foreign_key === props.obj_id)
                .map((a) => dispatch(updateReferentialAttribute({ id: a.id, obj_id: new_id })));

            let new_obj = { ...object, id: new_id, name: values.objectName };

            // Order is probably importannt
            dispatch(objectChangeId({ id: new_id, old_id: props.obj_id }));
            dispatch(replaceObject({ object: new_obj, old_id: props.obj_id }));
        }

        props.done();
    }

    let cancel = () => {
        props.done();
    }

    let handleSubmit: (e?: React.FormEvent<HTMLElement> | undefined) => void = (e) => {
        // Poor thing doesn't know that I don't give a shit about the event itself.
        formik.handleSubmit(e as any);
    }

    let handleAttrTypeChange = (event: SelectChangeEvent) => {
        setAttrType(event.target.value);
    }

    let handleAttrSelect = (e: React.MouseEvent<HTMLSpanElement>) => {
        // The commented out stuff is broken. This may help:
        // const handleClick = (index: number) => {
        //     if (selectedList.includes(index)) {
        //         setSelectedList(
        //             selectedList.filter(function (value) {
        //                 return value !== index;
        //             }
        //             )
        //         );
        //     } else {
        //         setSelectedList([...selectedList, index]);
        //     }
        // }

        // //JSX
        // <MenuItem
        //     onClick={() => handleClick(1)}
        //     selected={selectedList.includes(1)}
        // />

        let target = e.target;
        // @ts-ignore
        let raw = target.textContent
        let [name, type] = raw.split(':').map((s: string) => s.trim());

        let nameBox = document.getElementById('attributeName') as HTMLInputElement;
        // let typeSel = document.getElementById('attr-select');
        // let typeSelValue = typeSel?.nextElementSibling;

        nameBox!.value = name;
        // typeSelValue!.value = type;
    }

    let handleAddAttr = () => {
        let element = document.getElementById('attributeName') as HTMLInputElement;
        let name = element!.value;
        let id = uuid(`${props.obj_id}::${name}`, props.ns);
        let attr: AttributeStore = {
            id,
            name,
            type: attrType as Type,
            obj_id: props.obj_id
        };

        // clean-up
        element.value = '';

        dispatch(addAttribute(attr));
    }

    let handleDeleteAttribute = (e: React.MouseEvent<HTMLDivElement>) => {
        dispatch(removeAttribute(e.currentTarget.id));
    }

    let listItems = obj_attrs.map((a) => {
        let attr = attributes.filter((b) => b.id === a.id);
        let type = getAttributeType(attr[0]);
        if (type.is_ref) {
            return { id: a.id, name: a.name, type: `&${type.type}` };
        } else {
            return { id: a.id, name: a.name, type: type.type };
        }
    });

    return (
        <div>
            <Dialog open={true}>
                <DialogTitle>Object Editor</DialogTitle>
                <DialogContent dividers>
                    <FormGroup>
                        <TextField autoFocus required id="objectName" label="Object Name"
                            value={formik.values.objectName} onChange={formik.handleChange}
                            variant="outlined" />
                    </FormGroup>
                    <Divider />
                    <FormGroup>
                        <FormLabel>Attributes</FormLabel>
                        <List>
                            {listItems.map(({ id, name, type }) =>
                                <ListItemButton key={id} id={id} divider onClick={handleAttrSelect} >
                                    {/* <ListItemText primary={name} secondary={type} /> */}
                                    <ListItemText primary={`${name}: ${type}`} />
                                    <ListItemSecondaryAction>
                                        <div id={id} onClick={handleDeleteAttribute}>
                                            <IconButton edge='end' >
                                                <DeleteForeverIcon />
                                            </IconButton>
                                        </div>
                                    </ListItemSecondaryAction>
                                </ListItemButton>
                            )}
                        </List>
                        <DialogActions id="editAttrCtls">
                            <TextField id="attributeName" variant='outlined' label='Attribute Name' InputLabelProps={{ shrink: true }} />
                            <FormControl>
                                <InputLabel id="attr-type">Type</InputLabel>
                                {/* @ts-ignore */}
                                <Select sx={{ m: 1, minWidth: 120 }} labelId='attr-type' value={attrType}
                                    id='attr-select' label='Type' onChange={handleAttrTypeChange}>
                                    {TYPES.map(t =>
                                        <MenuItem key={t} value={t}>{t}</MenuItem>
                                    )}
                                </Select>
                            </FormControl>
                            <Button onClick={handleAddAttr}>Add</Button>
                        </DialogActions>
                    </FormGroup>
                </DialogContent >
                <DialogActions>
                    <Button onClick={cancel}>Cancel</Button>
                    <Button onClick={handleSubmit}>Save</Button>
                </DialogActions>
            </Dialog>
        </div >
    )
};

export default ObjectEditor;
