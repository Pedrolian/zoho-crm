// CSV Lodash examples
const _ = require('lodash');
const CsvClass = require('../../../class/CSV');

const csv = new CsvClass('../../../data/Example_Users.csv', { "separator": "," });
csv.ParseFile()
.then(csv_parsed => {

  // Convert data
  csv_parsed.map(row => {
    row.active = row.active === 'true' ? true : false;
    row.age = Number(row.age);
  })
  console.table(csv_parsed);

  // Filter to actives only
  console.table( _.filter(csv_parsed, { 'active': true }) );

  // Custom function -- Users with last name Simpsons
  console.table( _.filter(csv_parsed, function(row) { return row.last_name == 'Simpsons'; }) );

  // Custom function -- Users with last name Simpsons && are active
  console.table( _.filter(csv_parsed, function(row) { return row.last_name == 'Simpsons' && row.active; }) );

});
