import { createEntityAdapter, createSlice, createSelector } from '@reduxjs/toolkit';

import { RootState, PaperStore } from '../../app/store';

let paperAdapter = createEntityAdapter<PaperStore>();
let initialState = paperAdapter.getInitialState;

export const paperSlice = createSlice({
    name: 'paper',
    initialState,
    reducers: {
        addPaper: paperAdapter.addOne,
        savePaperOffset: (state, action) => {
            let paper = state.entities[state.ids[0]];
            // @ts-ignore
            state.entities[state.ids[0]] = { ...paper, offset: action.payload };
        },
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
        // TODO: This is broken. Any relationships referencing the old ID break.
        objectChangeId: (state, action) => {
            let { id, old_id } = action.payload;

            let paper = state.entities[state.ids[0]];
            let orig = paper!.objects[old_id];
            // @ts-ignore
            paper!.objects[id] = { ...orig!, id };
            delete paper!.objects[old_id];
        },
        // Needed to renumber a relationship
        relationshipChangeId: (state, action) => {
            let { id, old_id } = action.payload;

            let paper = state.entities[state.ids[0]];
            let orig = paper!.relationships[old_id];
            // @ts-ignore
            paper!.relationships[id] = { ...orig! };
            delete paper!.relationships[old_id];
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
        },
        relationshipUpdateBinaryRelPhrase: (state, action) => {
            let { id, end, offset } = action.payload;

            let paper = state.entities[state.ids[0]];
            let ui = paper!.relationships[id];

            if (end === 'from') {
                // @ts-ignore
                let from = ui!.BinaryUI.from;
                // @ts-ignore
                paper!.relationships[id].BinaryUI.from = {
                    ...from,
                    offset: { x: offset.x + from.offset.x, y: offset.y + from.offset.y }
                };
            } else {
                // @ts-ignore
                let to = ui!.BinaryUI.to;
                // @ts-ignore
                paper!.relationships[id].BinaryUI.to = {
                    ...to,
                    offset: { x: offset.x + to.offset.x, y: offset.y + to.offset.y }
                };
            }
        },
        addRelationshipToPaper: (state, action) => {
            let { id, payload } = action.payload;

            let paper = state.entities[state.ids[0]];
            paper!.relationships[id] = payload;
        },
        removeRelationshipFromPaper: (state, action) => {
            let { id } = action.payload;

            let paper = state.entities[state.ids[0]];
            delete paper?.relationships[id];
        },
        relationshipAddTargetToIsa: (state, action) => {
            let { id, to_end } = action.payload;

            let paper = state.entities[state.ids[0]];
            // @ts-ignore
            paper!.relationships[id].IsaUI.to.push(to_end);
        }
    }
});

export const { addPaper, addObjectToPaper, objectMoveTo, objectResizeBy, objectChangeId,
    relationshipUpdate, removeObjectFromPaper, relationshipUpdateBinaryFrom, savePaperOffset,
    relationshipUpdateBinaryTo, relationshipUpdateIsaFrom, relationshipUpdateIsaTo,
    relationshipUpdateBinaryRelPhrase, addRelationshipToPaper, removeRelationshipFromPaper,
    relationshipChangeId, relationshipAddTargetToIsa }
    = paperSlice.actions;

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
