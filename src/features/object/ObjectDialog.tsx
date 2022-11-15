import React, { FormEvent } from 'react';
import { useFormik } from 'formik';
import {
    Dialog, DialogTitle, TextField, DialogContent, DialogActions, Button, FormGroup, FormLabel,
    List, ListItemButton, ListItemText, ListItemSecondaryAction, IconButton, FormControl,
    InputLabel, Select, MenuItem, SelectChangeEvent
} from '@mui/material';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { v5 as uuid } from 'uuid';

import { ObjectStore, AttributeStore, Type } from '../../app/store';
import { selectAttributes } from '../attribute/attributeSlice';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import { replaceObject } from './objectSlice';
import { updateObjectReference, updateReferentialAttribute, addAttribute, removeAttribute } from '../attribute/attributeSlice'

interface Props {
    enabled: boolean,
    object: ObjectStore,
    attrs: Array<AttributeStore>,
    ns: string,
    done: () => void
}

let TYPES = ['Uuid', 'String', 'Integer', 'Float', 'Boolean'];

// Modal.setAppElement('#modal-root');
const ObjectEditor = (props: Props) => {
    let dispatch = useAppDispatch();
    let attributes: Array<AttributeStore> = useAppSelector((state) => selectAttributes(state));

    let save = (values: { objectName: string }) => {
        console.log(values);
        if (values.objectName !== props.object.name) {
            let new_id = uuid(values.objectName, props.ns);
            // If the name changed then so will the id, which is how our attributes refer to us. We
            // also need to update any referential attributes.
            attributes
                .filter((a) => a.obj_id === props.object.id)
                .map((a) => dispatch(updateObjectReference({ id: a.id, obj_id: new_id })));
            attributes
                .filter((a) => typeof a.type === 'object' && a.type.foreign_key === props.object.id)
                .map((a) => dispatch(updateReferentialAttribute({ id: a.id, obj_id: new_id })));

            let new_obj = { ...props.object, id: new_id, name: values.objectName };
            dispatch(replaceObject({ object: new_obj, old_id: props.object.id }));
        }

        props.done();
    }

    let cancel = () => {
        props.done();
    }

    const formik = useFormik({
        initialValues: {
            objectName: props.object.name,
        },
        onSubmit: (values) => save(values)
    });

    let handleSubmit: (e?: React.FormEvent<HTMLElement> | undefined) => void = (e) => {
        // Poor thing doesn't know that I don't give a shit about the event itself.
        formik.handleSubmit(e as any);
    }

    let [attrType, setAttrType] = React.useState('');

    let handleAttrTypeChange = (event: SelectChangeEvent) => {
        setAttrType(event.target.value);
    }

    let handleAddAttr = () => {
        let element = document.getElementById('attributeName') as HTMLInputElement;
        let name = element!.value;
        let id = uuid(`${props.object.id}::${name}`, props.ns);
        let attr: AttributeStore = {
            id,
            name,
            type: attrType as Type,
            obj_id: props.object.id
        };

        dispatch(addAttribute(attr));
    }

    let handleDeleteAttribute = (e: React.MouseEvent<HTMLDivElement>) => {
        dispatch(removeAttribute(e.currentTarget.id));
    }

    let listItems = props.attrs.map((a) => {
        return { id: a.id, name: a.name, type: a.type };
    });

    return (
        <div>
            <Dialog open={true}>
                <DialogTitle>Object Editor</DialogTitle>
                <DialogContent dividers>
                    <FormGroup row={true}>
                        <TextField autoFocus required id="objectName" helperText="Object Name"
                            value={formik.values.objectName} onChange={formik.handleChange}
                            variant="outlined" />
                    </FormGroup>
                    <FormGroup>
                        <FormLabel>Attributes</FormLabel>
                        <List>
                            {listItems.map(({ id, name, type }) =>
                                <ListItemButton divider>
                                    {/* @ts-ignore */}
                                    <ListItemText primary={name} secondary={type} />
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
                        <DialogActions>
                            <TextField id="attributeName" variant='outlined' helperText='Attribute Name' />
                            <FormControl>
                                <InputLabel id="attr-type">Type</InputLabel>
                                {/* @ts-ignore */}
                                <Select sx={{ m: 1, minWidth: 120 }} labelId='attr-type' value={attrType}
                                    id='attr-select' label='Type' onChange={handleAttrTypeChange}>
                                    {TYPES.map(t =>
                                        <MenuItem value={t}>{t}</MenuItem>
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
