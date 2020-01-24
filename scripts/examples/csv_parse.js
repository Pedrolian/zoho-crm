// CSV examples
const ReplaceKey = require('../../utility/ReplaceKey.js');
const CsvClass = require('../../class/CSV');

const csv2 = new CsvClass('../../data/ImportacaoTeste_Data.csv', { "separator": ",", "whitelist": ["id", "Description"] });
csv2.ParseFile()
.then(csv_parsed => {

  console.table(csv_parsed);

  const test1 = ReplaceKey.exchange(csv_parsed,  { "id": "ID" });
  console.table(test1);

  const test2 = ReplaceKey.exchange(csv_parsed,  { "id": "ID" }, "-new")
  console.table(test2);

  const test3 = ReplaceKey.exchange(csv_parsed,  { "id": "ID", "foo": "bar" })
  console.table(test3);

  const test4 = ReplaceKey.exchange(csv_parsed,  { "id": "ID", "foo": "bar" }, ["-check"])
  console.table(test4);

});
