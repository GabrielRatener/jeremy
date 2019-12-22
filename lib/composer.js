
export const HASH_MAP = 1, ARRAY = 2;

export class Composer {
    constructor() {
        this._lastToken = null;
        this._contextStack = [];
    }

    get objectContext() {
        if (this._contextStack.length > 0) {
            return this._contextStack[this._contextStack.length - 1];
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

    push(token) {
        switch (token.type) {
            case '{':
                this._contextStack.push(HASH_MAP);
                break;

            case '[':
                this._contextStack.push(ARRAY);
                break;

            case ':'
        }
    }
}
