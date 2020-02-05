require('dotenv').config({path: '../../../.env'});

const Logger = require('../../../utility/WinstonLogger.js');
Logger.setPath('../../../log');

const ZohoClass = require('../../../class/Zoho');
const Zoho = new ZohoClass();

console.time("App");

// Search example
Zoho.GetRecords("ImportacaoTeste", { "modified_since": "2020-02-03T00:00:00-03:00" } )
.then(data => {

  Logger.info(`Return: ${data.length}`);
  console.timeEnd("App");

})
.catch(error => {
  Logger.error(error);
});
