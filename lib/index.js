
import Lexer from "./lexer"
import Composer from "./composer"

export {default as Lexer} from "./lexer"

export const compose = (fn) => {
    const add = (c) => {
        lexer.push(c);
    }

    const done = () => {
        lexer._done();
    }

    const error = (err) => {
        lexer._error(err.message);
    }

    const lexer = new Lexer();
    const composer = new Composer();

    lexer.onToken((token) => {
        composer.push(token);
    });

    lexer.onDone(() => {
        // TODO: ^
    });

    lexer.onError((err) => {
       throw err; 
    });

    fn(add, done, error);

    return composer.virtual;
}