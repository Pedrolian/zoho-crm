require('dotenv').config();

// Zoho examples
const ZohoClass = require('../class/Zoho');

const Zoho = new ZohoClass();

Zoho.Search("ImportacaoTeste", "(Id1:equals:00T1Q00003vNfrqUAC)", 1, 2)
.then(search_results => {
  console.log(search_results[0]);
});
