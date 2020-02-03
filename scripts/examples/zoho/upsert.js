require('dotenv').config({path: '../../../.env'});

const Logger = require('../../../utility/WinstonLogger.js');
const ReplaceKey = require('../../../utility/ReplaceKey.js');
const _ = require('lodash');

const ZohoClass = require('../../../class/Zoho');
const Zoho = new ZohoClass();

console.time("App");

// Upsert example
Zoho.Upsert("ImportacaoTeste", "((Name:starts_with:$_name))", [{name: "ChamadaZZZ", idd: '1'},{name: "ChamadaA", idd: '2'}
,{name: "ChamadaA1", idd: '2'},{name: "ChamadaA21", idd: '2'},{name: "ChamadaA534543", idd: '2'},{name: "ChamadcdhmbgjkxaA", idd: '2'}])
.then(upsert_data => {

  let update_array = [],
      insert_array = [];

  upsert_data.map(row =>
  {

    let tmpMatches = row._matches;
    delete row._matches;

    if(!tmpMatches.length)
    {
      insert_array = _.concat(insert_array, row);
    }
    else
    {

      // Whitelist the keys we want
      tmpMatches = tmpMatches.map( match => _.pick(match, ['id', 'Id1', 'Name', 'Status']) );

      // Replace keys with our values
      tmpMatches = tmpMatches.map(match => {
        match.Name = row.name;
        match.Id1 = row.idd;
        return match;
      });

      // Add matches to update array
      update_array = _.concat(update_array, tmpMatches);
    }

  });

  insert_array = ReplaceKey.exchange(insert_array,{ "name": "Name" });

  Zoho.SendUpsert("ImportacaoTeste", update_array, insert_array)
  .then(response_data => {

    console.log(``);
    Logger.info(`Update Success: ${response_data.update.success.length}`);
    Logger.warn(`Update Error: ${response_data.update.error.length}`);
    console.log(``);
    Logger.info(`Insert Success: ${response_data.insert.success.length}`);
    Logger.warn(`Insert Error: ${response_data.insert.error.length}`);
    console.timeEnd("App");

  })
  .catch(e => {
    console.log(e);
  });

  // Zoho.Update("ImportacaoTeste", update_array)
  // .then(updated_results => {
  //   console.log([updated_results.success.length, updated_results.error.length]);
  // });

  // Zoho.Insert("ImportacaoTeste", insert_array)
  // .then(insert_results => {
  //   console.log([insert_results.success.length, insert_results.error.length]);
  // });

})
.catch(e => {
  console.log(e);
});
