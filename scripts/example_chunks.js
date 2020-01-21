// Chunk examples
const ArrayToChunk = require('../utility/ArrayToChunk.js');

const myArray = [
  { "id": "00T1Q00003vNfrqUAC", "description": "ABC" },
  { "id": "00T1Q00003vO47JUAS", "description": "DEF" },
  { "id": "00T1Q000047cMOxUAM", "description": "GHI" },
  { "id": "00T1Q00003vNrJDUA0", "description": "JKL" }
];
const test = ArrayToChunk.make(myArray, 2);

console.table(test);
