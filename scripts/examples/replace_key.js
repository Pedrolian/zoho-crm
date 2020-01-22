// Parse examples
const ReplaceKey = require('../../utility/ReplaceKey.js');

const test = ReplaceKey.replace([{ "id": "00T1Q00003vNfrqUAC" },{ "id": "00T1Q00003vO47JUAS" }],  { "id": "ID", "description": "desc" })
  .then(parsed => {
    console.table(parsed);
  });

const test2 = ReplaceKey.replace([{ "id": "00T1Q00003vNfrqUAC" },{ "id": "00T1Q00003vO47JUAS" }],  { "id": "ID", "description": "desc" }, "-c")
  .then(parsed => {
    console.table(parsed);
  });

async function Parse() {
  const result = await ReplaceKey.replace([{ "id": "00T1Q00003vNfrqUAC" },{ "id": "00T1Q00003vO47JUAS" }],  { "id": "ID", "description": "desc" });
  console.log(result);
}
Parse();
