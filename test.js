
import {Lexer, compose} from "./lib/index.js"
import tape from "tape"

tape("Vanilla lexing", (t) => {
    const lexer = new Lexer();
    const json = '{"hello": "nonono", "baba": null, "gigig": 123123, "boob": false}';
    const arr = [];

    t.plan(4);

    return new Promise((resolve, reject) => {
        lexer.onToken((value) => {
            arr.push(value);
        });

        lexer.onDone(() => resolve());
        lexer.onError((err) => reject(err));

        setTimeout(() => {
            for (const c of json) {
                lexer.push(c);
            }
    
            lexer._done();
        }, 0);    
    }).then(() => {
        t.equals(arr[0].type, '{');
        t.equals(arr[3].type, 'string');
        t.equals(arr[3].content, 'nonono');
        t.equals(arr[11].type, 'number');
    });
});

tape("Lexing with escaped strings", (t) => {
    const lexer = new Lexer();
    const json = '{"hel\\\\lo": "no\\nono", "baba": null, "gigig": 123123, "boob": false}';
    const arr = [];

    t.plan(4);

    return new Promise((resolve, reject) => {
        lexer.onToken((value) => {
            arr.push(value);
        });

        lexer.onDone(() => resolve());
        lexer.onError((err) => reject(err));

        setTimeout(() => {
            for (const c of json) {
                lexer.push(c);
            }
    
            lexer._done();
        }, 0);
    }).then(() => {
        t.equals(arr[0].type, '{');
        t.equals(arr[1].type, 'string');
        t.equals(arr[1].content, 'hel\\lo');
        t.equals(arr[3].content, 'no\nono');
    });
});

tape("Lexing unicode strings", (t) => {
    const lexer = new Lexer();
    const json = '{"ba\\u4444a": null, "gigig": "\\u7777"}';
    const arr = [];

    t.plan(3);

    return new Promise((resolve, reject) => {
        lexer.onToken((value) => {
            arr.push(value);
        });

        lexer.onDone(() => resolve());
        lexer.onError((err) => reject(err));

        setTimeout(() => {
            for (const c of json) {
                lexer.push(c);
            }
    
            lexer._done();
        }, 0);
    }).then(() => {
        t.equals(arr[1].type, 'string');
        t.equals(arr[1].content, 'ba\u4444a');
        t.equals(arr[7].content, '\u7777');
    });
});


tape("Composing basic object", (t) => {
    const json = '{"hello": 222, "bye": null}';

    const virtual = compose((add, done) => {
        setTimeout(() => {
            for (const c of json) {
                add(c);
            }
    
            done();
        }, 0);    
    });

    t.plan(2);


    return (async () => {
        const h = await virtual.get('hello').value();
        const b = await virtual.get('bye').value();

        t.equals(h, 222);
        t.equals(b, null);
    })();
});


tape("Composing nested object", (t) => {
    const json = '{"hello": 222, "bye": {"hye": null}}';

    const virtual = compose((add, done) => {
        setTimeout(() => {
            for (const c of json) {
                add(c);
            }
    
            done();
        }, 0);    
    });

    t.plan(3);


    return (async () => {
        const h = await virtual.get('hello').value();
        const y = await virtual.get('bye').get('hye').value();
        const b = await virtual.get('bye').value();

        t.equals(h, 222);
        t.equals(y, null);
        t.equals(b.hye, null);
    })();
});

tape("Composing object with array", (t) => {
    const json = '{"hello": 222, "bye": [2, 5]}';

    const virtual = compose((add, done) => {
        setTimeout(() => {
            for (const c of json) {
                add(c);
            }
    
            done();
        }, 0);    
    });

    t.plan(4);

    return (async () => {
        const h = await virtual.get('hello').value();
        const a = await virtual.get('bye').get(0).value();
        const b = await virtual.get('bye').get(1).value();
        const arr = await virtual.get('bye').value();

        t.equals(h, 222);
        t.equals(a, 2);
        t.equals(b, 5);
        t.equals(arr[0], 2);
    })();
});

tape("Composing nested object", (t) => {
    const json = '{"hello": 222, "bye": {"hye": null}}';

    const virtual = compose((add, done) => {
        setTimeout(() => {
            for (const c of json) {
                add(c);
            }
    
            done();
        }, 0);    
    });

    t.plan(3);


    return (async () => {
        const h = await virtual.get('hello').value();
        const y = await virtual.get('bye').get('hye').value();
        const b = await virtual.get('bye').value();

        t.equals(h, 222);
        t.equals(y, null);
        t.equals(b.hye, null);
    })();
});

tape("Objects with strings values", (t) => {
    const json = '{"hello": "222", "bye": [2, "nooo"]}';

    const virtual = compose((add, done) => {
        setTimeout(() => {
            for (const c of json) {

                add(c);
            }
    
            done();
        }, 0);    
    });

    t.plan(3);

    return (async () => {
        const h = await virtual.get('hello').value();
        const a = await virtual.get('bye').get(0).value();
        const b = await virtual.get('bye').get(1).value();

        t.equals(h, "222");
        t.equals(a, 2);
        t.equals(b, "nooo");
    })();
});

tape("Array iteration", (t) => {
    const json = '{"hello": "222", "bye": [2, 6, 77]}';

    const virtual = compose((add, done) => {
        setTimeout(() => {
            for (const c of json) {

                add(c);
            }
    
            done();
        }, 0);    
    });

    t.plan(8);

    return (async () => {
        const arr = [], arrToo = [];

        for await (const val of virtual.get('bye').iterate()) {
            arr.push(val);
        }

        t.equals(arr.length, 3);
        t.equals(arr[0], 2);
        t.equals(arr[1], 6);
        t.equals(arr[2], 77);

        for await(const val of virtual.get('bye').iterate()) {
            arrToo.push(val);
        }

        t.equals(arrToo.length, 3);
        t.equals(arrToo[0], 2);
        t.equals(arrToo[1], 6);
        t.equals(arrToo[2], 77);
    })();
});

tape("Object iteration", (t) => {
    const json = '{"hello": "222", "bye": {"a": 3, "b": 55, "c": 66}}';

    const virtual = compose((add, done) => {
        setTimeout(() => {
            for (const c of json) {

                add(c);
            }
    
            done();
        }, 0);    
    });

    t.plan(7);

    return (async () => {
        const arr = [];

        for await (const val of virtual.get('bye').iterate()) {
            arr.push(...val);
        }

        t.equals(arr.length, 6);
        t.equals(arr[0], 'a');
        t.equals(arr[1], 3);
        t.equals(arr[2], 'b');
        t.equals(arr[3], 55);
        t.equals(arr[4], 'c');
        t.equals(arr[5], 66);
    })();
});

tape("String iteration", (t) => {
    const json = '{"hello": "222", "bye": "goodbye"}';

    const virtual = compose((add, done) => {
        setTimeout(() => {
            for (const c of json) {

                add(c);
            }
    
            done();
        }, 0);
    });

    t.plan(2);

    return (async () => {
        const arr = [];

        for await (const char of virtual.get('bye').iterate()) {
            arr.push(char);
        }

        t.equals(arr.length, 7);
        t.equals(arr.join(''), "goodbye");
    })();
});
