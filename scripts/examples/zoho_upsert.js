require('dotenv').config({path: '../../.env'});

// Zoho examples
const ZohoClass = require('../../class/Zoho');
const Zoho = new ZohoClass();

const GroupBy = require('../../utility/GroupBy.js');
const ReplaceKey = require('../../utility/ReplaceKey.js');

const _ = require('lodash');

let myData = [
  { "record_id": "00T1Q00003vNfrqUAC", "description": "ABC", "Name": "FooBar" },
  { "record_id": "00T1Q00003vO47JUAS", "description": "DEF", "Name": "FooBar" },
  { "record_id": "fakeid", "description": "ZZZ", "Name": "FooBar" }
];

Zoho.Search("ImportacaoTeste", "(Id1:equals:$_record_id)", myData)
.then(search_results => {

  ReplaceKey.replace(search_results,  { "Id1":"Id1", "Name":"Name", "id":"id" })
  .then(parsed => {
    const group_results = GroupBy.group(parsed, "Id1");
    //console.log(group_results);

    // Determine which keys exist and which don't
    //let update_results = _.filter(myData, function(row) { return group_results.hasOwnProperty(row.id); });
    //const insert_results = _.filter(myData, function(row) { return !group_results.hasOwnProperty(row.id); });

    let update_results = [], insert_results = [];
    myData.map(row => {
      if(group_results.hasOwnProperty(row.record_id))
        update_results = _.concat(update_results, group_results[row.record_id].map(search_row => Object.assign( search_row, row)));
      else
        insert_results = _.concat(insert_results, row);
    });

    // Remove extra columns
    update_results = update_results.map(row => _.pick(row, ["id", "Name","description","record_id"]));
    update_results = ReplaceKey.exchange(update_results, {"id":"id", "Name":"Name", "description": "Description", "record_id":"Id1"});

    insert_results = insert_results.map(row => _.pick(row, ["description","record_id","Name"]));
    insert_results = ReplaceKey.exchange(insert_results, {"description": "Description", "record_id":"Id1", "Name":"Name"});

    console.log(`-----`);
    console.table(update_results);
    console.log(`-----`);
    console.table(insert_results);
    console.log(`-----`);

    console.log(`Updating ${update_results.length} records.`);
    Zoho.Update("ImportacaoTeste", update_results)
    .then(() => {

      console.log(`All updates finished.`);
      console.log(`Inserting ${insert_results.length} records.`);
      Zoho.Insert("ImportacaoTeste", insert_results)
      .then(() => {
        console.log(`All inserts finished.`);
      });

    });

  });

});
