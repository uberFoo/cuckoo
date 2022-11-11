import { createSlice, createEntityAdapter } from '@reduxjs/toolkit';

import { RootState, ObjectStore } from '../../app/store';

let objectAdapter = createEntityAdapter<ObjectStore>();
let initialState = objectAdapter.getInitialState();

export let objectSlice = createSlice({
    name: 'objects',
    initialState,
    reducers: {
        addObject: objectAdapter.addOne,
        removeObject: objectAdapter.removeOne
        // rename(state, action) {
        //     state.name = action.payload;
        // }
    }
});

export let { addObject, removeObject } = objectSlice.actions;

// export const selectName = (state: RootState) => state.objects.name;
export let {
    selectAll: selectObjects,
    selectById: selectObjectById
} = objectAdapter.getSelectors<RootState>((state) => state.objects);

export default objectSlice.reducer;