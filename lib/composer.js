
import {HASH_MAP, ARRAY, STRING} from "./constants.js"
import Virtual from "./virtual.js"

const stackItem = (virtual, type = HASH_MAP, root = false) => {
    return {
        type,
        root,
        virtual,
        index: 0,
        prop: null
    }
}

export default class Composer {
    constructor() {
        this._lastToken = null;
        this._contextStack = [];
        this._stack = [];

        this._prop = null;

        this.virtual = new Virtual();
    }

    get objectContext() {
        if (this._stack.length > 0) {
            return this._stack[this._stack.length - 1].type;
        } else {
            return ROOT;
        }
    }

    get expectValue() {
        if (this._lastToken !== null) {
            if (this.objectContext === ARRAY) {
                switch (this._lastToken.type) {
                    case ',': return true;
                    case '[': return true;
                    default: return false;
                }
            }

            if (this.objectContext === HASH_MAP) {
                return this._lastToken.type === ':';
            }

            return this._lastToken.type === ':';
        } else {
            return true;
        }
    }

    _top(n = 1) {
        if (this._stack.length > 0) {
            return this._stack[this._stack.length - n];
        } else {
            return null;
        }
    }

    _setPropertyName(name) {
        const top = this._top();

        top.prop = name;
    }

    _incrementArrayIndex() {
        const top = this._top();

        if (top !== null && top.type === ARRAY) {
            // array index can only be incremented when inside array...

            top.index++;
        }
    }

    _initStack(objectType) {
        const item = stackItem(this.virtual, objectType, true);

        this._stack.push(item);

        return item;
    }

    _push(objectType) {
        
        this._incrementArrayIndex();

        if (this._stack.length > 0) {
            const top = this._top();

            if (top.type === ARRAY) {
                const subVirtual = top.virtual.get(top.index);
    
                subVirtual._start(objectType);
                this._stack.push(stackItem(subVirtual, objectType));
    
                return;
            }
    
            if (top.type === HASH_MAP) {
                const subVirtual = top.virtual.get(top.prop);
    
                subVirtual._start(objectType);
                this._stack.push(stackItem(subVirtual, objectType));
    
                return;
            }
        } else {
            const top = this._initStack(objectType);

            top.virtual._start(objectType)
        }
    }

    _pop() {

        if (this._stack.length > 1) {
            const child = this._top();
            const parent = this._top(2);
    
            const alreadyAdded = (value) => {
                return typeof value === 'string';
            }

            const add = (prop = null) => {
                const value = child.virtual._syncValue();

                // strings are already set...
                if (!alreadyAdded(value)) {
                    parent.virtual._add(value, prop);
                }
            }

            if (parent.type === HASH_MAP) {

                add(parent.prop);
            }
    
            if (parent.type === ARRAY) {

                add();
            }
    
            child.virtual._end();
            this._stack.pop();
        } else {
            const {virtual} = this._stack.pop();

            virtual._end();
        }
    }

    _getCurrentProp() {
        if (this._stack.length > 0) {
            const top = this._top();

            if (top.type === ARRAY) {
                return top.index;
            }

            if (top.type === HASH_MAP) {
                return top.prop;
            }
        } else {
            return null;
        }
    }

    _setValue(value) {
        if (this._stack.length > 0) {
            const top = this._top();

            if (top.type === ARRAY) {
                top.virtual._add(value, top.index);
                
                return;
            }
    
            if (top.type === HASH_MAP) {
                top.virtual._add(value, top.prop);
    
                return;
            }

        } else {
            this.virtual._setValue(value);
        }
    }

    push(token) {

        switch (token.type) {
            case '{':
                this._push(HASH_MAP);

                break;

            case '[':
                this._push(ARRAY);
                break;

            case '}':
            case ']':
                this._pop();
                break;
            
            case ',':
                if (this.objectContext === ARRAY)  {
                    this._incrementArrayIndex();
                }   

                break;
                
            case ':':
                if (this.objectContext === HASH_MAP) {
                    this._setPropertyName(this._lastToken.content);
                } else {
                    throw new Error("Unexpected ':' token");
                }

                break;

            case 'true':
                this._setValue(true);
                break;
            case 'false':
                this._setValue(false);
                break;
            case 'null':
                this._setValue(null);
                break;

            case 'number':
                this._setValue(parseFloat(token.content));
                break;

            case 'string':
                if (this.expectValue) {
                    const top = this._top();
                    const prop = this._getCurrentProp();
                    const virtual =
                      (top === null) ?
                        this.virtual :
                        top.virtual.get(prop);

                    let index = 0;

                    token.onChar((c) => {

                        virtual._add(c, index);

                        index++;
                    });

                    token.onEnd(() => {

                        virtual._end();

                        this._setValue(virtual._syncValue());
                    });

                    virtual._start(STRING);
                }

                break;
        }

        this._lastToken = token;
    }
}
