
// chunk values cannot be streamed and are evaluated instantly
type ChunkValue = number | boolean | null;

enum ContextType {
    ARRAY,
    OBJECT,
    STRING
}

interface Node {
    type: ContextType;
    value: string | any[] | object;
}

export class Constructor {
    _stack: Node[];
    _expecting: boolean;
    _string: string; // for lack of a better word...

    constructor() {
        this._stack = [];
        this._expecting = false;
    }

    get context() {
        if (this._stack.length === 0) {
            return null;
        } else {
            return this._stack[this._stack.length - 1].type;
        }
    }

    expectValue() {
        this._expecting = true;
    }

    startArray() {
        this._stack.push({
            type: ContextType.ARRAY,
            value: []
        });
    }

    startObject() {
        this._expecting = false;

        this._stack.push({
            type: ContextType.OBJECT,
            value: {}
        });
    }

    startString() {
        this._expecting = false;

        this._stack.push({
            type: ContextType.STRING,
            value: ""
        });
    }

    setValue(value) {
        if (this.context === ContextType.OBJECT) {
            this._expecting = false;
            return;
        }
    }

    addChar(char : String) {
        const top = this._stack[this._stack.length];

        if (top.type === ContextType.STRING) {
            //@ts-ignore
            top.value += char;
        }
    }

    endString() {
        if (this.context === ContextType.OBJECT && !this._expecting) {

        }
    }

    pop() {
        if (this.context) {
            this._stack.pop();
        }
    }
}