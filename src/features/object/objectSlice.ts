import { createSlice, createEntityAdapter } from '@reduxjs/toolkit';
import undoable from 'redux-undo';

import { RootState, ObjectStore } from '../../app/store';
import { addUI } from './objectUISlice';

let objectAdapter = createEntityAdapter<ObjectStore>();
let initialState = objectAdapter.getInitialState();

export let objectSlice = createSlice({
    name: 'objects',
    initialState,
    reducers: {
        addObject: objectAdapter.addOne,
        // addObject: (state, action) => {
        //     let { id, name, extent } = action.payload;
        //     objectAdapter.addOne(state, { id, name });
        //     //@ts-ignore
        //     action.asyncDispatch(addUI(extent));
        // },
        removeObject: objectAdapter.removeOne,
        replaceObject: (state, action) => {
            let { object, old_id } = action.payload;
            objectAdapter.removeOne(state, old_id);
            objectAdapter.addOne(state, object);
        },
        rename: (state, action) => {
            let { id, name } = action.payload;
            let object = state.entities[id];
            object!.name = name;
        }
    }
});

export let { addObject, removeObject, replaceObject, rename } = objectSlice.actions;

// export const selectName = (state: RootState) => state.objects.name;
export let {
    selectAll: selectObjects,
    selectById: selectObjectById
} = objectAdapter.getSelectors<RootState>((state) => state.objects);

export default objectSlice.reducer;