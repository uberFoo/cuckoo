import { createSlice, createEntityAdapter } from '@reduxjs/toolkit'

import { RootState, RelationshipStore } from '../../app/store';

let relationshipAdapter = createEntityAdapter<RelationshipStore>();
let initialState = relationshipAdapter.getInitialState();

export let relationshipSlice = createSlice({
    name: 'relationships',
    initialState,
    reducers: {
    }
});

export let { } = relationshipSlice.actions;

export let {
    selectAll: selectRelationships,
    selectById: selectRelationshipsById
} = relationshipAdapter.getSelectors<RootState>((state) => state.relationships);

export default relationshipSlice.reducer;