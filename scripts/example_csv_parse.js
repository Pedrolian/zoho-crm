// CSV examples
const ParseArray = require('../utility/ParseArray.js');
const CsvClass = require('../class/CSV');

const csv = new CsvClass('../data/ImportacaoTeste_Data.csv', { "separator": "," });
csv.ParseFile()
.then(csv_parsed => {
  console.table(csv_parsed);
});

const csv2 = new CsvClass('../data/ImportacaoTeste_Data.csv', { "separator": ",", "whitelist": ["id", "Description"] });
csv2.ParseFile()
.then(csv_parsed => {

  console.table(csv_parsed);

  let myObj = {};
  Object.keys(csv_parsed[0]).map(key => { myObj = { ...myObj, [key]: key } });
  console.log(myObj);

  const test3 = ParseArray.parse(csv_parsed,  { ...myObj, "id": "ID" })
  .then(parsed => {
    console.table(parsed);
  });

  const test4 = ParseArray.parse(csv_parsed,  { "id": "ID" })
  .then(parsed => {
    console.table(parsed);
  });

});
