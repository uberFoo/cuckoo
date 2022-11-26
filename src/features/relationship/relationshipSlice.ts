import { createSlice, createEntityAdapter } from '@reduxjs/toolkit'

import { RootState, RelationshipStore } from '../../app/store';

let relationshipAdapter = createEntityAdapter<RelationshipStore>();
let initialState = relationshipAdapter.getInitialState();

export let relationshipSlice = createSlice({
    name: 'relationship',
    initialState,
    reducers: {
        addRelationship: (state, action) => {
            // This needs special handling because of the way serde serializes enums.
            let { id, payload } = action.payload;

            state.ids.push(id)
            state.entities[id] = payload;
        },
        removeRelationship: relationshipAdapter.removeOne
    }
});

export let { addRelationship, removeRelationship } = relationshipSlice.actions;

export let {
    selectAll: selectRelationships,
    selectById: selectRelationshipsById
} = relationshipAdapter.getSelectors<RootState>((state) => state.present.relationships);

export default relationshipSlice.reducer;