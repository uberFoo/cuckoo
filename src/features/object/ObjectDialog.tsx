import React, { FormEvent } from 'react';
import { useFormik } from 'formik';
import {
    Dialog, DialogTitle, TextField, DialogContent, DialogActions, Button, FormGroup, FormLabel,
    List, ListItemButton, ListItemText, ListItemSecondaryAction, ListItemIcon
} from '@mui/material';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import { v5 as uuid } from 'uuid';

import { ObjectStore } from '../../app/store';
import { AttributeStore } from '../../app/store';
import { selectAttributes } from '../attribute/attributeSlice';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import { replaceObject } from './objectSlice';
import { updateObjectReference, updateReferentialAttribute } from '../attribute/attributeSlice'

interface Props {
    enabled: boolean,
    object: ObjectStore,
    attrs: Array<AttributeStore>,
    ns: string,
    done: () => void
}

// Modal.setAppElement('#modal-root');
const ObjectEditor = (props: Props) => {
    let dispatch = useAppDispatch();
    let attributes: Array<AttributeStore> = useAppSelector((state) => selectAttributes(state));

    let save = (values: { objectName: string }) => {
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
            objectName: props.object.name
        },
        onSubmit: (values) => save(values)
    });

    let handleSubmit: (e?: React.FormEvent<HTMLElement> | undefined) => void = (e) => {
        // Poor thing doesn't know that I don't give a shit about the event itself.
        formik.handleSubmit(e as any);
    }

    let listItems = props.attrs.map((a) => {
        return { id: a.id, name: a.name };
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
                        <List>
                            {listItems.map(({ id, name }) =>
                                <ListItemButton divider>
                                    <ListItemText primary={name} />
                                    <ListItemSecondaryAction>
                                        <ListItemIcon >
                                            <DragHandleIcon />
                                        </ListItemIcon>
                                    </ListItemSecondaryAction>
                                </ListItemButton>
                                // </Draggable>
                            )}
                        </List>
                        <DialogActions>
                            <Button>Add</Button>
                        </DialogActions>
                        <FormLabel>Attributes</FormLabel>
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
