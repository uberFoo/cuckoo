import { configureStore, ThunkAction, Action, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import logger from 'redux-logger';
import undoable, { StateWithHistory, excludeAction } from 'redux-undo';

import paperReducer from '../features/paper/paperSlice';
import objectReducer from '../features/object/objectSlice';
import relationshipReducer from '../features/relationship/relationshipSlice';

import model from '../js_schema.json'

export interface PaperStore {
    id: string,
    width: number,
    height: number,
    offset: Point,
    domain_name: string,
    domain_ns: string,
    objects: Dictionary<ObjectUI>,
    relationships: Dictionary<RelationshipUI>
}

export interface Point {
    x: number,
    y: number
}

export interface Rect {
    x0: number,
    y0: number,
    x1: number,
    y1: number,
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
    attributes: Dictionary<AttributeStore>
}

export interface ObjectUI {
    x: number,
    y: number,
    width: number,
    height: number
}

export interface BinaryEnd {
    id: string,
    dir: 'North' | 'South' | 'East' | 'West',
    x: number,
    y: number
}

export type RelationshipUI = BinaryUI | IsaUI;

export interface IsaUI {
    from: BinaryEnd,
    to: BinaryEnd[]
}

export interface BinaryUI {
    from: BinaryEnd,
    to: BinaryEnd
}

export interface AttributeStore {
    id: string,
    name: string,
    type: Type,
    is_ref?: boolean
}

export type RelationshipStore = Binary | Isa | Associative;

export function isBinary(arg: any): arg is Binary {
    return arg.to !== undefined;
}

export function isIsa(arg: any): arg is Isa {
    return arg.subtypes !== undefined;
}

export function isAssociative(arg: any): arg is Associative {
    return arg.one !== undefined;
}

export interface Binary {
    id: string,
    number: number,
    from: Independent,
    to: Dependent
}

export interface Independent {
    obj_id: string,
    description: string,
    cardinality: Cardinality,
    conditionality: Conditionality,
    formalizing_attr: string
}

export interface Dependent {
    obj_id: string,
    description: string,
    cardinality: Cardinality,
    Conditionality: Conditionality
}

export interface Isa {
    id: string,
    number: number,
    obj_id: string,
    subtypes: string[]
}

export interface Associative {
    id: string,
    number: number,
    from: string,
    one: string,
    other: string
}

export type Cardinality = 'One' | 'Many';
export type Conditionality = 'Conditional' | 'Unconditional';

// export type Type = 'Uuid' | 'Integer' | 'Float' | 'String' | ForeignKey
export type Type = 'Uuid' | 'Integer' | 'Float' | 'String'

const rootReducer = undoable(combineReducers({
    paper: paperReducer,
    objects: objectReducer,
    relationships: relationshipReducer
}), {
    // Ignore panning the paper.
    // @ts-ignore
    filter: ((action, current, previous) => {
        if (action.type === "paper/savePaperOffset") {
            return false;
        }
    }),
    groupBy: ((action, current, previous) => {
        // This is slick. All we have to to is look for actions that are changing a reference.
        // Write a function to return the current id, could have been previous. The undo thing
        // uses the ids to group undo operations.
        //
        // Now, to group a bunch of stuff moving, that's different. It's not just changing
        // ids. I need to return something unique that considers the object, and it's
        // attached relationships.
        switch (action.type) {
            case "attributes/updateObjectReference":
                return action.payload.id;
            case "paper/objectChangeId":
                return action.payload.id;
            case "objects/replaceObject":
                return action.payload.object.id;
            case "paper/addObjectToPaper":
                return action.payload.id;
            case "objects/addObject":
                return action.payload.id;
            case "paper/objectMoveTo":
                return action.payload.id;
            case "paper/relationshipUpdateBinaryFrom":
                return action.payload.from.id;
            case "paper/relationshipUpdateBinaryTo":
                return action.payload.to.id;
            case "paper/relationshipUpdateIsaFrom":
                return action.payload.new_from.id;
            case "paper/relationshipUpdateIsaTo":
                return action.payload.new_to.id;

            default:
                console.error(`bad action type ${action.type}`);
                break;
        }
        return null;
    })
});

let persistConfig = {
    key: 'root',
    version: 1,
    storage
}

// @ts-ignore
const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
    reducer: persistedReducer,
    // @ts-ignore
    preloadedState: (model as any) as StateWithHistory<typeof model>,
    // @ts-ignore
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // @ts-ignore
                ignoreActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER]
            }
        }).concat(logger)
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
