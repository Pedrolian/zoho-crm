// Parse examples
const ParseArray = require('../utility/ParseArray.js');

const test = ParseArray.parse([{ "id": "00T1Q00003vNfrqUAC" },{ "id": "00T1Q00003vO47JUAS" }],  { "id": "ID", "description": "desc" })
  .then(parsed => {
    console.table(parsed);
  });

const test2 = ParseArray.parse([{ "id": "00T1Q00003vNfrqUAC" },{ "id": "00T1Q00003vO47JUAS" }],  { "id": "ID", "description": "desc" }, "-c")
  .then(parsed => {
    console.table(parsed);
  });

async function Parse() {
  const result = await ParseArray.parse([{ "id": "00T1Q00003vNfrqUAC" },{ "id": "00T1Q00003vO47JUAS" }],  { "id": "ID", "description": "desc" });
  console.log(result);
}
Parse();
