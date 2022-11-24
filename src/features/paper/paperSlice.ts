import { createEntityAdapter, createSlice, createSelector } from '@reduxjs/toolkit';

import { RootState, PaperStore } from '../../app/store';

let paperAdapter = createEntityAdapter<PaperStore>();
let initialState = paperAdapter.getInitialState;

export const paperSlice = createSlice({
    name: 'paper',
    initialState,
    reducers: {
        addPaper: paperAdapter.addOne,
        removeObjectFromPaper: (state, action) => {
            let { id } = action.payload;

            let paper = state.entities[state.ids[0]];
            delete paper?.objects[id];
        },
        addObjectToPaper: (state, action) => {
            let { id, payload } = action.payload;

            let paper = state.entities[state.ids[0]];
            paper!.objects[id] = payload;
        },
        objectMoveTo: (state, action) => {
            let { id, x, y } = action.payload;

            let paper = state.entities[state.ids[0]];
            let orig = paper!.objects[id];
            paper!.objects[id] = { ...orig!, x, y };
        },
        objectResizeBy: (state, action) => {
            let { id, width, height } = action.payload;

            let paper = state.entities[state.ids[0]];
            let orig = paper!.objects[id];
            paper!.objects[id] = { ...orig!, width, height };
        },
        // Needed to rename an object
        objectChangeId: (state, action) => {
            let { id, old_id } = action.payload;

            let paper = state.entities[state.ids[0]];
            let orig = paper!.objects[old_id];
            // @ts-ignore
            paper!.objects[id] = { ...orig!, id };
            delete paper!.objects[old_id];
        },
        relationshipUpdate: (state, action) => {
            let { id, ui } = action.payload;

            let paper = state.entities[state.ids[0]];
            paper!.relationships[id] = ui;
        },
        relationshipUpdateBinaryFrom: (state, action) => {
            let { id, from } = action.payload;

            let paper = state.entities[state.ids[0]];
            let ui = paper!.relationships[id];
            // @ts-ignore
            let bui = ui!.BinaryUI;
            // @ts-ignore
            paper!.relationships[id] = { ...ui!, BinaryUI: { ...bui!, from } };
        },
        relationshipUpdateBinaryTo: (state, action) => {
            let { id, to } = action.payload;

            let paper = state.entities[state.ids[0]];
            let ui = paper!.relationships[id];
            // @ts-ignore
            let bui = ui!.BinaryUI;
            // @ts-ignore
            paper!.relationships[id] = { ...ui!, BinaryUI: { ...bui, to } };
        },
        relationshipUpdateIsaFrom: (state, action) => {
            let { id, new_from } = action.payload;

            let paper = state.entities[state.ids[0]];
            // let ui = paper!.relationships[id];
            // @ts-ignore
            paper!.relationships[id].IsaUI.from = new_from;
        },
        relationshipUpdateIsaTo: (state, action) => {
            let { id, index, new_to } = action.payload;

            let paper = state.entities[state.ids[0]];
            // @ts-ignore
            paper!.relationships[id].IsaUI.to[index] = new_to;
        }
    }
});

export const { addPaper, addObjectToPaper, objectMoveTo, objectResizeBy, objectChangeId,
    relationshipUpdate, removeObjectFromPaper, relationshipUpdateBinaryFrom,
    relationshipUpdateBinaryTo, relationshipUpdateIsaFrom, relationshipUpdateIsaTo } = paperSlice.actions;

export let {
    selectAll: selectPapers,
    selectById: selectPaperById,
    selectIds: selectPaperIds,
    selectEntities: selectPaperContainer
} = paperAdapter.getSelectors<RootState>((state) => state.present.paper);

export let selectPaperSingleton = createSelector(
    selectPaperIds,
    selectPaperContainer,
    (ids, papers) => papers[ids[0]]
);

// @ts-ignore
export let selectObjectUIById = createSelector(
    selectPaperSingleton,
    (state: RootState, id: string) => id,
    (state: PaperStore, id: string) => state.objects[id]
);

export default paperSlice.reducer;
