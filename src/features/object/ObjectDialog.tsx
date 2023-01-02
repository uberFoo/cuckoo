import React, { FormEvent } from 'react';
import { useFormik } from 'formik';
import {
    Dialog, DialogTitle, TextField, DialogContent, DialogActions, Button, FormGroup, FormLabel,
    List, ListItemButton, ListItemText, ListItemSecondaryAction, IconButton, FormControl,
    InputLabel, Select, MenuItem, SelectChangeEvent, Divider, PaperProps, Paper, Box
} from '@mui/material';
import Draggable from 'react-draggable';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { v5 as uuid } from 'uuid';

import { AttributeStore, Type } from '../../app/store';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import {
    removeAttribute, addAttribute, replaceObject, selectObjectById, objectUpdateDescription,
    objectUpdateKeyLetter, rename
} from './objectSlice';
import { objectChangeId } from '../paper/paperSlice';

function PaperComponent(props: PaperProps) {
    return (
        <Draggable
            handle="#draggable-dialog-title"
            cancel={'[class*="MuiDialogContent-root"]'}
        >
            <Paper {...props} />
        </Draggable>
    );
}

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
    // let attributes: Array<AttributeStore> = useAppSelector((state) => selectAttributes(state));
    const formik = useFormik({
        initialValues: {
            // @ts-ignore
            objectName: object.name,
            // @ts-ignore
            objectKeyLetter: object.key_letter,
            // @ts-ignore
            object_desc: object.description
        },
        onSubmit: (values) => save(values)
    });
    let [attrType, setAttrType] = React.useState('');

    if (object === undefined) {
        console.error("can't find object in the store", props.obj_id);
        return;
    }

    let save = (values: { objectName: string, object_desc: string, objectKeyLetter: string }) => {
        let dirty = false;
        let id = props.obj_id;
        let name = object?.name;
        let description = object?.description;
        let key_letter = object?.key_letter;

        // @ts-ignore
        if (values.objectName !== name) {
            // Total hack going on here to change the name without breaking things..
            // Check out issue #16, for details.
            // id = uuid(values.objectName, props.ns);
            name = values.objectName;
            dirty = true;
        }

        if (values.object_desc !== object?.description) {
            description = values.object_desc;
            dirty = true;
        }

        if (values.objectKeyLetter !== object?.key_letter) {
            key_letter = values.objectKeyLetter;
            dirty = true;
        }

        if (dirty) {
            let new_obj = { ...object, id, name, description, key_letter };

            // all that work with dirty flags and look what I'm doing.
            if (id !== props.obj_id) {
                dispatch(objectChangeId({ id, old_id: props.obj_id }));
                dispatch(replaceObject({ object: new_obj, old_id: props.obj_id }));
            } else {
                // More of the hack from above, issue #16.
                if (values.objectName !== object?.name) {
                    dispatch(rename({ id, name }));
                }
                if (values.object_desc !== object?.description) {
                    dispatch(objectUpdateDescription({ id, payload: description }));
                }
                if (values.objectKeyLetter !== object?.key_letter) {
                    dispatch(objectUpdateKeyLetter({ id, payload: key_letter }));
                }
            }
        }

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
            // obj_id: props.obj_id
        };

        // clean-up
        element.value = '';


        dispatch(addAttribute({ id: props.obj_id, attr }));
    }

    let handleDeleteAttribute = (e: React.MouseEvent<HTMLDivElement>) => {
        dispatch(removeAttribute({
            id: props.obj_id, attr_id: e.currentTarget.id
        }));
    }

    let cancel = () => {
        props.done();
    }

    let listItems = Object.keys(object.attributes).map(id => {
        let a = object!.attributes[id];
        return { id: a!.id, name: a!.name, type: a!.type };
    });

    return (
        <div>
            <Dialog open={true} fullWidth maxWidth={"sm"} PaperComponent={PaperComponent}
                aria-labelledby="draggable-dialog-title">
                {/* @ts-ignore */}
                <DialogTitle style={{ cursor: 'move' }} id="draggable-dialog-title">
                    Object Editor
                </DialogTitle>
                <DialogContent dividers>
                    <Box component={"form"} sx={{ '& .MuiTextField-root': { m: 1, width: '60ch' } }}
                        noValidate autoComplete={'off'}>
                        <FormGroup>
                            <TextField autoFocus required id="objectName" label="Object Name"
                                value={formik.values.objectName} onChange={formik.handleChange}
                                variant="outlined" />
                            <TextField autoFocus required id="objectKeyLetter" label="Object Key Letters"
                                value={formik.values.objectKeyLetter} onChange={formik.handleChange}
                                variant="outlined" />
                            <TextField autoFocus required id="object_desc" label="Object Description"
                                value={formik.values.object_desc} onChange={formik.handleChange}
                                variant="outlined" multiline />
                        </FormGroup>
                        <Divider />
                        <FormGroup>
                            <FormLabel sx={{ fontSize: 20 }}>Attributes</FormLabel>
                            <List>
                                {listItems.map(({ id, name, type }) =>
                                    <ListItemButton key={id} id={id} sx={{ width: '50ch' }}
                                        divider onClick={handleAttrSelect} >
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
                            <Box
                                component="form"
                                sx={{
                                    display: 'flex', alignItems: 'flex-end',
                                    '& .MuiTextField-root': { m: 1, width: '35ch' },
                                }}
                                noValidate
                                autoComplete="off"
                            >
                                <DialogActions id="editAttrCtls">
                                    <TextField id="attributeName" variant='outlined'
                                        label='Attribute Name' InputLabelProps={{ shrink: true }}
                                        sx={{ '& .MuiTextField-root': { m: 1, width: '40ch' } }}
                                    />
                                    <FormControl>
                                        <InputLabel id="attr-type">Type</InputLabel>
                                        {/* @ts-ignore */}
                                        <Select sx={{ m: 1, minWidth: '10ch' }} labelId='attr-type' value={attrType}
                                            id='attr-select' label='Type' onChange={handleAttrTypeChange}>
                                            {TYPES.map(t =>
                                                <MenuItem key={t} value={t}>{t}</MenuItem>
                                            )}
                                        </Select>
                                    </FormControl>
                                    <Button variant={"outlined"} onClick={handleAddAttr}>Add</Button>
                                </DialogActions>
                            </Box>
                        </FormGroup>
                    </Box>
                </DialogContent >
                <DialogActions>
                    <Button variant={"outlined"} onClick={cancel}>Cancel</Button>
                    <Button variant={"outlined"} onClick={handleSubmit}>Save</Button>
                </DialogActions>
            </Dialog>
        </div >
    )
};

export default ObjectEditor;
