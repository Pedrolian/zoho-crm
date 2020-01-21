// Parse examples
const ParseArray = require('../utility/ParseArray.js');

const test = ParseArray.parse([{ "foo1": "bar1" }, { "foo1": "bar2" }],  { "foo1": "foo", "a": "b" })
  .then(parsed => {
    console.table(parsed);
  });

const test2 = ParseArray.parse([{ "foo1": "bar1" }, { "foo1": "bar2" }],  { "foo1": "foo", "a": "b" }, "-sc")
  .then(parsed => {
    console.table(parsed);
  });

async function Parse() {
  const result = await ParseArray.parse([{ "foo1": "bar1" }, { "foo1": "bar2" }],  { "foo1": "foo", "a": "b" });
  console.log(result);
}
Parse();
