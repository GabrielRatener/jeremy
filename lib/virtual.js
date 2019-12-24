
import {STRING, ARRAY, HASH_MAP} from "./constants"

const nonExistenceError = new Error("Value does not exist");

// represents a future JSON value
export default class Virtual {
    constructor() {
        this._type = null;
        this._cache = new Map();
        this._promises = [];
        this._value = undefined;

        this._progressiveValue = null;
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

        switch(type) {
            case STRING:
                this._progressiveValue = '';
                return;
            case ARRAY:
                this._progressiveValue = [];
                return;
            case HASH_MAP:
                this._progressiveValue = {};
                return;
        }
    }

    _add(value, prop = null) {
        switch(this._type) {
            case STRING:
                this._progressiveValue += value;
                break;
            case ARRAY:
                this._progressiveValue.push(value);
                break;
            case HASH_MAP:
                this._progressiveValue[prop] = value;
                break;
        }
    }

    _end() {
        this._setValue(this._progressiveValue);

        this._progressiveValue = null;
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

    get(prop) {
        if (this._cache.has(prop)) {
            return this._cache.get(prop);
        } else {
            const virtual = new Virtual();

            if (this._value !== undefined) {
                if (prop in this._value) {
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
