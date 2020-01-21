require('dotenv').config();

// Zoho examples
const ZohoClass = require('../class/Zoho');

const Zoho = new ZohoClass();

Zoho.SearchFromArray("ImportacaoTeste", [{ "foo1": "00T1Q00003vNfrqUAC" }, { "foo1": "00T1Q00003vO47JUAS" }], "(Id1:equals:$_foo1)")
.then(search_results => {
  console.log(search_results);
});
