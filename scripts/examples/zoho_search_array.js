require('dotenv').config();

// Zoho examples
const ZohoClass = require('../../class/Zoho');
const Zoho = new ZohoClass();

const GroupBy = require('../../utility/GroupBy.js');
const ReplaceKey = require('../../utility/ReplaceKey.js');

let myData = [{ "id": "00T1Q00003vNfrqUAC", "description": "ABC" }, { "id": "00T1Q00003vO47JUAS", "description": "DEF" }];

Zoho.SearchFromArray("ImportacaoTeste", myData, "(Id1:equals:$_id)")
.then(search_results => {

  ReplaceKey.replace(search_results,  { "Id1":"Id1", "Name":"Name" })
  .then(parsed => {

    const group_results = GroupBy.group(parsed, "Id1");

    // Group the two arrays together
    myData.map(row => {
      row.Product_Details = (group_results.hasOwnProperty(row.id) ? group_results[row.id] : []);
    });

    console.log(myData[0]);

  });

});
