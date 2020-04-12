
# Basic Idea

Start reading your JSON before it's done loading.

## Suppose

Suppose you have a JSON file with 4000-element array. Instead of loading the whole string and then calling `JSON.parse`, why not start reading the array elements as they come in.

## Usage

```js

import {compose} from "jeremy"

const getChunkedXHR = (resource, api) => {
    const xhr = new XMLHttpRequest();

    let index = 0;

    xhr.onprogress = () => {
        if (xhr.responseText.length > index) {
            const chunk = xhr.responseText.slice(index);

            index += chunk;

            api.data(chunk);
        } else {
            api.done();
        }
    }

    xhr.open('GET', resource);
    xhr.send();
}

const virtual = compose((add, done) => {
    
    // {
    //     orders: [
    //         {
    //             name: <string (e.g. Bertha)>
    //             items: [<string (e.g. fries)>, ...]
    //         }
    //         ...
    //     ]
    // }

    const url = "my-large-orders-file.json";

    getChunkedXHR(url, {
        data(chunk) {
            for (let i = 0; i < chunk.length; i++) {
                add(chunk[i]);
            }
        },
        done() {
            done();
        }
    });
});

(async() => {

    // wait for virtual list to load
    const virtualList = virtual.get('orders');
    const virtualFirstOrder = virtualList.get(0);

    // wait for full object to be loaded and parsed...
    const actualFirstOrder = await virtualFirstOrder.value()

    let i = 0;

    // log first order name
    console.log(actualFirstOrder.name);

    // async iterate through orders...
    for await (const {name, items} of virtualFirstOrder.iterate()) {
        i++;

        console.log(`order ${i} for ${name}:\n${items.join('\n')}`);
    }
})();

```