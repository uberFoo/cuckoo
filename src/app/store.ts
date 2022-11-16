import { configureStore, ThunkAction, Action, getDefaultMiddleware, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import paperReducer from '../features/paper/paperSlice';
import objectReducer from '../features/object/objectSlice';
import attributeReducer from '../features/attribute/attributeSlice';

// import model from '../test.json'

export interface PaperStore {
    id: string,
    width: number,
    height: number,
    domain_name: string,
    domain_ns: string,
    objects: Dictionary<ObjectUI>
}

export interface DictionaryNum<T> {
    [id: number]: T | undefined
}

export interface Dictionary<T> extends DictionaryNum<T> {
    [id: string]: T | undefined
}

export interface ObjectStore {
    id: string,
    name: string,
}

export interface ObjectUI {
    id: string,
    x: number,
    y: number,
    width: number,
    height: number
}

export interface AttributeStore {
    id: string,
    name: string,
    type: Type,
    obj_id: string
}

export type RelationshipStore = Binary | Isa | Associative;

export interface Binary {
    id: string,
    number: number,
    from: Independent,
    to: Dependent
}

interface Independent {
    obj_id: string,
    description: string,
    cardinality: Cardinality,
    conditionality: Conditionality,
    formalizing_attr: string
}

interface Dependent {
    obj_id: string,
    description: string,
    cardinality: Cardinality,
    Conditionality: Conditionality
}

export interface Isa {
    id: string,
    number: number,
    obj_id: string
}

export interface Associative {
    id: string,
    number: number,
    from: string,
    one: string,
    other: string
}

type Cardinality = 'One' | 'Many';
type Conditionality = 'Conditional' | 'Unconditional';
interface ForeignKey {
    foreign_key: string
}

export type Type = 'Uuid' | 'Integer' | 'Float' | 'String' | ForeignKey

const rootReducer = combineReducers({
    paper: paperReducer,
    objects: objectReducer,
    attributes: attributeReducer,
});

let persistConfig = {
    key: 'root',
    version: 1,
    storage
}

// @ts-ignore
// const persistedReducer = persistReducer(persistConfig, rootReducer);

let _model =
{
    paper: {
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
    },
    objects: {
        ids: [],
        entities: {}
    },
    attributes: {
        ids: [],
        entities: {}
    }
};

export const store = configureStore({
    reducer: rootReducer,
    // reducer: persistedReducer,
    preloadedState: _model,
    // @ts-ignore
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // @ts-ignore
                ignoreActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER]
            }
        })
});

export const persistor = persistStore(store);

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
    ReturnType,
    RootState,
    unknown,
    Action<string>
>;
