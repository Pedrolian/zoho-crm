require('dotenv').config();

// Zoho examples
const ZohoClass = require('../class/Zoho');

const Zoho = new ZohoClass();

/*
Zoho.ParseArray([{ "foo1": "bar1" }, { "foo1": "bar2" }],  { "foo1": "foo", "a": "b" })
  .then(parsed => {
    console.table(parsed);
  });
*/

/*
Zoho.Search("ImportacaoTeste", "(Id1:equals:00T1Q00003vNfrqUAC)", 1, 2)
.then(search_results => {
  console.log(search_results[0]);
});
*/

Zoho.SearchFromArray("ImportacaoTeste", [{ "foo1": "00T1Q00003vNfrqUAC" }, { "foo1": "00T1Q00003vO47JUAS" }], "(Id1:equals:$_foo1)")
.then(search_results => {
  console.log(search_results);
});
