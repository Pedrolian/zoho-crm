// lodash examples
const _ = require('lodash');

let myArray = [
  { "id": "00T1Q00003vNfrqUAC", "description": "ABC" },
  { "id": "00T1Q00003vO47JUAS", "description": "DEF" },
  { "id": "00T1Q000047cMOxUAM", "description": "GHI" },
  { "id": "00T1Q00003vNrJDUA0", "description": "JKL" }
];

console.table(myArray);

// Whitelist keys
myArray = myArray.map(row => {
  return _.pick(row, ['id']);
});

console.table(myArray);
