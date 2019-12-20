
import {Constructor as ConstructorContext} from "./constructor"

type Character = string;

enum State {
    START,
    STRING,
    STRING_ESCAPE,
    NUMBER,
}

interface Parser {
    push(char: Character);
    finish();
}

export const createParser = (ctxt : ConstructorContext) : Parser => {
    const jump = (n) => {
        skip = n;
    }

    const finishNum = () => {
        if (buffered.length > 0) {
            ctxt.setValue(parseFloat(buffered));
        }
    }

    const push = (type : '{' | '[') => {
        stack.push(type);
        ctxt.startObject();
    }

    const pop = () => {
        if (stack.length > 0) {
            stack.pop();
            ctxt.pop();
        } else {
            throw new Error(`Bitch you aint poppin an empty stack!`);
        }
    }

    const stack = [];

    let state = State.START;
    let buffered = '';
    let skip = 0;
    let finished = false;


    return {
        push(char : Character) {
            if (skip > 0) {
                skip--;
                return;
            }

            switch (state) {
                case State.START:

                    switch (char) {
                        case ' ':
                        case '\t':
                        case '\n':
                        case ',':
                            break;
                        case ':':
                            ctxt.expectValue();
                            break;

                        case '{':
                            ctxt.startObject();
                            break;

                        case '}':
                            finishNum();
                            ctxt.pop();
                            break;

                        case '[':
                            ctxt.startArray();
                            break;

                        case ']':
                            finishNum();
                            ctxt.pop();
                            break;

                        case '"':
                            state = State.STRING;
                            ctxt.startString();
                            break;

                        case 'n':
                            ctxt.setValue(null);
                            jump(4); // jump to end of 'null'
                            break;

                        case 'f':
                            ctxt.setValue(false);
                            jump(4); // jump to end of 'false'
                            break;

                        case 't':
                            ctxt.setValue(true);
                            jump(3);  // jump to end of 'true'
                            break;

                        default:
                            // must be number
                            if (/d/.test(char)) {
                                buffered += char;
                                state = State.NUMBER;
    
                                break;    
                            }

                            if (char === ':' ) {

                            }
                    }
                    
                    break;

                case State.STRING:
                    switch (char) {
                        case '\\':
                            state = State.STRING_ESCAPE;
                            break;
                        case '"':
                            ctxt.endString();
                    }

                    break;

                case State.STRING_ESCAPE:
                    ctxt.addChar(char);
                    state = State.STRING;
                    break;

                case State.NUMBER:
                    switch(char) {
                        case ' ':
                        case '\t':
                        case '\n':
                        case ',':
                            ctxt.setValue(parseFloat(buffered));
                            buffered = '';
                            state = State.START;
                            break;
                        
                        default:
                            buffered += char;
                            break;
                    }

                    break;
            }
        },

        finish() {
            finished = true;
        }
    }
}