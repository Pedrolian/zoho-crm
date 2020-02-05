require('dotenv').config({path: '../../../.env'});

const Logger = require('../../../utility/WinstonLogger.js');
Logger.setPath('../../../log');

const ZohoClass = require('../../../class/Zoho');
const Zoho = new ZohoClass();

console.time("App");

// Update
Zoho.Update("ImportacaoTeste", [{ id: '116652000037104069', Name: "Update Test" }, { id: '116652000037330655', Name: "Update Test" }, { id: '116652000037097073', Name: "Update Test" },
{ id: '116652000037308942', Name: "Update Test" }, { id: '116652000037104056', Name: "Update Test" }, { id: '116652000037110101', Name: "Update Test" }])
.then((response_data) => {

  Logger.info(`Success: ${response_data.success.length}`);
  Logger.warn(`Error: ${response_data.error.length}`);
  console.timeEnd("App");

})
.catch(e => {
  console.log(e);
});
