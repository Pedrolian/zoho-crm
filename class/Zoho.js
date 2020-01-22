require('dotenv').config();
const ZCRMRestClient = require('zcrmsdk');

const DataReplace = require('../utility/DataReplaceString.js');
const RemoveDiacritics = require('../utility/RemoveDiactric.js');
const ReplaceKey = require('../utility/ReplaceKey.js');

module.exports = class Zoho {

  constructor() {
    this.RemoveDiacritics = RemoveDiacritics.replace;
    this.DataReplace = DataReplace.replace;
    this.ReplaceKey = ReplaceKey.replace;
  }

  /*
  Search a module
  */
  SearchFromArray(module, data, criteria, cb)
  {
    // Create search obj
    let search_array = [];
    data.map(row => {
      search_array.push(this.DataReplace(row, criteria));
    });

    //
    return new Promise((resolve, reject) => {
      this.Search(module, `(${search_array.join("OR")})`)
      .then(search_results => {
        resolve(search_results);
      });
    });
  }

  Search(module, criteria)
  {
    console.log(`Search -- Module: [${module}] Criteria: [${criteria}]`);
    return new Promise((resolve, reject) => {
      this._search(module, criteria, 1, 200, [], (results) => {
        resolve(results);
      });
    });
  }

  _search(module, criteria, page, per_page, results, cb)
  {
    try
    {
      ZCRMRestClient.API.MODULES.search({ module: module, params: { criteria: criteria, page: page, per_page: 200} })
      .then((response) =>
      {
        try {
          const response_data = JSON.parse(response.body);
          results = results.concat(response_data.data);
          console.log(`Search -- Module: [${module}] Response: ${response_data.data.length} - Total: ${results.length}`);
          if(response_data.info.more_records)
            return this._search(module, criteria, page + 1, per_page, results, cb);
          else
            return cb(results);
        }
        catch (e) {
          return cb([]);
        }
      });
    } catch (e) {
      return cb(results)
    }
  }


}
