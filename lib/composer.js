
import {HASH_MAP, ARRAY, STRING} from "./constants"
import Virtual from "./virtual"

const stackItem = (virtual, container = HASH_MAP) => {
    return {
        virtual,
        container,
        prop: null,
        index: null
    }
}

export class Composer {
    constructor() {
        this._lastToken = null;
        this._contextStack = [];

        this._stack = [stackItem(new Virtual(), ROOT)];

        this._prop = null;
    }

    get virtual() {
        return this._virtual[0].virtual;
    }

    get objectContext() {
        if (this._stack.length > 0) {
            return this._stack[this._stack.length - 1].type;
        } else {
            return null;
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

    _top() {
        if (this._stack.length > 0) {
            return this._stack[this._stack.length - 1];
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

        if (top.container === ARRAY) {
            // array index can only be incremented when inside array...

            if (top.index === null) {
                top.index = 0;
            } else {
                top.index++;
            }
        }
    }

    _push(type) {
        const {virtual, context, ...top} = this._top();

        this._incrementArrayIndex();

        if (context === ARRAY) {
            const subVirtual = virtual.get(top.index);

            subVirtual._start(ARRAY);
            this._stack.push(stackItem(subVirtual, type));

            return;
        }

        if (context === HASH_MAP) {
            const subVirtual = virtual.get(top.prop);

            subVirtual._start(HASH_MAP);
            this._stack.push(stackItem(subVirtual, type));

            return;
        }
    }

    _pop() {
        const {virtual} = this._top();

        virtual._end();
        this._stack.pop();
    }

    _setValue(value) {
        const {virtual, context, ...top} = this._top();

        if (context === ARRAY) {
            virtual
                .get(top.index)
                ._setValue(value);
            
            return;
        }

        if (context === HASH_MAP) {
            virtual
                .get(top.prop)
                ._setValue(value);

            return;
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
        }

        this._lastToken = token;
    }
}
