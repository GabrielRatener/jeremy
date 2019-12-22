
import {Lexer} from "./lib/index"

const lexer = new Lexer();

const json = '{"hello": "nonono", "baba": null, "gigig": 123123, "boob": false}';

lexer.onToken((token) => {
    console.log(`${token.type} ${token.content}`);
});

for (const c of json) {
    lexer.push(c);
}
