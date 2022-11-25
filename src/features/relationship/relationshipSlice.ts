import { createSlice, createEntityAdapter } from '@reduxjs/toolkit'

import { RootState, RelationshipStore } from '../../app/store';

let relationshipAdapter = createEntityAdapter<RelationshipStore>();
let initialState = relationshipAdapter.getInitialState();

export let relationshipSlice = createSlice({
    name: 'relationship',
    initialState,
    reducers: {
        addRelationship: (state, action) => {
            let { id, payload } = action.payload;
            state.ids.push(id)
            state.entities[id] = payload;
        }
    }
});

export let { addRelationship } = relationshipSlice.actions;

export let {
    selectAll: selectRelationships,
    selectById: selectRelationshipsById
} = relationshipAdapter.getSelectors<RootState>((state) => state.present.relationships);

export default relationshipSlice.reducer;