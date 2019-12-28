
import {STRING, ARRAY, HASH_MAP} from "./constants"

const isObject = (value) => {
    switch(typeof value) {
        case 'string': return true;
        case 'object': return value !== null;
        default: return false;
    }
}

const nonExistenceError = new Error("Value does not exist");

const reducers = {
    [STRING]: (progressiveValue) => {

        return progressiveValue.join('');
    },
    [ARRAY]: (progressiveValue) => {
        return progressiveValue.slice(0);
    },
    [HASH_MAP]: (progressiveValue) => {
        const reducer = (object, [key, val]) => {
            object[key] = val;

            return object;
        }

        return progressiveValue.reduce(reducer, {});
    }
}

// represents a future JSON value
export default class Virtual {
    constructor() {
        this._type = null;
        this._cache = new Map();
        this._promises = [];
        this._value = undefined;

        this._progressiveValue = [];
        this._bailed = false;
    }

    _setProp(prop, value) {

        this
            .get(prop)
            ._setValue(value);
    }

    _setValue(value) {

        this._value = value;

        this._promises.forEach((controller) => {
            controller.resolve(value);
        });
    }

    _start(type) {
        this._type = type;
        this._progressiveValue = [];
    }

    _add(value, prop) {

        if (this._type === HASH_MAP) {
            this._progressiveValue.push([prop, value]);
        } else {
            this._progressiveValue.push(value);
        }

        this.get(prop)._setValue(value);
    }

    _end() {
        const reduce = reducers[this._type];

        this._setValue(reduce(this._progressiveValue));
        this._progressiveValue = [];
    }

    _bail() {
        this._bailed = true;

        this._promises.forEach((controller) => {
            controller.reject(nonExistenceError);
        });
    }

    value() {
        // return a promise that resolves to the value

        if (this._value !== undefined) {
            return Promise.resolve(this._value);
        }

        if (this._bailed) {
            return Promise.reject(nonExistenceError);
        }

        return new Promise((resolve, reject) => {
            this._promises.push({resolve, reject});
        });
    }

    iterate() {
        // TODO: ^
    }

    get(property) {
        const prop = `${property}`;

        if (this._cache.has(prop)) {
            return this._cache.get(prop);
        } else {
            const virtual = new Virtual();

            if (this._value !== undefined) {

                if (isObject(this._value) && prop in this._value) {
                    virtual._setValue(this._value[prop]);
                } else {
                    virtual._bail();
                }
            } else {
                this._cache.set(prop, virtual);
            }

            return virtual;
        }
    }
}
