import { createSlice } from '@reduxjs/toolkit';

import { RootState, PaperStore } from '../../app/store';

let initialState: PaperStore = {
    width: 3200,
    height: 1600,
    domain_name: 'sarzak_ooa_0',
    domain_ns: 'b49d6fe1-e5e9-5896-bd42-b72012429e52',
};

export const paperSlice = createSlice({
    name: 'paper',
    initialState,
    reducers: {
        rename(state, action) {
            state.domain_name = action.payload;
        }
    }
});

export const { rename } = paperSlice.actions;

export const selectName = (state: RootState) => state.paper.domain_name;

export default paperSlice.reducer;
