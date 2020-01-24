require('dotenv').config({path: '../../.env'});

// Zoho examples
const ZohoClass = require('../../class/Zoho');

const Zoho = new ZohoClass();

Zoho.Search("ImportacaoTeste", "(Id1:equals:00T1Q00003vNfrqUAC)")
.then(search_results => {
  console.log(search_results[0]);
});
