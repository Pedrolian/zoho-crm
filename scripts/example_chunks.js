// Chunk examples
const ArrayToChunk = require('../utility/ArrayToChunk.js');

const myArray = [{ "foo1": "bar1" }, { "foo1": "bar2" }, { "foo1": "bar3" }, { "foo1": "bar4" }];
const test = ArrayToChunk.make(myArray, 2);

console.table(test);
