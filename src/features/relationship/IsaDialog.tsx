import React, { FormEvent } from 'react';
import { useFormik } from 'formik';
import {
    Dialog, DialogTitle, TextField, DialogContent, DialogActions, Button, FormGroup,
    FormControl, PaperProps, Paper
} from '@mui/material';
import Draggable from 'react-draggable';
import { v4 as uuid } from 'uuid';

import { Isa } from '../../app/store';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import { addRelationship, removeRelationship, updateRelationship, selectRelationshipById } from './relationshipSlice';
import { relationshipChangeId } from '../paper/paperSlice';

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
    id: string,
    ns: string,
    done: () => void
}

const IsaEditor = (props: Props) => {
    let dispatch = useAppDispatch();

    let relationship = useAppSelector((state) => selectRelationshipById(state, props.id)) as Isa;

    // @ts-ignore
    relationship = relationship.Isa;

    const formik = useFormik({
        initialValues: {
            // @ts-ignore
            rel_num: relationship.number,
        },
        onSubmit: (values) => save(values)
    });

    if (relationship === undefined) {
        console.error("can't find relationship in the store", props.id);
        return;
    }

    let save = (values: {
        rel_num: number,
    }) => {
        let id = relationship.id;
        if (values.rel_num !== relationship.number) {
            let new_id = uuid();

            // Not much to do but nuke the old one. I could check each value against what's in redux,
            // but is there really any point? I don't know what exactly slice syntax, or whatever it's
            // called buys us here.
            // @ts-ignore
            dispatch(relationshipChangeId({ id: new_id, old_id: id }));
            dispatch(removeRelationship(id));
            dispatch(addRelationship({
                id: new_id,
                payload: {
                    Isa: {
                        id: new_id,
                        number: Number(values.rel_num),
                        obj_id: relationship.obj_id,
                        subtypes: relationship.subtypes
                    }
                }
            }));
        }

        props.done();
    }

    let handleSubmit: (e?: React.FormEvent<HTMLElement> | undefined) => void = (e) => {
        // Poor thing doesn't know that I don't give a shit about the event itself.
        formik.handleSubmit(e as any);
    }

    let cancel = () => {
        props.done();
    }

    return (
        <div>
            <Dialog open={true} fullWidth maxWidth={"sm"} PaperComponent={PaperComponent}
                aria-labelledby="draggable-dialog-title">
                <FormControl>
                    <DialogTitle style={{ cursor: 'move' }} id="draggable-dialog-title">
                        Isa Relationship Editor
                    </DialogTitle>
                    <DialogContent dividers>
                        <FormGroup>
                            <TextField autoFocus required id="rel_num" label="Relationship Number"
                                value={formik.values.rel_num} onChange={formik.handleChange}
                                variant="outlined" />
                        </FormGroup>
                    </DialogContent >
                    <DialogActions>
                        <Button variant={"outlined"} onClick={cancel}>Cancel</Button>
                        <Button variant={"outlined"} onClick={handleSubmit}>Save</Button>
                    </DialogActions>
                </FormControl>
            </Dialog>
        </div >
    )
};

export default IsaEditor;
