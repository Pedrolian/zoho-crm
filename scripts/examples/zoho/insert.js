require('dotenv').config({path: '../../../.env'});

const Logger = require('../../../utility/WinstonLogger.js');

const ZohoClass = require('../../../class/Zoho');
const Zoho = new ZohoClass();

console.time("App");

// Insert example
Zoho.Insert("ImportacaoTeste", [{Name: "Chamadaa"},{name: "ChamadaZZZa"},{Name: "ChamadaZZZ1a"},{Name: "ChamadaZZZ2a"},{Name: "ChamadaZZZ3a"},{Name: "ChamadaZZZ4a"}])
.then((response_data) => {

  Logger.info(`Success: ${response_data.success.length}`);
  Logger.warn(`Error: ${response_data.error.length}`);
  console.timeEnd("App");

})
.catch(e => {
  console.log(e);
});
