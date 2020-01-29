require('dotenv').config();
const ZCRMRestClient = require('zcrmsdk');

const _ = require('lodash');

const DataReplace = require('../utility/DataReplaceString.js');
const RemoveDiacritics = require('../utility/RemoveDiactric.js');
const ReplaceKey = require('../utility/ReplaceKey.js');
const Logger = require('../utility/WinstonLogger.js');

module.exports = class Zoho {

  constructor() {
    this.ZCRMRestClient = ZCRMRestClient;
    this.RemoveDiacritics = RemoveDiacritics.replace;
    this.DataReplace = DataReplace.replace;
    this.ReplaceKey = ReplaceKey.exchange;
  }

  /*
  Search a module
  */
  Search(module, criteria, data)
  {

    data = data || false;
    let search_criteria = criteria;

    if(data)
    {
      // Create search obj
      let search_array = [];
      data.map(row => {
        search_array.push(this.DataReplace(row, criteria));
      });
      search_criteria = `(${search_array.join("OR")})`;
    }

    Logger.debug(`Search -- Module: [${module}] Criteria: [${search_criteria}]`);
    return new Promise((resolve, reject) => {
      this._search(module, search_criteria, 1, 200, [], (results) => {
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
          Logger.debug(`Search -- Module: [${module}] Response: ${response_data.data.length} - Total: ${results.length}`);
          if(response_data.info.more_records)
            return this._search(module, criteria, page + 1, per_page, results, cb);
          else
            return cb(results);
        }
        catch (e) {
          if(response.indexOf('"message":"no data"') < 0)
          {
            Logger.error(`------Search Error:------`);
            Logger.error(JSON.stringify(criteria));
            Logger.error(JSON.stringify(response));
            Logger.error(`------Search Error------`);
          }
          else
          {
            Logger.warn(`------Search Warn:------`);
            Logger.warn(JSON.stringify(criteria));
            Logger.warn(JSON.stringify(response));
            Logger.warn(`------Search Warn------`);
          }
          return cb([]);
        }
      });
    } catch (e) {
      return cb(results)
    }
  }

  /**
  * Update a module
  **/
  Update(module, data)
  {
    data = Array.isArray(data) ? data : [data];
    return new Promise((resolve, reject) => {
      try {

        if(!data.length)
          resolve();
        else
        {
          const chunks = _.chunk(data, 100);
          this._update(module, chunks, tmp => {
            resolve();
          });
        }

      } catch (e) {
        resolve();
      }
    });
  }

  _update(module, data, cb)
  {
    const tmpData = data[0];
    data.shift();
    try
    {
      ZCRMRestClient.API.MODULES.put({ module: module, body: { data: tmpData } })
      .then((response) =>
      {
        try
        {

          let res_counter = 0;
          const response_data = JSON.parse(response.body).data;
          response_data.map(res =>
          {

            if(res.status != "success")
            {
              Logger.warn(`------Update Warn:------`);
              Logger.warn(JSON.stringify(tmpData[res_counter]));
              Logger.warn(JSON.stringify(res));
              Logger.warn(`------Update Warn------`);
            }
            else
              Logger.verbose(`Updated -- Module: [${module}] ID: [${res.details.id}]`);

            res_counter++;

          });

          if(data.length)
            return this._update(module, data, cb);
          else
            return cb();

        }
        catch (e)
        {
          Logger.error(`------Update Error:------`);
          Logger.error(JSON.stringify(response.body));
          Logger.error(`------Update Error------`);
          if(data.length)
            return this._update(module, data, cb);
          else
            return cb();
        }
      });
    } catch (e) {
      //
      if(data.length)
        return this._update(module, data, cb);
      else
        return cb();
    }
  }

  /**
  * Insert to module
  **/
  Insert(module, data)
  {
    data = Array.isArray(data) ? data : [data];
    return new Promise((resolve, reject) => {
      try {
        if(!data.length)
          resolve();
        else
        {
          const chunks = _.chunk(data, 100);
          this._insert(module, chunks, tmp => {
            resolve();
          });
        }
      } catch (e) {
        resolve();
      }
    });
  }

  _insert(module, data, cb)
  {
    const tmpData = data[0];
    data.shift();
    try
    {
      ZCRMRestClient.API.MODULES.post({ module: module, body: { data: tmpData } })
      .then((response) =>
      {
        try {
          let res_counter = 0;
          const response_data = JSON.parse(response.body).data;
          response_data.map(res =>
          {

            if(res.status != "success")
            {
              Logger.warn(`------Insert Warn:------`);
              Logger.warn(tmpData[res_counter]);
              Logger.warn(res);
              Logger.warn(`------Insert Warn------`);
            }
            else
              Logger.verbose(`Insert -- Module: [${module}] ID: [${res.details.id}]`);
            res_counter++;

          });

          if(data.length)
            return this._insert(module, data, cb);
          else
            return cb();

        } catch (e) {
          Logger.error(`------Insert Error:------`);
          Logger.error(JSON.stringify(response.body));
          Logger.error(`------Insert Error------`);
          if(data.length)
            return this._insert(module, data, cb);
          else
            return cb();
        }
      });
    } catch (e) {
      if(data.length)
        return this._insert(module, data, cb);
      else
        return cb();
    }
  }

}
