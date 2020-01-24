require('dotenv').config({path: '../../.env'});

// Zoho examples
const ZohoClass = require('../../class/Zoho');
const Zoho = new ZohoClass();

const GroupBy = require('../../utility/GroupBy.js');
const ReplaceKey = require('../../utility/ReplaceKey.js');

let myData = [
  { "id": "00T1Q00003vNfrqUAC", "description": "ABC" },
  { "id": "00T1Q00003vO47JUAS", "description": "DEF" },
  { "id": "fakeid", "description": "ZZZ" }
];

Zoho.Search("ImportacaoTeste", "(Id1:equals:$_id)", myData)
.then(search_results => {

  const parsed = ReplaceKey.exchange(search_results, { "Id1":"Id1", "Name":"Name" }, ["new"]);
  const group_results = GroupBy.group(parsed, "Id1");

  // Group the two arrays together
  myData.map(row => {
    row.Product_Details = (group_results.hasOwnProperty(row.id) ? group_results[row.id] : []);
  });

  console.log(myData);

});
