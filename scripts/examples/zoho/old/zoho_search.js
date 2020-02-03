require('dotenv').config({path: '../../../../.env'});

// Zoho examples
const ZohoClass = require('../../../../class/Old_Zoho');
const Zoho = new ZohoClass();

logger = require('../../../../utility/WinstonLogger.js');

Zoho.Search("ImportacaoTeste", "(Id1:equals:00T1Q00003vNfrqUAC)")
.then(search_results => {
  logger.silly(`Resultados: ${search_results.length}`)
  console.log(search_results[0]);
});
