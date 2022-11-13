import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch, AttributeStore, ObjectStore } from './store';
import { selectObjectById } from '../features/object/objectSlice';

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

/* eslint react-hooks/rules-of-hooks:  "off" */
export const getAttributeType = (attr: AttributeStore) => {
    if (typeof attr.type === 'object') {
        let obj_id = attr.type.foreign_key;
        let obj: ObjectStore | undefined = useAppSelector((state) => selectObjectById(state, obj_id));
        return {
            type: obj!.name,
            is_ref: true
        };
    } else {
        return {
            type: attr.type,
            is_ref: false
        };
    }
};