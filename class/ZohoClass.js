const DataReplace = require('../utility/DataReplaceString.js');
const ToOptions = require('../utility/ToOptions.js');

const _ = require('lodash');

module.exports = class ZohoClass {
  constructor(StackClass) {
    this.GetRecordTracker = {};
    this.StackClass = StackClass;
  }

  StackPush(apiMethod, moduleName, data, callback) {
    this.StackClass.push(apiMethod, moduleName, data, callback);
  }

  /**
   * Log to console and file
   * @param {String} level WinstonConsole level to use
   * @param {[String|Object]|Object} message Array of Strings/Objects or Object to log.
   * @return void
   */
  Log(level, message) {
    message = Array.isArray(message) ? message : [message];
    message.map((msg) => {
      Logger.log(level, typeof msg === 'object' && msg !== null ? JSON.stringify(msg) : msg);
    });
  }

  /**
   * Lookup IDs to a specified  Module
   * @param {String} moduleName ZohoCRM Module
   * @param {Array|Object} data Ids to lookup in ZohoCRM for specified module
   * @param {Object} callback { error: false | { statusCode, code, message, details }, response: null | ZohoCRM Object, dataOriginallySent }
   * @param {Object} options Extra options allowed to send with request
   * @returns {Promise}
   */
  getId(moduleName, data, callback, options) {
    options = ToOptions.parse(options);
    data = Array.isArray(data) ? data : [data];

    return new Promise((resolve, reject) => {
      // let success_array = [],
      //     error_array = [];

      let counter = 0;

      let resolve_array = [];

      data.map((tmpId) => {
        this.StackPush('MODULES', 'get', { module: moduleName, id: tmpId, ...options }, (response) => {
          counter++;

          if (response.statusCode === 200) {
            // Found something
            const response_data = JSON.parse(response.body).data;
            Logger.debug(`GetId -- Module: [${moduleName}] Id: [${response_data[0].id}] `);

            if (callback !== undefined) callback(false, response_data, { module: moduleName, data: tmpId });

            resolve_array.push({ error: false, response: response_data[0], data: { module: moduleName, data: tmpId } });
          } // Error
          else {
            const response_data = JSON.parse(response.body);
            Logger.error(`GetId -- Module: [${moduleName}] Id: ${tmpId}`);

            if (callback !== undefined)
              callback(
                {
                  statusCode: response.statusCode,
                  code: response_data.code,
                  message: response_data.message,
                  details: response_data.details
                },
                null,
                { module: moduleName, data: tmpId }
              );

            resolve_array.push({
              error: {
                statusCode: response.statusCode,
                code: response_data.code,
                message: response_data.message,
                details: response_data.details
              },
              response: null,
              data: { module: moduleName, data: tmpId }
            });
          }

          if (counter == data.length) return resolve(resolve_array);
        });
      });
    });
  }

  /**
   * Lookup records of a specified Module, allowing to get from a starting page and/or from starting date
   * @param {String} moduleName ZohoCRM Module
   * @param {Object} options Extra options allowed to send with request
   * @param {Object} callback { error: false | { statusCode, code, message, details }, response: null | ZohoCRM Object, dataOriginallySent }
   * @returns {Promise}
   */
  getRecords(moduleName, options, callback) {
    options = ToOptions.parse(options);
    options.params = options.hasOwnProperty('params') ? options.params : { page: 1, per_page: 200 };
    options.chunk = options.hasOwnProperty('chunk') ? options.chunk : 1;
    options.headers = options.hasOwnProperty('headers') ? options.headers : {};

    let data = [];

    for (let i = 1; i <= options.chunk; i++) {
      data.push({ ...options, ...{ params: { ...options.params, page: i } } });
    }

    let counter = 0,
      maxCounter = data.length;

    let resolve_response = [];
    let record_tracker_last_page_no_results = null; // Keep track of the highest page checked that yileded no result so chunk doesn't go over it.

    const _processRecordChunk = (moduleName, options, callback) => {
      this.StackPush('MODULES', 'get', { module: moduleName, headers: options.headers, params: options.params }, (response) => {
        if (response.statusCode === 200) {
          // Found something
          const response_data = JSON.parse(response.body);
          const res_data = searchData.module == 'users' ? response_data.users : response_data.data;
          Logger.debug(`GetRecords -- Module: [${moduleName}] Page: ${options.params.page} - Response: ${res_data.length} - HasMore: ${response_data.info.more_records} - Last Page: ${record_tracker_last_page_no_results} - ${JSON.stringify(options.headers)}`);

          if ((options.headers.hasOwnProperty('If-Modified-Since') && response_data.info.more_records) || (options.hasOwnProperty('all') && response_data.info.more_records)) {
            // Only return more than 200 if options are passed
            // There are more pages..
            options.params.page = options.chunk + options.params.page;
            if (record_tracker_last_page_no_results === null || options.params.page < record_tracker_last_page_no_results) {
              _processRecordChunk(moduleName, options, callback);
              return callback(false, res_data, { module: moduleName, data: options }, true);
            } else return callback(false, res_data, { module: moduleName, data: options }, false);
          } else return callback(false, res_data, { module: moduleName, data: options }, false);
        } else if (response.statusCode === 404 || response.statusCode === 304 || response.statusCode === 204) {
          // No results
          // Set range so when looping if its still within range of highest non found page it will attempt to get it
          if (record_tracker_last_page_no_results === null) record_tracker_last_page_no_results = options.params.page;
          else if (record_tracker_last_page_no_results > options.params.page) record_tracker_last_page_no_results = options.params.page;

          Logger.warn(`GetRecords -- Module: [${moduleName}] Page: ${options.params.page} - Response: 0`);
          return callback(false, [], { module: moduleName, data: options }, false);
        } // Error
        else {
          const response_data = JSON.parse(response.body);
          Logger.error(`GetRecords -- Module: [${moduleName}] Page: ${options.params.page}`);
          return (
            callback(
              {
                statusCode: response.statusCode,
                code: response_data.code,
                message: response_data.message,
                details: response_data.details
              },
              [],
              { module: moduleName, data: options }
            ),
            false
          );
        }
      });
    };

    return new Promise((resolve, reject) => {
      data.map((row) => {
        _processRecordChunk(moduleName, row, (error, response_data, chunk_data, added_row) => {
          if (callback !== undefined) callback(error, response_data, chunk_data);

          if (added_row) maxCounter++;

          counter++;

          resolve_response = resolve_response.concat(response_data);
          if (counter === maxCounter) return resolve(resolve_response);
        });
      });
    });
  }

  /**
   * Updates records of a specified  module
   * @param {String} moduleName ZohoCRM Module
   * @param {Array} data Array of objects to be sent to ZohoCRM
   * @param {Object} callback { error: false | { statusCode, code, message, details }, response: null | ZohoCRM Object, dataOriginallySent }
   * @param {Object} options Extra options allowed to send with request
   * @returns {Promise}
   */
  updateRecords(moduleName, data, callback, options) {
    const data_chunks = _.chunk(data, 100);
    let counter = 0;

    return new Promise((resolve, reject) => {
      data_chunks.map((row) => {
        let res_counter = 0;
        let errorData = [],
          successData = [];

        this.StackPush('MODULES', 'put', { module: moduleName, body: { data: row }, ...options }, (response) => {
          counter++;
          if (response.statusCode === 200 || response.statusCode === 202) {
            const response_data = JSON.parse(response.body).data;
            response_data.map((res) => {
              if (res.status == 'success') {
                successData.push({ id: res.details.id, ...row[res_counter], zoho_response: res });
                Logger.debug(`Updated -- Module: [${moduleName}] ID: [${row[res_counter].id}]`);
              } else {
                errorData.push({ error: res, data: row[res_counter] });
                Logger.warn(`Updated -- Module: [${moduleName}] ID: [${row[res_counter].id}]`);
                this.Log('warn', { error: res, data: row[res_counter] });
              }
              res_counter++;
            });

            callback(false, { success: successData, error: errorData }, { module: moduleName, data: row });
          } // error
          else {
            const response_data = JSON.parse(response.body);
            callback(
              {
                statusCode: response.statusCode,
                code: response_data.code,
                message: response_data.message,
                details: response_data.details
              },
              { success: successData, error: errorData },
              { module: moduleName, data: row }
            );
          }

          if (counter == data_chunks.length) return resolve();
        });
      });
    });
  }

  /**
   * Inserts records of a specified module
   * @param {String} moduleName ZohoCRM Module
   * @param {Array} data Array of objects to be sent to ZohoCRM
   * @param {Object} callback { error: false | { statusCode, code, message, details }, response: null | ZohoCRM Object, dataOriginallySent }
   * @param {Object} options Extra options allowed to send with request
   * @returns {Promise}
   */
  insertRecords(moduleName, data, callback) {
    const data_chunks = _.chunk(data, 100);
    let counter = 0;

    let response_array = [];

    return new Promise((resolve, reject) => {
      data_chunks.map((row) => {
        let res_counter = 0;
        let errorData = [],
          successData = [];

        this.StackPush('MODULES', 'post', { module: moduleName, body: { data: row } }, (response) => {
          counter++;
          if (response.statusCode === 200 || response.statusCode === 201 || response.statusCode === 202) {
            const response_data = JSON.parse(response.body).data;
            response_data.map((res) => {
              if (res.status == 'success') {
                successData.push({ id: res.details.id, ...row[res_counter], zoho_response: res });
                Logger.debug(`Insert -- Module: [${moduleName}] ID: [${res.details.id}]`);
              } else {
                errorData.push({ error: res, data: row[res_counter] });
                Logger.warn(`Insert -- Module: [${moduleName}]`);
                this.Log('warn', { error: res, data: row[res_counter] });
              }
              res_counter++;
            });

            if (callback !== undefined) callback(false, { success: successData, error: errorData }, { module: moduleName, data: row });
            response_array = response_array.concat({ error: false, response: { success: successData, error: errorData }, data: { module: moduleName, data: row } });
          } // error
          else {
            const response_data = JSON.parse(response.body);
            if (callback !== undefined)
              callback(
                {
                  statusCode: response.statusCode,
                  code: response_data.code,
                  message: response_data.message,
                  details: response_data.details
                },
                { success: successData, error: errorData },
                { module: moduleName, data: row }
              );
            response_array = response_array.concat({
              error: {
                statusCode: response.statusCode,
                code: response_data.code,
                message: response_data.message,
                details: response_data.details
              },
              response: { success: successData, error: errorData },
              data: { module: moduleName, data: row }
            });
          }

          if (counter == data_chunks.length) return resolve(response_array);
        });
      });
    });
  }

  /**
   * Searches for records of a specified module with a criteria
   * @param {String} moduleName ZohoCRM Module
   * @param {String} criteria Criteria to search module with
   * @param {Object} callback { error: false | { statusCode, code, message, details }, response: null | ZohoCRM Object, dataOriginallySent }
   * @param {Array} data Array of objects if dynamically creating criteria
   * @param {Object} options Extra options allowed to send with request
   * @returns {Promise}
   */
  searchRecords(moduleName, criteria, callback, data, options) {
    data = data || [];

    options = ToOptions.parse(options);
    options.params = options.hasOwnProperty('params') ? options.params : { page: 1, per_page: 200 };
    options.chunk = options.hasOwnProperty('chunk') ? options.chunk : 1;
    options.headers = options.hasOwnProperty('headers') ? options.headers : {};

    let searchData = [];

    let response_array = [];

    for (let i = 0; i < options.chunk; i++) {
      searchData.push({ ...options, ...{ params: { ...options.params, page: options.params.page + i } } });
    }

    if (!criteria.length) {
      if (callback !== undefined) callback({ statusCode: 400, code: 'CRITERIA_LIMIT_EXCEEDED', message: 'No criteria provided.', details: null });
      this.Log('error', 'No criteria provided.');
      return;
    }

    const _processSearchChunk = (searchData, data, callback) => {
      Logger.debug(`Searching -- Module: [${searchData.module}] Page: ${searchData.params.page} - Criteria: ${searchData.params.criteria}`);

      this.StackPush('MODULES', 'search', searchData, (response) => {
        if (response.statusCode === 200) {
          // Found something
          const response_data = JSON.parse(response.body);
          const res_data = searchData.module == 'users' ? response_data.users : response_data.data;
          Logger.debug(`Searched -- Module: [${searchData.module}] Page: ${searchData.params.page} - Response: ${res_data.length} - Criteria: ${searchData.params.criteria}`);
          if (response_data.info.more_records) {
            searchData.params.page = searchData.chunk + searchData.params.page;
            _processSearchChunk(searchData, data, callback);
            return callback(false, res_data, { module: searchData.module, data: data }, true);
          } else return callback(false, res_data, { module: searchData.module, data: data }, false);
        } else if (response.statusCode === 204) {
          // No results
          Logger.debug(`Searched -- Module: [${searchData.module}]  Page: ${searchData.params.page} - Response: 0`);
          return callback(false, [], { module: searchData.module, data: data }, false);
        } // Error
        else {
          if (response.statusCode === 400 || response.statusCode == 429) {
            const response_data = JSON.parse(response.body);
            Logger.debug(`Searched -- Module: [${searchData.module}] Page: ${searchData.params.page} - Response: ${JSON.stringify(response_data)}`);
            return callback(
              {
                statusCode: response.statusCode,
                code: response_data.code,
                message: response_data.message,
                details: response_data.details
              },
              [],
              { module: searchData.module, data: data },
              false
            );
          } else {
            const response_data = response;
            Logger.debug(`Searched -- Module: [${searchData.module}] Page: ${searchData.params.page} - Response: ${JSON.stringify(response_data)}`);
            return callback(
              {
                statusCode: response.statusCode,
                code: response_data.code,
                message: response_data.message,
                details: response_data.details
              },
              [],
              { module: searchData.module, data: data },
              false
            );
          }
        }
      });
    };

    return new Promise((resolve, reject) => {
      // Check if criteria is below max allowed
      const criteria_matches = criteria.match(/\(([A-Z0-9_.\-:@$ ]+):([A-Z0-9_.\-:@$ ]+):([A-Z0-9_.\-:@$/À-ÿ– ]+)\)/gim);
      if (criteria_matches.length > 10) {
        if (callback !== undefined)
          callback({
            statusCode: 400,
            code: 'CRITERIA_LIMIT_EXCEEDED',
            message: 'Cannot send more than 10 criterias together.',
            details: null
          });
        this.Log('error', 'Cannot send more than 10 criterias together.');
        return;
      }

      searchData.map((row) => {
        if (data.length) {
          const search_criteria_matches = criteria.match(/\(([A-Z0-9_.\-:@$ ]+):([A-Z0-9_.\-:@$ ]+):([A-Z0-9_.\-:@$/À-ÿ– ]+)\)/gim);
          //const chunk_size = data.length * search_criteria_matches.length < 10 ? 10 : (10 / search_criteria_matches.length) >> 0;
          const chunk_size = data.length * search_criteria_matches.length < 10 ? (this.StackClass.PoolSize < 10 && this.StackClass.PoolSize != 1 ? this.StackClass.PoolSize : 10) : (10 / search_criteria_matches.length) >> 0;
          const data_chunks = _.chunk(data, chunk_size);

          let counter = 0,
            maxCounter = data_chunks.length;

          data_chunks.map((chunk) => {
            let search_array = [];
            chunk.map((row) => {
              search_array.push(DataReplace.replace(row, criteria));
            });

            _processSearchChunk({ ...row, module: moduleName, params: { ...row.params, criteria: `(${search_array.join('OR')})` } }, chunk, (error, response_data, data, added_row) => {
              if (callback !== undefined) callback(error, response_data, data);
              if (added_row) maxCounter++;

              response_array = response_array.concat({ error: error, response: response_data, data: data });
              counter++;

              if (counter === maxCounter) return resolve(response_array);
            });
          });
        } else {
          let counter = 0,
            maxCounter = 1;

          _processSearchChunk({ ...row, module: moduleName, params: { ...row.params, criteria: criteria } }, [], (error, response_data, data, added_row) => {
            if (callback !== undefined) callback(error, response_data, data);
            if (added_row) maxCounter++;

            response_array = response_array.concat({ error: error, response: response_data, data: data });
            counter++;

            if (counter === maxCounter) return resolve(response_array);
          });
        }
      });
    });
  }

  /**
   * Update or Insert records into specified module by checking for certain fields match what's being sent to ZohoCRM
   * @param {String} moduleName ZohoCRM Module
   * @param {Array} data Array of objects to be sent to ZohoCRM
   * @param {Array} duplicate_check Array of strings to be sent to check for duplication in ZohoCRM
   * @param {Object} callback { error: false | { statusCode, code, message, details }, response: null | ZohoCRM Object, dataOriginallySent }
   * @returns {Promise}
   */
  upsertRecords(moduleName, data, duplicate_check, callback) {
    const data_chunks = _.chunk(data, 100);
    let counter = 0;

    let response_array = [];

    duplicate_check = Array.isArray(duplicate_check) ? duplicate_check : [duplicate_check];

    return new Promise((resolve, reject) => {
      data_chunks.map((row) => {
        let res_counter = 0;
        let errorData = [],
          successData = [];

        this.StackPush('MODULES', 'upsert', { module: moduleName, body: { data: row, duplicate_check_fields: duplicate_check } }, (response) => {
          counter++;
          if (response.statusCode === 200 || response.statusCode === 201 || response.statusCode === 202) {
            const response_data = JSON.parse(response.body).data;
            response_data.map((res) => {
              if (res.status == 'success') {
                successData.push({ id: res.details.id, data: row[res_counter], zoho_response: res });
                Logger.debug(`Upsert -- Module: [${moduleName}] ID: [${res.details.id}] - Type: [${res.message}]`);
              } else {
                errorData.push({ error: res, data: row[res_counter] });
                Logger.warn(`Upsert -- Module: [${moduleName}]`);
                this.Log('warn', { error: res, data: row[res_counter] });
              }
              res_counter++;
            });

            if (callback !== undefined) callback(false, { success: successData, error: errorData }, { module: moduleName, data: row });
            response_array = response_array.concat({ error: false, response: { success: successData, error: errorData }, data: { module: moduleName, data: row } });
          } else {
            const response_data = JSON.parse(response.body);
            if (callback !== undefined)
              callback(
                {
                  statusCode: response.statusCode,
                  code: response_data.code,
                  message: response_data.message,
                  details: response_data.details
                },
                { success: successData, error: errorData },
                { module: moduleName, data: row }
              );
            response_array = response_array.concat({
              error: {
                statusCode: response.statusCode,
                code: response_data.code,
                message: response_data.message,
                details: response_data.details
              },
              response: { success: successData, error: errorData },
              data: { module: moduleName, data: row }
            });
          }

          if (counter == data_chunks.length) return resolve(response_array);
        });
      });
    });
  }

  /**
   * Deletes records of IDs from specified module in ZohoCRM
   * @param {String} moduleName ZohoCRM Module
   * @param {Array} data Ids to delete in ZohoCRM for specified module
   * @param {Object} callback { error: false | { statusCode, code, message, details }, response: null | ZohoCRM Object, dataOriginallySent }
   * @returns
   */
  deleteRecords(moduleName, data, callback) {
    const data_chunks = _.chunk(data, 100);
    let counter = 0;

    let response_array = [];

    return new Promise((resolve, reject) => {
      data_chunks.map((row) => {
        let res_counter = 0;
        let errorData = [],
          successData = [];

        this.StackPush('MODULES', 'delete', { module: moduleName, id: row.join(',') }, (response) => {
          counter++;
          if (response.statusCode === 200 || response.statusCode === 201 || response.statusCode === 202) {
            const response_data = JSON.parse(response.body).data;
            response_data.map((res) => {
              if (res.status == 'success') {
                successData.push({ id: res.details.id, ...row[res_counter], zoho_response: res });
                Logger.debug(`Deleted -- Module: [${moduleName}] ID: [${res.details.id}]`);
              } else {
                errorData.push({ error: res, data: row[res_counter] });
                Logger.warn(`Deleted -- Module: [${moduleName}]`);
                this.Log('warn', { error: res, data: row[res_counter] });
              }
              res_counter++;
            });

            if (callback !== undefined) callback(false, { success: successData, error: errorData }, { module: moduleName, data: row });
            response_array = response_array.concat({ error: false, response: { success: successData, error: errorData }, data: { module: moduleName, data: row } });
          } // error
          else {
            const response_data = JSON.parse(response.body);
            if (callback !== undefined)
              callback(
                {
                  statusCode: response.statusCode,
                  code: response_data.code,
                  message: response_data.message,
                  details: response_data.details
                },
                { success: successData, error: errorData },
                { module: moduleName, data: row }
              );
            response_array = response_array.concat({
              error: {
                statusCode: response.statusCode,
                code: response_data.code,
                message: response_data.message,
                details: response_data.details
              },
              response: { success: successData, error: errorData },
              data: { module: moduleName, data: row }
            });
          }

          if (counter == data_chunks.length) return resolve(response_array);
        });
      });
    });
  }

  /**
   * Lookup specified user profile in ZohoCRM
   * @param {String} id Profile ID
   * @param {Object} callback { boolean, [object] }
   * @returns {Promise}
   */
  getProfiles(id, callback) {
    id = id || '';
    return new Promise((resolve, reject) => {
      this.StackPush('SETTINGS', 'getProfiles', { id }, (response) => {
        const response_data = JSON.parse(response.body);
        if (response.statusCode === 200) {
          if (callback !== undefined) {
            callback(false, response_data.profiles);
          }
          return resolve({ error: false, data: response_data.profiles });
        } else {
          if (callback !== undefined) {
            callback(true, []);
          }
          return resolve({ error: true, data: [] });
        }
      });
    });
  }

  /**
   * Share a record with an array of users
   * @param {String} moduleName ZohoCRM Module
   * @param {String} id Record Id
   * @param {Object} data Object permission of user's that will get permission
   * @param {Object} callback
   * @returns
   */
  shareRecord(moduleName, id, data, callback) {
    return new Promise((resolve, reject) => {
      this.StackPush('ACTIONS', 'share', { module: moduleName, id: id, body: data }, (response) => {
        const response_data = JSON.parse(response.body);
        if (callback !== undefined) {
          if (response.statusCode === 200) callback(false, { ...response_data.share[0], details: { entityId: id } });
          else callback(response_data, null);
        }
        if (response.statusCode === 200) return resolve({ ...response_data.share[0], details: { entityId: id } });
        else return reject(response_data);
      });
    });
  }

  /**
   * Get user info from a specified id
   * @param {String} id Record Id
   * @param {Object} callback
   * @returns
   */
  getUser(id, callback) {
    return new Promise((resolve, reject) => {
      this.StackPush('USERS', 'get', { id: id }, (response) => {
        const response_data = JSON.parse(response.body);
        if (callback !== undefined) {
          if (response.statusCode === 200) callback(false, { ...response_data.users[0], details: { entityId: id } });
          else callback(response_data, null);
        }
        if (response.statusCode === 200) return resolve({ ...response_data.users[0], details: { entityId: id } });
        else return reject(response_data);
      });
    })
  }
};
