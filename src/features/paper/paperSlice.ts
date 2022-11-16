import { createEntityAdapter, createSlice, createSelector } from '@reduxjs/toolkit';
import undoable from 'redux-undo';

import { RootState, PaperStore } from '../../app/store';

let paperAdapter = createEntityAdapter<PaperStore>();
// let initialState =
let initialState =
{
    foo: {},
    ids: [
        "7b5c998f-f8f3-59e8-9882-1840c7c6a484"
    ],
    entities: {
        "7b5c998f-f8f3-59e8-9882-1840c7c6a484": {
            id: "7b5c998f-f8f3-59e8-9882-1840c7c6a484",
            width: 3200,
            height: 1600,
            domain_name: "sarzak_ooa_0",
            domain_ns: "b49d6fe1-e5e9-5896-bd42-b72012429e52",
            objects: {}
        }
    }
};

export const paperSlice = createSlice({
    name: 'paper',
    initialState,
    reducers: {
        addPaper: paperAdapter.addOne,
        addObjectToPaper: (state, action) => {
            let { id } = action.payload;
            // @ts-ignore
            let paper = selectPaperSingleton(state);
            paper!.objects[id] = action.payload;
        },
        objectMoveTo: (state, action) => {
            let { id, x, y } = action.payload;
            // @ts-ignore
            let paper = selectPaperSingleton(state);
            let orig = paper!.objects[id];
            paper!.objects[id] = { ...orig!, x, y };
        },
        objectResizeBy: (state, action) => {
            let { id, width, height } = action.payload;
            // @ts-ignore
            let paper = selectPaperSingleton(state);
            let orig = paper!.objects[id];
            paper!.objects[id] = { ...orig!, width, height };
        },
        // Needed to rename an object
        objectChangeId: (state, action) => {
            let { id, old_id } = action.payload;
            // @ts-ignore
            let paper = selectPaperSingleton(state);
            let orig = paper!.objects[old_id];
            paper!.objects[id] = { ...orig!, id };
            delete paper!.objects[old_id];
        }
    }
});

export const { addPaper, addObjectToPaper, objectMoveTo, objectResizeBy, objectChangeId } = paperSlice.actions;

// export const selectName = (state: RootState) => state.paper.domain_name;
export let {
    selectAll: selectPapers,
    selectById: selectPaperById,
    selectIds: selectPaperIds,
    selectEntities: selectPaperContainer
} = paperAdapter.getSelectors<RootState>((state) => state.paper);

// export let getPaperIds = createSelector(
//     selectPapers,
//     (papers) => papers.map((paper) => paper.id)
// );

export let selectPaperSingleton = createSelector(
    selectPaperIds,
    selectPaperContainer,
    (ids, papers) => {
        console.log('single', ids, papers);
        return papers[ids[0]];
    }
);

export default paperSlice.reducer;
