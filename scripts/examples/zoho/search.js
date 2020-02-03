require('dotenv').config({path: '../../../.env'});

const Logger = require('../../../utility/WinstonLogger.js');

const ZohoClass = require('../../../class/Zoho');
const Zoho = new ZohoClass();

console.time("App");

// Search example
Zoho.Search("ImportacaoTeste", "(Name:equals:$_name)", [{name: "ChamadaA"},{name: "ChamadaZZZ"},{name: "ChamadaZZZ1"},{name: "ChamadaZZZ2"},{name: "ChamadaZZZ3"},{name: "ChamadaZZZ4"}])
.then(data => {

  Logger.info(`Return: ${data.length}`);
  console.timeEnd("App");

})
.catch(error => {
  Logger.error(error);
});
