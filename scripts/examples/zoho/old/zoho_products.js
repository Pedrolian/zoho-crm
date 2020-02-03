require('dotenv').config({path: '../../.env'});

// Zoho examples
const ZohoClass = require('../../class/Zoho');
const Zoho = new ZohoClass();

const ReplaceKey = require('../../utility/ReplaceKey.js');
const GroupBy = require('../../utility/GroupBy.js');

const CsvClass = require('../../class/CSV');

const _ = require('lodash');

const csv = new CsvClass('../../data/ImportacaoTeste_Data.csv', { "separator": "," });
csv.ParseFile().then(data => {

  data = ReplaceKey.exchange(data, { "id": "Id1" });
  console.table(data);

  const csv_products = new CsvClass('../../data/ImportacaoTeste_Produtos.csv', { "separator": "," });
  csv_products.ParseFile().then(data_products => {

    // Rename csv_products columns to fit Zoho logic names
    data_products = ReplaceKey.exchange(data_products, { "id": "Id1", "product_id": "produto", "qty": "quantidade", "price": "pre_o" });
    //console.table(data_products);

    // Group products into parent Id1
    const grouped_products = GroupBy.group(data_products, "Id1");
    //console.table(grouped_products["00T1Q00003vO47JUAS"]);

    // Attach products to each parent Id1
    data = data.map(tmp => {
      return { ...tmp, "Product_Details": grouped_products.hasOwnProperty(tmp.Id1) ? grouped_products[tmp.Id1] : [] }
    });
    //console.table(data[0]);

    // Filter - Remove from data with empty Product_Details
    data = _.filter(data, function(row) { return row.Product_Details.length > 0; });

    // Search zoho for entries with criteria with Id1
    Zoho.Search("ImportacaoTeste", "(Id1:equals:$_Id1)", data)
    .then(search_results => {

      // Remove excess keys
      search_results = search_results.map(row => {
        return _.pick(row, ["id","Id1","Name"]);
      });
      //console.table(search_results);

      // Group searchs by primary key
      const grouped_search = GroupBy.group(search_results, "Id1");
      //console.log(grouped_search);

      let update_query = [];
      data.map(row => {
        if(grouped_search.hasOwnProperty(row.Id1))
        {
          grouped_search[row.Id1].map(search_row => {
            update_query.push(Object.assign(search_row, row));
          });
        }
      });

      console.log(`Updating ${update_query.length} records.`);
      Zoho.Update("ImportacaoTeste", update_query)
      .then(() => {
        console.log(`All updates finished.`);
      });

    });

  });

});
