import { createSlice, createEntityAdapter } from '@reduxjs/toolkit'

import { RootState, AttributeStore } from '../../app/store';

let attributeAdapter = createEntityAdapter<AttributeStore>();
let initialState = attributeAdapter.getInitialState();

export let attributeSlice = createSlice({
    name: 'attributes',
    initialState,
    reducers: {

    }
});

export let { } = attributeSlice.actions;

export let {
    selectAll: selectAttributes,
    selectById: selectAttributeById
} = attributeAdapter.getSelectors<RootState>((state) => state.attributes);

export default attributeSlice.reducer;