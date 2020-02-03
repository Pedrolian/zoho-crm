// Chunk examples
const GroupBy = require('../../../utility/GroupBy.js');

const myArray = [
  { "rid": "00T1Q00003vNfrqUAC", "product": "ABC", "price": 10.25 },
  { "rid": "00T1Q00003vNfrqUAC", "product": "DEF", "price": 25.50 },
  { "rid": "00T1Q00003vO47JUAS", "product": "GHI", "price": 5.50 },
  { "rid": "00T1Q00003vO47JUAS", "product": "JKL", "price": 99 },
  { "rid": "00T1Q00003vO47JUAS", "product": "MNO", "price": 500 },
];
const test = GroupBy.group(myArray, "rid");

console.log(test);
