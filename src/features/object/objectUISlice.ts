import { createSlice, createEntityAdapter } from '@reduxjs/toolkit';

import { RootState, ObjectUI } from '../../app/store';

let objectUIAdapter = createEntityAdapter<ObjectUI>();
let objectUIInitialState = objectUIAdapter.getInitialState();

export let objectUISlice = createSlice({
    name: 'object-ui',
    initialState: objectUIInitialState,
    reducers: {
        addUI: objectUIAdapter.addOne,
        removeUI: objectUIAdapter.removeOne,
        moveTo: (state, action) => {
            let { id, x, y } = action.payload;
            let ui = state.entities[id];
            ui!.x = x;
            ui!.y = y;
        },
        resizeBy: (state, action) => {
            let { id, width, height } = action.payload;
            let ui = state.entities[id];
            ui!.width = width;
            ui!.height = height;
        },
        // Needed to rename an object
        changeUIId: (state, action) => {
            let { id, old_id } = action.payload;
            let ui = state.entities[old_id];
            ui!.id = id;
            objectUIAdapter.removeOne(state, old_id);
            objectUIAdapter.addOne(state, ui!);
        }
    }
});

export let { addUI, removeUI, moveTo, resizeBy, changeUIId } = objectUISlice.actions;

// export let {
// selectAll: selectObjectsUI,
// selectById: selectObjectUIById
// } = objectUIAdapter.getSelectors<RootState>((state) => state.object_ui);

export default objectUISlice.reducer;
