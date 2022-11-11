import { createEntityAdapter, createSlice, createSelector } from '@reduxjs/toolkit';

import { RootState, PaperStore } from '../../app/store';

let paperAdapter = createEntityAdapter<PaperStore>();
let initialState = paperAdapter.getInitialState();

export const paperSlice = createSlice({
    name: 'paper',
    initialState,
    reducers: {
        rename(state, action) {
            let { id, name } = action.payload;
            let paper = state.entities[id];
            paper!.domain_name = name;
        }
    }
});

export const { rename } = paperSlice.actions;

// export const selectName = (state: RootState) => state.paper.domain_name;
export let {
    selectAll: selectPapers,
    selectById: selectPaperById
} = paperAdapter.getSelectors<RootState>((state) => state.paper);

export let getPaperIds = createSelector(
    selectPapers,
    (papers) => papers.map((paper) => paper.id)
);

export default paperSlice.reducer;
