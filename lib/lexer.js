
let idGen = 1;

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
                        context.next();
                        context.token(char);
                        
                        break;

                    case '"':
                        context.next('');
                        context.token('string', false);
                        context.push('string');
                        break;

                    case 'n':
                        context.token('null');
                        context.jump(4 - 1);
                        break;

                    case 't':
                        context.token('true');
                        context.jump(4 - 1);
                        break;

                    case 'f':
                        context.token('false');
                        context.jump(5 - 1);
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
                context.next('');
                return;
            }

            if (char === '"') {
                context.next('');
                context.pop();
                context.breakToken();
                return;
            }

            context.next();
        });
    },

    stringEscape() {
        let unicode = null;

        this._onChar((char, context) => {
            if (unicode !== null) {
                if (unicode.length < 4) {
                    unicode += char;
                } else {
                    const value = String.fromCharCode(parseInt(unicode, 16));

                    context.next(value);
                    context.jump(4 - 1);
                    context.pop();
                }
            } else {
                if (char === 'u') {
                    context.next('');
                    unicode = '';
                } else {
                    const value = eval(`"\\${char}"`);

                    context.next(value);
                    context.pop();
                }
            }
        });
    },

    number() {
        this._onChar((char, context) => {
            if (/[\s\}\]\,]/.test(char)) {
                context.token('number');
                context.pop();
            } else {
                context.next();
            }
        });
    }
}

export class Lexer {
    constructor() {
        this._state = ['start'];
        this._listeners = {
            token: [],
            done: [],
            error: []
        };
        this._token = null;
        this._queuedContent = '';
        this._charListener = () => {};
        this._jump = 0;

        states[this.state].apply(this);
    }

    get state() {
        return this._state[this._state.length - 1];
    }

    _onChar(listener) {
        this._charListener = listener;
    }

    push(char) {
        if (this._jump > 0) {
            this._jump--;
        } else {
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
                    const content = this._queuedContent;
                    const charListeners = [];
                    const endListeners = [];
    
                    const token = {
                        id: idGen++,
                        type,
                        content,
                        final,

                        get final() {
                            return isFinal;
                        },

                        set final(value) {
                            if (!isFinal && value) {
                                // is setting to final

                                isFinal = true;
                                charListeners.splice(0);

                                endListeners.splice(0).forEach((listener) => {
                                    listener();
                                });
                            }
                        },

                        add(c) {
                            if (!this.final) {
                                this.content += c;
                                charListeners.forEach((fn) => {
                                    fn(c, token);
                                });
                            } else {
                                throw new Error("Cannot add to final token");
                            }
                        },

                        onChar(listener) {
                            if (!isFinal) {
                                charListeners.push(listener);
                            }
                        },

                        onEnd(listener) {
                            if (isFinal) {
                                listener();
                            } else {
                                endListeners.push(listener);
                            }
                        }
                    }

                    let isFinal = final;

                    this._queuedContent = '';

                    if (!final) {
                        this._token = token;
                    } else {
                        this._token = null;
                    }
    
                    this._listeners.token.forEach((listener) => {
                        listener(token);
                    });
                },
    
                jump: (n = 1) => {
                    this._jump = n;
                    advanced = !!n;
                },
    
                next: (append = char) => {
                    if (append.length === 1) {
                        if (this._token !== null) {
                            if (this._token.final) {
                                throw new Error("Final token cannot be added to");
                            } else {
                                this._token.add(append);
                            }
                        } else {
                            this._queuedContent += append;
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
    }

    _error(message = "") {
        const error = new Error(message);

        this._listeners.error.forEach((fn) => {
            fn(error);
        });
    }

    _done() {
        this._listeners.done.forEach((fn) => {
            fn();
        });
    }

    onToken(listener) {
        this._listeners.token.push(listener);
    }

    onError(listener) {
        this._listeners.error.push(listener);
    }

    onDone(listener) {
        this._listeners.done.push(listener);
    }
}

export default Lexer;
