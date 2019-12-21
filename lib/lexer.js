
import {Queue} from "./collections"

const states = {
    start() {
        this._onChar((char, context) => {
            if (/\s/.test(char)) {
                context.discard();
            } else {
                switch (char) {
                    case ':':
                    case ',':
                    case '{':
                    case '}':
                    case '[':
                    case ']':
                        // for punc tokens type matches value...
                        context.token(char);
                        context.next();
                        
                        break;

                    case '"':
                        context.token('string', false);
                        context.push('string');
                        context.next();
                        break;
                    
                    default:
                        if (/\d/.test(char)) {
                            context.push('number');
                        }

                        break;
                }
            }
        });
    },
    string() {

        this._onChar((char, context) => {
            if (char === '\\') {
                context.push('stringEscape');
            }

            context.next();
        });
    },
    stringEscape() {
        this._onChar((char, context) => {
            context.next();
            context.pop();
        });
    }
}

export class Lexer {
    constructor() {
        this._state = ['start'];
        this._listeners = [];
        this._token = null;
        this._charQueue = new Queue();
        this._charListener = () => {};

        states[this.state].apply(this);
    }

    get state() {
        return this._state[this._state.length - 1];
    }

    _onChar(listener) {
        this._charListener = listener;
    }

    push(char) {
        const context = {
            push: (state) => {
                if (pushed) {
                    throw new Error("Cannot push more than once");
                }

                this._state.push(state);
                states[state].apply(this);
                pushed = true;
            },

            pop: () => {
                this._state.pop();
                states[this.state].apply(this);
            },

            breakToken: () => {
                // stop adding content to current token
                // and start queueing content up for next token
                // This makes current token final

                this._token.final = true;
                this._token = null;
            },

            token: (type, final = true) => {
                const content =
                  (this._charQueue.length > 0) ?
                    (() => {
                        let str = '';

                        while (this._charQueue.length > 0) {
                            str += this._charQueue.dequeue();
                        }

                        return str;
                    })() :
                    '';

                const token = {
                    type,
                    content,
                    final
                }

                if (!final) {
                    this._token = token;
                }

                this._listeners.forEach((listener) => {
                    listener(token);
                });
            },

            next: () => {
                if (this._token !== null) {
                    if (this._token.final) {
                        throw new Error("Final token cannot be added to");
                    } else {
                        this._token.content += char;
                    }
                }

                advanced = true;
            },

            discard: () => {
                advanced = true;
            }
        }

        let advanced = false, pushed = false;

        while (!advanced) {
            this._charListener(char, context);
        }
    }

    onToken(listener) {
        this._listeners.push(listener);
    }
}