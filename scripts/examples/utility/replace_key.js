// Parse examples
const ReplaceKey = require('../../utility/ReplaceKey.js');

const test = ReplaceKey.exchange([{ "id": "00T1Q00003vNfrqUAC" },{ "id": "00T1Q00003vO47JUAS" }],  { "id": "ID", "description": "desc" }, "new");
console.table(test);

const test2 = ReplaceKey.exchange([{ "id": "00T1Q00003vNfrqUAC" },{ "id": "00T1Q00003vO47JUAS" }],  { "id": "ID", "description": "desc" }, ["new","check"]);
console.table(test2);
