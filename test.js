
import {Lexer, compose} from "./lib/index"
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

    t.plan(2);


    const virtual = compose((add, done) => {
        setTimeout(() => {
            for (const c of json) {
                add(c);
            }
    
            done();
        }, 0);    
    });

    return (async () => {
        const h = await virtual.get('hello').value();
        const b = await virtual.get('bye').value();

        t.equals(h, 222);
        t.equals(b, null);
    })();
});