import { configureStore, ThunkAction, Action, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import logger from 'redux-logger';
import undoable, { StateWithHistory } from 'redux-undo';

import paperReducer from '../features/paper/paperSlice';
import objectReducer from '../features/object/objectSlice';
import relationshipReducer from '../features/relationship/relationshipSlice';

// import model from '/Users/uberfoo/projects/sarzak/grace/tests/mdd/models/everything.json';

// import model from '/Users/uberfoo/projects/sarzak/nut/models/cat_dog.json';
// import model from '/Users/uberfoo/projects/sarzak/nut/models/drawing_orig.json';

// import model from '/Users/uberfoo/tmp/foo/models/bar.json';

import model from '/Users/uberfoo/projects/sarzak/sarzak/models/sarzak.json';
// import model from '/Users/uberfoo/projects/sarzak/sarzak/models/drawing.json';

// import model from '/Users/uberfoo/projects/sarzak/nut/crates/test_models/models/one_to_one.json';
// import model from '/Users/uberfoo/projects/sarzak/nut/crates/test_models/models/one_to_many.json';
// import model from '/Users/uberfoo/projects/sarzak/nut/crates/test_models/models/imported_object.json';
// import model from '/Users/uberfoo/projects/sarzak/nut/crates/test_models/models/singleton.json';
// import model from '/Users/uberfoo/projects/sarzak/nut/crates/test_models/models/everything.json';
// import model from '/Users/uberfoo/projects/sarzak/nut/crates/test_models/models/isa_relationship.json';
// import model from '/Users/uberfoo/projects/sarzak/nut/crates/test_models/models/associative.json';

import { open } from '@tauri-apps/api/dialog';

export const OpenModel = async () => {
    try {
        let path = await open();
        // @ts-ignore
        // let content = await readTextFile(path);

        // let state = store.getState();
        // let new_state = JSON.parse(content);
        console.log(path);
        return path;

    } catch (e) {
        console.error(e);
    }
};

// let model = OpenModel();

export const load_store = async () => {
    try {
        let model = await open();
        const store = configureStore({
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
                }).concat(logger),
            devTools: true
        });

        return store;
    } catch (e) {
        console.error(e);
    }
};

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
    key_letter: string,
    name: string,
    description: string,
    attributes: Dictionary<AttributeStore>
}

export interface ObjectUI {
    x: number,
    y: number,
    width: number,
    height: number
}

export interface GlyphAnchor {
    // I _think_ that this is the object to which an arrow is attached.
    id: string,
    dir: 'North' | 'South' | 'East' | 'West',
    x: number,
    y: number,
    offset: Point
}

// Somehow I don't think this does what I think it does.
export type RelationshipUI = BinaryUI | IsaUI | AssociativeUI;

export interface IsaUI {
    from: GlyphAnchor,
    to: GlyphAnchor[]
}

export interface BinaryUI {
    from: GlyphAnchor,
    to: GlyphAnchor
}

export interface AssociativeUI {
    middle: GlyphAnchor,
    from: Point,
    one: GlyphAnchor,
    other: GlyphAnchor
}

export interface AttributeStore {
    id: string,
    name: string,
    type: Type,
    is_ref?: boolean
}

export type RelationshipStore = Binary | Isa | Associative;

export function isBinary(arg: any): arg is Binary {
    return arg.Binary !== undefined;
}

export function isIsa(arg: any): arg is Isa {
    return arg.Isa !== undefined;
}

export function isAssociative(arg: any): arg is Associative {
    return arg.Associative !== undefined;
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
    formalizing_attribute_name: string
}

export interface Dependent {
    obj_id: string,
    description: string,
    cardinality: Cardinality,
    conditionality: Conditionality
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
    from: AssociativeReferrer,
    one: Dependent | null,
    other: Dependent | null
}

export interface AssociativeReferrer {
    id: string,
    obj_id: string,
    cardinality: Cardinality,
    conditionality: Conditionality,
    one_referential_attribute: string,
    other_referential_attribute: string
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
        return true;
    }),
    debug: false,
    groupBy: ((action, current, previous) => {
        // This is slick. All we have to to is look for actions that are changing a reference.
        // Write a function to return the current id, could have been previous. The undo thing
        // uses the ids to group undo operations.
        //
        // Now, to group a bunch of stuff moving, that's different. It's not just changing
        // ids. I need to return something unique that considers the object, and it's
        // attached relationships. I think this is in reference to the group move feature.
        // It's not at all clear how it was realized though. My comments are really bad. 😫
        // If I had to guess, which I sort of do, I'd say it's in the action.payload.tag.
        //
        // Yes, it's the tag. Just set tag to something (consistent across the undo operation)
        // in the payload. It'll group them by tag.
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
                if (action.payload.tag)
                    return action.payload.tag;
                return action.payload.id;
            case "paper/relationshipUpdateBinaryFrom":
                if (action.payload.tag)
                    return action.payload.tag;
                return action.payload.from.id;
            case "paper/relationshipUpdateBinaryTo":
                if (action.payload.tag)
                    return action.payload.tag;
                return action.payload.to.id;
            case "paper/relationshipUpdateIsaFrom":
                if (action.payload.tag)
                    return action.payload.tag;
                return action.payload.new_from.id;
            case "paper/relationshipUpdateIsaTo":
                if (action.payload.tag)
                    return action.payload.tag;
                return action.payload.new_to.id;
            case "relationship/addRelationship":
                if (action.payload.tag)
                    return action.payload.tag;
                return action.payload.id;
            case "paper/addRelationshipToPaper":
                return action.payload.id;
            case "paper/relationshipUpdateBinaryRelPhrase":
                return action.payload.id;
            case 'relationship/removeRelationship':
                if (action.payload.tag)
                    return action.payload.tag;
                return action.payload.id;
            case 'paper/removeRelationshipFromPaper':
                if (action.payload.tag)
                    return action.payload.tag;
                return action.payload.id;
            case 'paper/relationshipChangeId':
                if (action.payload.tag)
                    return action.payload.tag;
                return action.payload.id;
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
        }).concat(logger),
    devTools: true
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
