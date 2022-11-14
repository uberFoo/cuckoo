import { createSlice, createEntityAdapter } from '@reduxjs/toolkit';
import { v5 as uuid } from 'uuid';

import { RootState, ObjectStore } from '../../app/store';

let objectAdapter = createEntityAdapter<ObjectStore>();
let initialState = objectAdapter.getInitialState();

export let objectSlice = createSlice({
    name: 'objects',
    initialState,
    reducers: {
        addObject: objectAdapter.addOne,
        removeObject: objectAdapter.removeOne,
        replaceObject: (state, action) => {
            let object = action.payload;
            objectAdapter.removeOne(state, object.id);
            // I just died a little doing this.
            let id = uuid(object.name, "b49d6fe1-e5e9-5896-bd42-b72012429e52");
            object.id = id;
            objectAdapter.addOne(state, object);
        },
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

export let { addObject, removeObject, replaceObject, moveTo, resizeBy, rename } = objectSlice.actions;

// export const selectName = (state: RootState) => state.objects.name;
export let {
    selectAll: selectObjects,
    selectById: selectObjectById
} = objectAdapter.getSelectors<RootState>((state) => state.objects);

export default objectSlice.reducer;