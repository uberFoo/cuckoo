import { createSlice, createEntityAdapter } from '@reduxjs/toolkit'

import { RootState, RelationshipStore, Isa } from '../../app/store';

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
        },
        removeRelationship: (state, action) => {
            let { id } = action.payload;

            relationshipAdapter.removeOne(state, id);
        },
        updateRelationship: (state, action) => {
            let { id, payload } = action.payload;

            state.entities[id] = payload;
        },
        addTargetToIsa: (state, action) => {
            let { rel_id, to } = action.payload;
            // @ts-ignore
            state.entities[rel_id].Isa.subtypes.push(to);
        }
    }
});

export let { addRelationship, removeRelationship, updateRelationship, addTargetToIsa
} = relationshipSlice.actions;

export let {
    selectAll: selectRelationships,
    selectById: selectRelationshipById
} = relationshipAdapter.getSelectors<RootState>((state) => state.present.relationships);

export default relationshipSlice.reducer;