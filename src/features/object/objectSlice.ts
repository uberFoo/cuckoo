import { createSlice, createEntityAdapter } from '@reduxjs/toolkit';

import { RootState, ObjectStore } from '../../app/store';

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
        },
        addAttribute: (state, action) => {
            let { id, attr } = action.payload;
            let object = state.entities[id];
            object!.attributes[attr.id] = attr;
        },
        removeAttribute: (state, action) => {
            let { id, attr_id } = action.payload;
            let object = state.entities[id];
            let attrs = object!.attributes;
            let { [attr_id]: remove, ...remainingAttrs } = attrs;
            object!.attributes = remainingAttrs;
        }
    }
});

export let { addObject, removeObject, replaceObject, rename, addAttribute, removeAttribute } = objectSlice.actions;

// export const selectName = (state: RootState) => state.objects.name;
export let {
    selectAll: selectObjects,
    selectById: selectObjectById
} = objectAdapter.getSelectors<RootState>((state) => state.present.objects);

export default objectSlice.reducer;