import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit';

import paperReducer from '../features/paper/paperSlice';
import objectReducer from '../features/object/objectSlice';

import model from '../with_obj.json'


export interface PaperStore {
    id: string,
    width: number,
    height: number,
    domain_name: string,
    domain_ns: string,
}

export interface ObjectStore {
    id: string,
    name: string,
    key_letter: string,
    extent: Extent
}

export interface Extent {
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
    ForeignKey: string
}

type Type = 'Uuid' | 'Integer' | 'Float' | 'String' | ForeignKey

export const store = configureStore({
    reducer: {
        paper: paperReducer,
        objects: objectReducer,
    },
    preloadedState: model
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
    ReturnType,
    RootState,
    unknown,
    Action<string>
>;