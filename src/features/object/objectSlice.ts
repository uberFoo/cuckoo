import { createSlice, createEntityAdapter } from '@reduxjs/toolkit';

import { RootState, ObjectStore } from '../../app/store';

let objectAdapter = createEntityAdapter<ObjectStore>();
let initialState = objectAdapter.getInitialState();

export let objectSlice = createSlice({
    name: 'objects',
    initialState,
    reducers: {
        addObject: objectAdapter.addOne,
        removeObject: objectAdapter.removeOne,
        moveTo: (state, action) => {
            let { id, x, y } = action.payload;
            let object = state.entities[id];
            object!.extent = { ...object!.extent, x, y };
        },
        resizeBy: (state, action) => {
            let { id, width, height } = action.payload;
            let object = state.entities[id];
            object!.extent = { ...object!.extent, width, height }
        },
        rename: (state, action) => {
            let { id, name } = action.payload;
            let object = state.entities[id];
            object!.name = name;
        }
    }
});

export let { addObject, removeObject, moveTo, resizeBy, rename } = objectSlice.actions;

// export const selectName = (state: RootState) => state.objects.name;
export let {
    selectAll: selectObjects,
    selectById: selectObjectById
} = objectAdapter.getSelectors<RootState>((state) => state.objects);

export default objectSlice.reducer;