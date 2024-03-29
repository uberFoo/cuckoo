import React, { FormEvent } from 'react';
import { useFormik } from 'formik';
import {
    Dialog, DialogTitle, TextField, DialogContent, DialogActions, Button, FormGroup, FormLabel,
    Divider, RadioGroup, Radio, FormControlLabel, PaperProps, Paper, Box
} from '@mui/material';
import Draggable from 'react-draggable';
import { v4 as uuid } from 'uuid';

import { Associative, Binary } from '../../app/store';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import { addRelationship, removeRelationship, updateRelationship, selectRelationshipById } from './relationshipSlice';
import { relationshipChangeId, removeRelationshipFromPaper } from '../paper/paperSlice';
import { selectObjectById } from '../object/objectSlice';

// This let's us drag the dialog box.
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

const AssociativeEditor = (props: Props) => {
    let dispatch = useAppDispatch();

    let relationship = useAppSelector((state) => selectRelationshipById(state, props.id)) as Associative;

    // This is created in Paper.tsx. It's the binary_id_assoc, my special tag
    let [bin_id, extra] = props.id.split('_');
    let binary = useAppSelector((state) => selectRelationshipById(state, bin_id)) as Binary;

    if (relationship)
        // @ts-ignore
        relationship = relationship.Associative;

    if (binary)
        // @ts-ignore
        binary = binary.Binary;

    let copied = false;
    debugger;
    // Here's my special tag. We know that binary exists. I can't do anything about it though.
    // And maybe I don't need to. I can just update the relationship each time through.
    if (extra === 'assoc') {
        copied = true;
        // This is brand new, and we want to transfer as much as we can from the original, binary, relationship.
        relationship = { ...relationship, one: binary.from, other: { ...binary.to } };

        relationship.id = binary.id;
        relationship.number = binary.number;
    }

    // Maybe this get's caught upstream if bin_id isn't set.
    dispatch(removeRelationship({ bin_id, tag: 'uberFoo' }));
    dispatch(updateRelationship({ id: relationship.id, payload: { Associative: relationship } }));

    // @ts-ignore
    let one = useAppSelector((state) => selectObjectById(state, relationship.one ? relationship.one.obj_id : null));
    // @ts-ignore
    let other = useAppSelector((state) => selectObjectById(state, relationship.other ? relationship.other.obj_id : null));

    const formik = useFormik({
        initialValues: {
            rel_num: relationship.number,
            card: relationship.from.cardinality,
            one_desc: relationship.one?.description,
            one_card: relationship.one?.cardinality,
            one_cond: relationship.one?.conditionality,
            one_attr: relationship.from.one_referential_attribute,
            other_desc: relationship.other?.description,
            other_card: relationship.other?.cardinality,
            other_cond: relationship.other?.conditionality,
            other_attr: relationship.from.other_referential_attribute,
        },
        onSubmit: (values) => save(values)
    });

    if (relationship === undefined) {
        console.error("can't find relationship in the store", props.id);
        return;
    }

    if (one === undefined || other === undefined) {
        // It's confusing to me what get's called when: this, or the component. There is no sync.
        // This happens because the relationship isn't updated in Redux yet?
        return;
    }

    let save = (values: {
        rel_num: number,
        card: string,
        one_desc?: string,
        one_card?: string,
        one_cond?: string,
        one_attr?: string,
        other_desc?: string,
        other_card?: string,
        other_cond?: string,
        other_attr?: string,
    }) => {
        debugger;
        let id = relationship.id;

        // if (copied || values.rel_num !== relationship.number) {
        if (values.rel_num !== relationship.number) {
            let new_id = uuid();

            // if (copied) {
            //     let bin_id = id.split('_')[0];
            //     // Remove the original, copied, binary from the store
            //     dispatch(removeRelationship({ id: bin_id, tag: 'uberFoo' }));
            //     // And don't forget to remove the binary from the paper
            //     dispatch(removeRelationshipFromPaper({ id: bin_id, tag: 'uberFoo' }));

            // } else {
            // This is for Paper
            dispatch(relationshipChangeId({ id: new_id, old_id: id, tag: 'uberFoo' }));
            // }

            // Not much to do but nuke the old one. I could check each value against what's in redux,
            // but is there really any point? I don't know what exactly slice syntax, or whatever it's
            // called buys us here.
            // @ts-ignore
            dispatch(removeRelationship({ id, tag: 'uberFoo' }));
            dispatch(addRelationship({
                tag: 'uberFoo',
                id: new_id,
                payload: {
                    Associative: {
                        id: new_id,
                        number: Number(values.rel_num),
                        cardinality: values.card,
                        from: relationship.from,
                        one: {
                            obj_id: relationship.one?.obj_id,
                            description: values.one_desc,
                            cardinality: values.one_card,
                            conditionality: values.one_cond,
                            formalizing_attribute_name: values.one_attr
                        },
                        other: {
                            obj_id: relationship.other?.obj_id,
                            description: values.other_desc,
                            cardinality: values.other_card,
                            conditionality: values.other_cond,
                            formalizing_attribute_name: values.other_attr
                        }
                    }
                }
            }));
        } else {
            dispatch(updateRelationship({
                id,
                payload: {
                    Associative: {
                        id,
                        number: Number(values.rel_num),
                        cardinality: values.card,
                        from: relationship.from,
                        one: {
                            obj_id: relationship.one?.obj_id,
                            description: values.one_desc,
                            cardinality: values.one_card,
                            conditionality: values.one_cond,
                            formalizing_attribute_name: values.one_attr
                        },
                        other: {
                            obj_id: relationship.other?.obj_id,
                            description: values.other_desc,
                            cardinality: values.other_card,
                            conditionality: values.other_cond,
                            formalizing_attribute_name: values.other_attr
                        }
                    }
                }
            }));
        }

        props.done();
    }

    // Look at that nasty ass function signature. 🤮
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
                <DialogTitle style={{ cursor: 'move' }} id="draggable-dialog-title">
                    Binary Relationship Editor
                </DialogTitle>
                <DialogContent dividers>
                    <Box component={"form"} sx={{ '& .MuiTextField-root': { m: 1, width: '50ch' } }}
                        noValidate autoComplete={'off'}>
                        <FormGroup>
                            <FormLabel sx={{ fontSize: 20 }}>Associative Relationship</FormLabel>
                            <TextField autoFocus required id="rel_num" label="Relationship Number"
                                value={formik.values.rel_num} onChange={formik.handleChange}
                                variant="outlined" />
                            <RadioGroup row id="from_card" name="from_card" value={formik.values.card}
                                onChange={formik.handleChange}>
                                <FormControlLabel value='One' control={<Radio />} label='One' />
                                <FormControlLabel value='Many' control={<Radio />} label='Many' />
                            </RadioGroup>
                        </FormGroup>
                        <Divider />
                        <FormGroup>
                            <FormLabel sx={{ fontSize: 20 }}>{one ? `${one.name} Object` : "One Side of Associative Relationship"}</FormLabel>
                            <TextField autoFocus required id="one_desc" label="Description"
                                value={formik.values.one_desc} onChange={formik.handleChange}
                                variant="outlined" />
                            <TextField autoFocus required id="one_attr" label="Formalizing Attribute"
                                value={formik.values.one_attr} onChange={formik.handleChange}
                                variant="outlined" />
                            <FormLabel>Cardinality</FormLabel>
                            <RadioGroup row id="one_card" name="one_card" value={formik.values.one_card}
                                onChange={formik.handleChange}>
                                <FormControlLabel value='One' control={<Radio />} label='One' />
                                <FormControlLabel value='Many' control={<Radio />} label='Many' />
                            </RadioGroup>
                            <FormLabel>Conditionality</FormLabel>
                            <RadioGroup row id="one_cond" name="one_cond" value={formik.values.one_cond}
                                onChange={formik.handleChange}>
                                <FormControlLabel value='Unconditional' control={<Radio />} label='Unconditional' />
                                <FormControlLabel value='Conditional' control={<Radio />} label='Conditional' />
                            </RadioGroup>
                        </FormGroup>
                        <Divider />
                        <FormGroup>
                            <FormLabel sx={{ fontSize: 20 }}>{other ? `${other.name} Object` : "Other Side Of Associative Relationship"}</FormLabel>
                            <TextField autoFocus required id="other_desc" label="Description"
                                value={formik.values.other_desc} onChange={formik.handleChange}
                                variant="outlined" />
                            <TextField autoFocus required id="other_attr" label="Formalizing Attribute"
                                value={formik.values.other_attr} onChange={formik.handleChange}
                                variant="outlined" />
                            <FormLabel>Cardinality</FormLabel>
                            <RadioGroup row id="other_card" name="other_card" value={formik.values.other_card}
                                onChange={formik.handleChange}>
                                <FormControlLabel value='One' control={<Radio />} label='One' />
                                <FormControlLabel value='Many' control={<Radio />} label='Many' />
                            </RadioGroup>
                            <FormLabel>Conditionality</FormLabel>
                            <RadioGroup row id="other_cond" name="other_cond" value={formik.values.other_cond}
                                onChange={formik.handleChange}>
                                <FormControlLabel value='Unconditional' control={<Radio />} label='Unconditional' />
                                <FormControlLabel value='Conditional' control={<Radio />} label='Conditional' />
                            </RadioGroup>
                        </FormGroup>
                    </Box>
                </DialogContent >
                <DialogActions>
                    <Button onClick={cancel}>Cancel</Button>
                    <Button onClick={handleSubmit}>Save</Button>
                </DialogActions>
            </Dialog>
        </div >
    )
};

export default AssociativeEditor;