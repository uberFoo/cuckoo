import React from 'react';
import { Formik, Form, Field, ErrorMessage, } from 'formik';
import Modal from 'react-modal';

import { ObjectStore } from '../../app/store';
import { useAppDispatch } from '../../app/hooks';
import { replaceObject } from '../object/objectSlice';

interface Errors {
    email?: string,
    password?: string
};

let customStyles = {
    content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)',
    },
};

interface Props {
    enabled: boolean,
    object: ObjectStore
}

// Modal.setAppElement('#modal-root');
const Basic = (props: Props) => {
    let dispatch = useAppDispatch();
    let parent = () => document.querySelector('#modal-root') as HTMLElement;

    let done = (values: { objectName: string, keyLetters: string }) => {
        let new_obj = { ...props.object, name: values.objectName, key_letter: values.keyLetters };
        dispatch(replaceObject(new_obj));
    }

    return (
        <div>
            <Modal isOpen={props.enabled}
                id={"objectEditor"}
                parentSelector={parent}
                // {() => document.querySelector('#modal-root')}
                style={customStyles}
            >
                <h2 >Object Editor</h2>
                <Formik
                    initialValues={{ objectName: props.object.name, keyLetters: props.object.key_letter }}
                    // validationSchema={Yup.object({
                    //     firstName: Yup.string()
                    //         .max(15, 'Must be 15 characters or less')
                    //         .required('Required'),
                    //     lastName: Yup.string()
                    //         .max(20, 'Must be 20 characters or less')
                    //         .required('Required'),
                    //     email: Yup.string().email('Invalid email address').required('Required'),
                    // })}
                    onSubmit={(values, { setSubmitting }) => {
                        // setTimeout(() => {
                        // alert(JSON.stringify(values, null, 2));
                        done(values);
                        setSubmitting(false);
                        // }, 400);
                    }}
                >
                    <Form>
                        <label htmlFor="objectName">Object Name</label>
                        <Field name="objectName" type="text" />
                        {/* <ErrorMessage name="firstName" /> */}

                        <label htmlFor="keyLetters">Key Letters</label>
                        <Field name="keyLetters" type="text" />
                        {/* <ErrorMessage name="lastName" /> */}

                        {/* <label htmlFor="email">Email Address</label>
                        <Field name="email" type="email" />
                        <ErrorMessage name="email" /> */}

                        <button type="submit">Submit</button>
                        {/* <button onClick={done}>Submit</button> */}
                    </Form>
                </Formik>
            </Modal>
        </div >
    )
};
// <form id="objectEditorForm">
//     <input id='name' value={props.object.name} readOnly={false} />
//     <input id='key_letter' value={props.object.key_letter} readOnly={false} />
// </form>
// <br />
// <button onClick={foo}>close</button>

export default Basic;
