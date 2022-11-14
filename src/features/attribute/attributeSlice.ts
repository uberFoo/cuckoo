import { createSlice, createEntityAdapter } from '@reduxjs/toolkit'

import { RootState, AttributeStore } from '../../app/store';

let attributeAdapter = createEntityAdapter<AttributeStore>();
let initialState = attributeAdapter.getInitialState();

export let attributeSlice = createSlice({
    name: 'attributes',
    initialState,
    reducers: {
        addAttribute: attributeAdapter.addOne,
        removeAttribute: attributeAdapter.removeOne,
        updateObjectReference: (state, action) => {
            let { id, obj_id } = action.payload;
            let attr = state.entities[id];
            attr!.obj_id = obj_id;
        },
        updateReferentialAttribute: (state, action) => {
            let { id, obj_id } = action.payload;
            let attr = state.entities[id];
            attr!.type.foreign_key = obj_id;
        }
    }
});

export let { addAttribute, removeAttribute, updateObjectReference, updateReferentialAttribute } = attributeSlice.actions;

export let {
    selectAll: selectAttributes,
    selectById: selectAttributeById
} = attributeAdapter.getSelectors<RootState>((state) => state.attributes);

export default attributeSlice.reducer;