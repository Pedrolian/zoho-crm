const ZCRMRestClient = require('zcrmsdk');

const DataReplace = require('../utility/DataReplaceString.js');
const Logger = require('../utility/WinstonLogger.js');
const GroupBy = require('../utility/GroupBy.js');
const ToOptions = require('../utility/ToOptions.js');

const _ = require('lodash');

class ZohoClass
{

  constructor()
  {
    this.PoolSize = 20;
  }

  Log(level, message)
  {
    message = Array.isArray(message) ? message : [message];
    message.map(msg => {
      Logger.log(level, typeof msg === 'object' && msg !== null ? JSON.stringify(msg) : msg);
    });
  }

  /***
  * * Insert to a module
  * @param module (String)
  * @param data (Array)
  * @param options (Array || Object)
  *
  * @return (Promise)
  */
  Insert(module, data, options)
  {
    options = ToOptions.parse(options);
    return new Promise((resolve, reject) =>
    {
      //const poolSize = this.PoolSize < data.length ? this.PoolSize : data.length;
      const poolSize = options.hasOwnProperty("pool_size") && options.pool_size < this.PoolSize ? options.pool_size : this.PoolSize < data.length ? this.PoolSize : data.length;
      let data_chunks = _.chunk(data, Math.round(data.length / poolSize));
      if(data_chunks.length > poolSize)
      {
        const data_chunk_last = data_chunks.pop();
        data_chunks[data_chunks.length-1] = _.concat(data_chunks[data_chunks.length-1], data_chunk_last);
      }

      this.Log('debug',`Chunk size: ${data_chunks.length} (Avg: ${Math.round(data.length / poolSize)}) for ${poolSize} pool size.`);

      let promiseArrays = [];
      let response_data = { success: [], error: [] };
      for(let index = 0; index < data_chunks.length; index++)
      {
        promiseArrays.push(new Promise((resolve, reject) =>
        {
          this._InsertPoolChunk(module, data_chunks[index])
          .then((response_results) => {
            response_data = { success: _.concat(response_data.success, response_results.success), error: _.concat(response_data.error, response_results.error) };
            return resolve();
          })
          .catch(e =>
          {
            if(options.hasOwnProperty("surpress") && options.surpress === false || data_chunks.length === 1)
              return reject(e);
            return resolve();
          });
        }));
      }

      Promise.all(promiseArrays)
      .then(values => {
        return resolve(response_data);
      })
      .catch(e => {
        return reject(e);
      });

    });
  }

  /***
  * ! Private module, use Insert
  */
  _InsertPoolChunk(module, data, data_index, response_results)
  {
    data_index = data_index || 0;
    response_results = response_results || { success: [], error: [] };
    const data_chunks = _.chunk(data, 100);

    return new Promise((resolve, reject) =>
    {
      this._Insert(module, data_chunks[data_index])
      .then((response_data) =>
      {
        response_results = { success: _.concat(response_results.success, response_data.success), error: _.concat(response_results.error, response_data.error) };
        if(data_chunks.length > data_index+1)
          return resolve(this._InsertPoolChunk(module, data, data_index+1, response_results));
        else
        {
          return resolve(response_results);
        }
      })
      .catch(error => {
        return reject(error);
      })
    });

  }

  /***
  * ! Private module, use Insert
  */
  _Insert(module, data)
  {
    return new Promise((resolve, reject) =>
    {

      this.Log('verbose',`Insert -- Module: [${module}] Data: ${data.length}`);
      if(this.PoolSize <= 0)
      {
        this.Log('error', [`------Insert Pool Error:------`,`Status code: 429`,`Too many requests fired in concurrent than the allowed limit.`,`------Insert Pool Error------`]);
        return reject({ statusCode: 429, code: 'TOO_MANY_REQUESTS', message: 'Many requests fired in concurrent than the allowed limit.', details: null });
      }

      this.PoolSize--;
      ZCRMRestClient.API.MODULES.post({ module: module, body: { data: data } })
      .then((response) =>
      {
        this.PoolSize++;
        let successData = [], errorData = [];
        try
        {
          let res_counter = 0;
          const response_data = JSON.parse(response.body).data;
          response_data.map(res =>
          {
            if(res.status != "success")
            {
              errorData.push(data[res_counter]);
              this.Log('warn', [`------Insert Warn:------`,data[res_counter],res,`------Insert Warn------`]);
            }
            else
            {
              successData.push(data[res_counter]);
              this.Log('debug',`Inserted -- Module: [${module}] ID: [${res.details.id}]`);
            }
            res_counter++;
          });
        }
        catch(e)
        {
          this.Log('error', [`------Insert Error:------`,response.body,`------Insert Error------`]);
        }
        finally
        {
          return resolve({ success: successData, error: errorData });
        }

      });

    });
  }

  Update(module, data, options)
  {
    options = ToOptions.parse(options);
    return new Promise((resolve, reject) =>
    {
      let response_data = { success: [], error: [] };

      // Remove from data any object that doesn't have id.
      response_data.error = data.filter(row => {
        if(!row.hasOwnProperty('id'))
        {
          this.Log('warn', [`------Update Error:------`,`Missing key "id"`,row,`------Update Error------`])
          return true;
        }
      });
      data = data.filter(row => row.hasOwnProperty('id'));

      if(data.length < 1)
        return reject({ error: 400, statusCode: 400, message: "Nothing to update."});

      //const poolSize = this.PoolSize < data.length ? this.PoolSize : data.length;
      const poolSize = options.hasOwnProperty("pool_size") && options.pool_size < this.PoolSize ? options.pool_size : this.PoolSize < data.length ? this.PoolSize : data.length;
      let data_chunks = _.chunk(data, Math.round(data.length / poolSize));
      if(data_chunks.length > poolSize)
      {
        const data_chunk_last = data_chunks.pop();
        data_chunks[data_chunks.length-1] = _.concat(data_chunks[data_chunks.length-1], data_chunk_last);
      }

      this.Log('debug',`Chunk size: ${data_chunks.length} (Avg: ${Math.round(data.length / poolSize)}) for ${poolSize} pool size.`);

      let promiseArrays = [];
      for(let index = 0; index < data_chunks.length; index++)
      {
        promiseArrays.push(new Promise((resolve, reject) =>
        {
            this._UpdatePoolChunk(module, data_chunks[index])
            .then((response_results) => {
            response_data = { success: _.concat(response_data.success, response_results.success), error: _.concat(response_data.error, response_results.error) };
            return resolve();
            })
            .catch(e =>
            {
            if(options.hasOwnProperty("surpress") && options.surpress === false || data_chunks.length === 1)
                return reject(e);
            return resolve();
            });
        }));
      }

      Promise.all(promiseArrays)
      .then(values => {
        return resolve(response_data);
      })
      .catch(e => {
        return reject(e);
      });
    });
  }

  /***
   * ! Private module, use Update
   */
  _UpdatePoolChunk(module, data, data_index, response_results)
  {
    data_index = data_index || 0;
    response_results = response_results || { success: [], error: [] };
    const data_chunks = _.chunk(data, 100);

    return new Promise((resolve, reject) =>
    {
        this._Update(module, data_chunks[data_index])
        .then((response_data) =>
        {
        response_results = { success: _.concat(response_results.success, response_data.success), error: _.concat(response_results.error, response_data.error) };
        if(data_chunks.length > data_index+1)
            return resolve(this._UpdatePoolChunk(module, data, data_index+1, response_results));
        else
        {
            return resolve(response_results);
        }
        })
        .catch(error => {
        return reject(error);
        })
    });
  }

  /***
   * ! Private module, use Update
   */
  _Update(module, data)
  {
    return new Promise((resolve, reject) =>
    {

        this.Log('verbose',`Update -- Module: [${module}] Data: ${data.length}`);
        if(this.PoolSize <= 0)
        {
            this.Log('error', [`------Update Pool Error:------`,`Status code: 429`,`Too many requests fired in concurrent than the allowed limit.`,`------Update Pool Error------`]);
            return reject({ statusCode: 429, code: 'TOO_MANY_REQUESTS', message: 'Many requests fired in concurrent than the allowed limit.', details: null });
        }

        this.PoolSize--;
        ZCRMRestClient.API.MODULES.put({ module: module, body: { data: data } })
        .then((response) =>
        {
            this.PoolSize++;
            let successData = [], errorData = [];
            try
            {
                let res_counter = 0;
                const response_data = JSON.parse(response.body).data;
                response_data.map(res =>
                {
                if(res.status != "success")
                {
                    errorData.push(data[res_counter]);
                    this.Log('warn', [`------Update Warn:------`,data[res_counter],res,`------Update Warn------`]);
                }
                else
                {
                    successData.push(data[res_counter]);
                    this.Log('debug',`Updated -- Module: [${module}] ID: [${res.details.id}]`);
                }
                res_counter++;
                });
            }
            catch(e)
            {
                this.Log('error', [`------Update Error:------`,response.body,`------Update Error------`]);
            }
            finally
            {
                return resolve({ success: successData, error: errorData });
            }

        });

    });
  }

  /***
  *  * Search a specific module in Zoho
  *  @param module (String) - Module API name
  *  @param criteria (String) - Criteria to search
  *  @param data (Array) - Array of objects to fill criteria with
  *  @param options (Array||Object) - Send options - array will convert it to an object with null values
  *  @param per_page (Number) - How many results should return per page
  *  @param page (Number) - Start page of search
  *  @param search_results (Array) - pass in array of objects to concat results to
  *
  *  @returns (Promise)
  */
  Search(module, criteria, data, options, per_page, page, search_results)
  {
    options = ToOptions.parse(options);

    return new Promise((resolve, reject) =>
    {

      try
      {
        const search_criteria_matches = criteria.match(/\(([A-Z0-9_.\-:@$ ]+):([A-Z0-9_.\-:@$ ]+):([A-Z0-9_.\-:@$ ]+)\)/gim);
        if(search_criteria_matches.length > 10)
          return reject({ statusCode: 400, code: 'CRITERIA_LIMIT_EXCEEDED', message: 'no of criterium that can be given exceed the limit 10', details: null });
      }
      catch (e) {
        return reject(`No criteria provided.`);
      }

      if(data)
      {
        // Split incoming data array evenly between the pool size.
        const poolSize = this.PoolSize < data.length ? this.PoolSize : data.length;
        let data_chunks = _.chunk(data, Math.round(data.length / poolSize));
        if(data_chunks.length > poolSize)
        {
          const data_chunk_last = data_chunks.pop();
          data_chunks[data_chunks.length-1] = _.concat(data_chunks[data_chunks.length-1], data_chunk_last);
        }

        this.Log('debug',`Chunk size: ${data_chunks.length} (Avg: ${Math.round(data.length / poolSize)}) for ${poolSize} pool size.`);

        let promiseArrays = [];
        let promiseResults = [];
        for(let index = 0; index < data_chunks.length; index++)
        {
          promiseArrays.push(new Promise((resolve, reject) =>
          {
            this._SearchPoolChunk(module, criteria, data_chunks[index], per_page, page, search_results)
            .then(search_results =>
            {
              promiseResults = _.concat(promiseResults, search_results);
              return resolve();
            })
            .catch(e =>
            {
              if(options.hasOwnProperty("surpress") && options.surpress === false || data_chunks.length === 1)
                return reject(e);
              return resolve();
            });
          }));
        }

        Promise.all(promiseArrays)
        .then(values =>
        {
          if(options.hasOwnProperty("unique") && (options.unique === undefined || options.unique === true) )
          {
            const grouppedResults = GroupBy.group(promiseResults, "id");
            let reducedResults = [];
            Object.keys(grouppedResults).map(key => reducedResults.push(grouppedResults[key][0]));
            return resolve(reducedResults);
          }
          else
            return resolve(promiseResults);
        })
        .catch(e => {
          return reject(e);
        });
      }
      else
      {
        // No data array, make one individual search
        this._Search(module, criteria, data, per_page, page)
        .then(search_data => {
          return resolve(search_data);
        })
        .catch(e => {
          if(options.hasOwnProperty("surpress") && options.surpress === false || data_chunks.length === 1)
            return reject(e);
          return resolve();
        })
      }

    })

  }

  /***
  * ! Private module, use Search
  */
  _SearchPoolChunk(module, criteria, data, per_page, page, search_results, data_index)
  {
    data_index = data_index || 0;
    search_results = search_results || [];

    const search_criteria_matches = criteria.match(/\(([A-Z0-9_.\-:@$ ]+):([A-Z0-9_.\-:@$ ]+):([A-Z0-9_.\-:@$ ]+)\)/gim);

    data = Array.isArray(data) ? data : [data];
    const chunk_size = data.length * search_criteria_matches.length < 10 ? 10 : (10 /search_criteria_matches.length) >> 0 ;

    const data_chunks = _.chunk(data, chunk_size);
    //const data_chunks = data.length > 10 ? _.chunk(data, 10) : [data];
    //console.log(data.length, search_criteria_matches.length, data.length * search_criteria_matches.length, (data.length * search_criteria_matches.length / data.length) >> 0 );

    return new Promise((resolve, reject) =>
    {
      this._Search(module, criteria, data_chunks[data_index], per_page, page, search_results)
      .then(search_data =>
      {
        search_results = search_data;
        if(data_chunks.length > data_index+1)
          return resolve(this._SearchPoolChunk(module, criteria, data, per_page, page, search_results, data_index+1));
        else
        {
          return resolve(search_results);
        }
      })
      .catch(error => {
        return reject(error);
      })
    });
  }

  /***
  * ! Private module, use Search
  */
  _Search(module, criteria, data, per_page, page, search_results)
  {
    per_page = per_page || 200;
    page = page || 1;
    search_results = search_results || [];

    data = data || false;
    let search_criteria = criteria;
    if(data)
    {
      // Create search obj
      let search_array = [];
      data.map(row => {
        search_array.push(DataReplace.replace(row, criteria));
      });
      search_criteria = `(${search_array.join("OR")})`;
    }

    return new Promise((resolve, reject) =>
    {
      this.Log('verbose',`Search -- Module: [${module}] Criteria: [${search_criteria}] - Page: ${page} - Per Page: ${per_page} - Total: ${search_results.length} - Pool: ${this.PoolSize}`);

      try {
        const search_criteria_matches = search_criteria.match(/\(([A-Z0-9_.\-:@$ ]+):([A-Z0-9_.\-:@$ ]+):([A-Z0-9_.\-:@$ ]+)\)/gim);
        if(search_criteria_matches.length > 10)
          return reject({ statusCode: 400, code: 'CRITERIA_LIMIT_EXCEEDED', message: 'no of criterium that can be given exceed the limit 10', details: null });
      }
      catch (e) {

      }

      if(this.PoolSize <= 0)
      {
        this.Log('error', [`------Search Pool Error:------`,`Status code: 429`,`Too many requests fired in concurrent than the allowed limit.`,`------Search Pool Error------`]);
        return reject({ statusCode: 429, code: 'TOO_MANY_REQUESTS', message: 'Many requests fired in concurrent than the allowed limit.', details: null });
      }

      this.PoolSize--;
      ZCRMRestClient.API.MODULES.search({ module: module, params: { criteria: search_criteria, page: page, per_page: per_page} })
      .then((response) =>
      {
        this.PoolSize++;
        if(response.statusCode === 200) // Found something
        {
          const response_data = JSON.parse(response.body);
          this.Log('debug',`Searched -- Module: [${module}] Page: ${page} - Response: ${response_data.data.length} - Total: ${search_results.length+response_data.data.length}`);
          search_results = search_results.concat(response_data.data);
          if(response_data.info.more_records)
            return resolve(this._Search(module, criteria, data, per_page, page+1, search_results));
          else
            return resolve(search_results);
        }
        else if(response.statusCode === 204) // No results
        {
          if(!search_results.length) // Only log if search results is empty
            this.Log('warn', [`------Search Warn:------`,search_criteria,response.body,`------Search Warn------`]);
          return resolve(search_results);
        }
        else // Error
        {
          if(response.statusCode === 400 || response.statusCode == 429)
          {
            const response_data = JSON.parse(response.body);
            this.Log('error', [`------Search Error:------`,`Status code: ${response.statusCode}`,search_criteria,response_data,`------Search Error------`]);
            return reject({ statusCode: response.statusCode, code: response_data.code, message: response_data.message, details: response_data.details });
          }
          else
          {
            const response_data = JSON.parse(response);
            this.Log('error', [`------Search Error:------`,`Status code: ${response.statusCode}`,search_criteria,response_data,`------Search Error------`]);
            return reject({ statusCode: response.statusCode, code: response_data.status_code, message: response_data.message, details: null });
          }
        }
      });
    });
  }

  Upsert(module, criteria, source, primaryKey, options)
  {
    options = ToOptions.parse(options);

    return new Promise((resolve, reject) => {

      if(!primaryKey || !Array.isArray(primaryKey) || primaryKey.length < 1)
      {
        primaryKey = [];
        const search_criteria_matches = criteria.matchAll(/\(([A-Z0-9_.\-:@$ ]+):([A-Z0-9_.\-:@$ ]+):([A-Z0-9_.\-:@$ ]+)\)/gim);
        for (const match of search_criteria_matches) {
          if(match[2] !== 'equals' && match[2] !== 'starts_with')
            return reject(`Criteria match type: ${match[2]} is not supported.`);
          primaryKey.push({ api_name: match[1], type: match[2], source: match[3], needs_replacement: match[3].indexOf("$_") == 0 })
        }
      }

      this.Search(module, criteria, source, options)
      .then(search_data => {

        source.map(source_row =>
        {
          source_row._matches = [];
          search_data.map(search_row =>
          {
            primaryKey.map(key =>
            {
              if(!search_row.hasOwnProperty(key.api_name))
                return reject(`API does not have key, ${key.api_name}`);

              const matchingValue = key.needs_replacement ? DataReplace.replace(source_row, key.source, true) : key.source;
              if(key.type === 'equals' && search_row[key.api_name] == matchingValue || key.type === 'starts_with' && search_row[key.api_name].indexOf(matchingValue) == 0)
                source_row._matches = _.concat(source_row._matches, search_row);
            });
          });
        });

        return resolve(source);

      })
      .catch(e => {
        return reject(e);
      })

    });
  }

  SendUpsert(module, data_update, data_insert)
  {

    return new Promise((resolve, reject) =>
    {

      data_update = Array.isArray(data_update) ? data_update : [data_update];
      data_insert = Array.isArray(data_insert) ? data_insert : [data_insert];

      if(!data_update.length && !data_insert.length)
      {
        this.Log('warn', `Upsert -- Module: [${module}] No data to update and/or insert.`);
        return resolve();
      }

      if(data_update.length && !data_insert.length)
      {
        this.Log('verbose', `Upsert -- Module: [${module}] Update: ${data_update.length}`);
        this.Update(module, data_update)
        .then(updated_data => {
          return resolve({ update: updated_data, insert: { success: [], error: [] } });
        })
        .catch(e => {
          return reject(e);
        });
      }
      else if(!data_update.length && data_insert.length)
      {
        this.Log('verbose', `Upsert -- Module: [${module}] Update: ${data_update.length} Insert: ${data_insert.length}`);
        this.Insert(module, data_insert)
        .then(insert_data => {
          return resolve({ update: { success: [], error: [] }, insert: insert_data });
        })
        .catch(e => {
          return reject(e);
        });
      }
      else
      {
        let dUpdate_cut = Math.ceil(this.PoolSize * (data_update.length / (data_update.length + data_insert.length))),
            dInsert_cut = Math.ceil(this.PoolSize * (data_insert.length / (data_update.length + data_insert.length)));


        if(dUpdate_cut + dInsert_cut > this.PoolSize)
        {
          if(dUpdate_cut > dInsert_cut)
          {

            /* dUpdate_cut -= 2;
            dInsert_cut++; */
            dUpdate_cut--;
          }
          else
          {
            /* dUpdate_cut++;
            dInsert_cut -= 2; */
            dInsert_cut--;
          }
        }

        if(dUpdate_cut < 1)
          dUpdate_cut = 1;
        if(dInsert_cut < 1)
          dInsert_cut = 1;

        Logger.debug(`Upsert -- Module: ${module} Update: ${data_update.length} (${dUpdate_cut}) Insert: ${data_insert.length} (${dInsert_cut})`);

        let updated_results = [],
            insert_results = [];

        const promise_update = this.Update(module, data_update, { pool_size: dUpdate_cut })
        .then(updated_data => {
          updated_results = updated_data;
        })
        .catch(e => {
          Logger.error(`------Upsert Upload Error:------`,e,`------Upsert Upload Error------`);
          //return reject(e);
        });

        const promise_insert = this.Insert(module, data_insert, { pool_size: dInsert_cut })
        .then(inserted_data => {
          insert_results = inserted_data;
        })
        .catch(e => {
          Logger.error(`------Upsert Insert Error:------`,e,`------Upsert Insert Error------`);
          //return reject(e);
        });

        Promise.all([promise_update, promise_insert])
        .then(() => {
          return resolve({ update: updated_results, insert: insert_results });
        })
        .catch(e => {
          return reject(e);
        });

      }

    })

  }

}

module.exports = ZohoClass;
