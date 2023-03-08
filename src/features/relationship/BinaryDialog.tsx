import React, { FormEvent } from 'react';
import { useFormik } from 'formik';
import {
    Dialog, DialogTitle, TextField, DialogContent, DialogActions, Button, FormGroup, FormLabel,
    Divider, RadioGroup, Radio, FormControlLabel, PaperProps, Paper, Box
} from '@mui/material';
import Draggable from 'react-draggable';
import { v5 as uuid } from 'uuid';

import { Binary } from '../../app/store';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import { addRelationship, removeRelationship, updateRelationship, selectRelationshipById } from './relationshipSlice';
import { relationshipChangeId } from '../paper/paperSlice';
import { selectObjectById } from '../object/objectSlice';

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

const BinaryEditor = (props: Props) => {
    let dispatch = useAppDispatch();

    let relationship = useAppSelector((state) => selectRelationshipById(state, props.id)) as Binary;
    // @ts-ignore
    relationship = relationship.Binary;

    let from = useAppSelector((state) => selectObjectById(state, relationship.from.obj_id));
    let to = useAppSelector((state) => selectObjectById(state, relationship.to.obj_id));

    const formik = useFormik({
        initialValues: {
            // @ts-ignore
            rel_num: relationship.number,
            from_desc: relationship.from.description,
            from_card: relationship.from.cardinality,
            from_cond: relationship.from.conditionality,
            from_attr: relationship.from.formalizing_attribute_name,
            to_desc: relationship.to.description,
            to_card: relationship.to.cardinality,
            to_cond: relationship.to.conditionality,
        },
        onSubmit: (values) => save(values)
    });

    // Why bother with this when I can't check before useFormik? React sucks. 🤬
    if (relationship === undefined) {
        console.error("can't find relationship in the store", props.id);
        return;
    }

    let save = (values: {
        rel_num: number,
        from_desc: string,
        from_card: string,
        from_cond: string,
        from_attr: string,
        to_desc: string,
        to_card: string,
        to_cond: string,
    }) => {
        let id = relationship.id;
        if (values.rel_num !== relationship.number) {
            let new_id = uuid(`${relationship.from.obj_id}::${relationship.to.obj_id}::${values.rel_num}`,
                props.ns);

            // Not much to do but nuke the old one. I could check each value against what's in redux,
            // but is there really any point? I don't know what exactly slice syntax, or whatever it's
            // called buys us here.
            // @ts-ignore
            dispatch(relationshipChangeId({ id: new_id, old_id: id }));
            dispatch(removeRelationship({ id }));
            dispatch(addRelationship({
                id: new_id,
                payload: {
                    Binary: {
                        id: new_id,
                        number: Number(values.rel_num),
                        from: {
                            obj_id: relationship.from.obj_id,
                            description: values.from_desc,
                            cardinality: values.from_card,
                            conditionality: values.from_cond,
                            formalizing_attribute_name: values.from_attr
                        },
                        to: {
                            obj_id: relationship.to.obj_id,
                            description: values.to_desc,
                            cardinality: values.to_card,
                            conditionality: values.to_cond,
                        }
                    }
                }
            }));
        } else {
            dispatch(updateRelationship({
                id,
                payload: {
                    Binary: {
                        id,
                        number: Number(values.rel_num),
                        from: {
                            obj_id: relationship.from.obj_id,
                            description: values.from_desc,
                            cardinality: values.from_card,
                            conditionality: values.from_cond,
                            formalizing_attribute_name: values.from_attr
                        },
                        to: {
                            obj_id: relationship.to.obj_id,
                            description: values.to_desc,
                            cardinality: values.to_card,
                            conditionality: values.to_cond,
                        }
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
                <DialogTitle style={{ cursor: 'move' }} id="draggable-dialog-title">
                    Binary Relationship Editor
                </DialogTitle>
                <DialogContent dividers>
                    <Box component={"form"} sx={{ '& .MuiTextField-root': { m: 1, width: '50ch' } }}
                        noValidate autoComplete={'off'}>
                        <FormGroup>
                            <TextField autoFocus required id="rel_num" label="Relationship Number"
                                value={formik.values.rel_num} onChange={formik.handleChange}
                                variant="outlined" />
                        </FormGroup>
                        <Divider />
                        <FormGroup>
                            <FormLabel sx={{ fontSize: 20 }}>{from ? `${from.name} (Referrer / Formalizing)` : "Referrer / Formalizing"}</FormLabel>
                            <TextField autoFocus required id="from_desc" label="Description"
                                value={formik.values.from_desc} onChange={formik.handleChange}
                                variant="outlined" />
                            <TextField autoFocus required id="from_attr" label="Formalizing Attribute"
                                value={formik.values.from_attr} onChange={formik.handleChange}
                                variant="outlined" />
                            <FormLabel>Cardinality</FormLabel>
                            <RadioGroup row id="to_card" name="to_card" value={formik.values.to_card}
                                onChange={formik.handleChange}>
                                <FormControlLabel value='One' control={<Radio />} label='One' />
                                <FormControlLabel value='Many' control={<Radio />} label='Many' />
                            </RadioGroup>
                            <FormLabel>Conditionality</FormLabel>
                            <RadioGroup row id="from_cond" name="from_cond" value={formik.values.from_cond}
                                onChange={formik.handleChange}>
                                <FormControlLabel value='Unconditional' control={<Radio />} label='Unconditional' />
                                <FormControlLabel value='Conditional' control={<Radio />} label='Conditional' />
                            </RadioGroup>
                        </FormGroup>
                        <Divider />
                        <FormGroup>
                            <FormLabel sx={{ fontSize: 20 }}>{to ? `${to.name} (Referent)` : "Referent"}</FormLabel>
                            <TextField autoFocus required id="to_desc" label="Description"
                                value={formik.values.to_desc} onChange={formik.handleChange}
                                variant="outlined" />
                            <FormLabel>Cardinality</FormLabel>
                            <RadioGroup row id="from_card" name="from_card" value={formik.values.from_card}
                                onChange={formik.handleChange}>
                                <FormControlLabel value='One' control={<Radio />} label='One' />
                                <FormControlLabel value='Many' control={<Radio />} label='Many' />
                            </RadioGroup>
                            <FormLabel>Conditionality</FormLabel>
                            <RadioGroup row id="to_cond" name="to_cond" value={formik.values.to_cond}
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

export default BinaryEditor;
