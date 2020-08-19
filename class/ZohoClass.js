const ZCRMRestClient = require("zcrmsdk");

const DataReplace = require("../utility/DataReplaceString.js");
const ToOptions = require("../utility/ToOptions.js");

const Logger = require("../utility/WinstonLogger.js");
Logger.setPath("../log");

const _ = require("lodash");

module.exports = class ZohoClass {
  constructor(StackClass) {
    //console.log(`Constructor for Zoho called...`);
    this.GetRecordTracker = {};
    this.StackClass = StackClass;
  }

  StackPush(apiMethod, moduleName, data, cb) {
    this.StackClass.push(apiMethod, moduleName, data, cb);
  }

  Log(level, message) {
    message = Array.isArray(message) ? message : [message];
    message.map((msg) => {
      Logger.log(level, typeof msg === "object" && msg !== null ? JSON.stringify(msg) : msg);
    });
  }

  getId(moduleName, data, callback) {
    data = Array.isArray(data) ? data : [data];

    return new Promise((resolve, reject) => {
      // let success_array = [],
      //     error_array = [];

      let counter = 0;

      let success_array = [],
        error_array = [];

      data.map((tmpId) => {
        this.StackPush("MODULES", "get", { module: moduleName, id: tmpId }, (response) => {
          counter++;

          if (response.statusCode === 200) {
            // Found something
            const response_data = JSON.parse(response.body).data;
            Logger.debug(`GetId -- Module: [${moduleName}] Id: [${response_data[0].id}] `);

            if (callback !== undefined) callback(false, response_data, { module: moduleName, data: tmpId });

            success_array.push({ error: false, response: response_data[0], data: { module: moduleName, data: tmpId } });
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
                  details: response_data.details,
                },
                null,
                { module: moduleName, data: tmpId }
              );

            error_array.push({
              error: { statusCode: response.statusCode, code: response_data.code, message: response_data.message, details: response_data.details },
              response: null,
              data: { module: moduleName, data: tmpId },
            });
          }

          if (counter == data.length) return resolve({ error: error_array, response: success_array, data: data });
        });
      });
    });
  }

  getRecords(moduleName, options, callback) {
    options = ToOptions.parse(options);
    options.params = options.hasOwnProperty("params") ? options.params : { page: 1, per_page: 200 };
    options.chunk = options.hasOwnProperty("chunk") ? options.chunk : 1;
    options.headers = options.hasOwnProperty("headers") ? options.headers : {};

    let data = [];

    for (let i = 1; i <= options.chunk; i++) {
      data.push({ ...options, ...{ params: { ...options.params, page: i } } });
    }

    let counter = 0,
      maxCounter = data.length;

    let resolve_response = [];

    return new Promise((resolve, reject) => {
      data.map((row) => {
        this._GetRecordChunk(moduleName, row, (error, response_data, chunk_data, added_row) => {
          if (callback !== undefined) callback(error, response_data, chunk_data);

          if (added_row) maxCounter++;

          counter++;

          resolve_response = resolve_response.concat(response_data);
          if (counter === maxCounter) return resolve({ error: error, response: resolve_response, data: data });
        });
      });
    });
  }

  _GetRecordChunk(moduleName, options, cb) {
    this.StackPush("MODULES", "get", { module: moduleName, headers: options.headers, params: options.params }, (response) => {
      if (response.statusCode === 200) {
        // Found something
        const response_data = JSON.parse(response.body);
        Logger.debug(`GetRecords -- Module: [${moduleName}] Page: ${options.params.page} - Response: ${response_data.data.length} - HasMore: ${response_data.info.more_records}`);

        if ((options.headers.hasOwnProperty("If-Modified-Since") && response_data.info.more_records) || (options.hasOwnProperty("all") && response_data.info.more_records)) {
          // Only return more than 200 if options are passed
          // There are more pages..
          options.params.page = options.chunk + options.params.page;
          if (!this.GetRecordTracker.hasOwnProperty(moduleName) || options.params.page < this.GetRecordTracker[moduleName]) {
            this._GetRecordChunk(moduleName, options, cb);
            return cb(false, response_data.data, { module: moduleName, data: options }, true);
          } else return cb(false, response_data.data, { module: moduleName, data: options }, false);
        } else return cb(false, response_data.data, { module: moduleName, data: options }, false);
      } else if (response.statusCode === 404 || response.statusCode === 304 || response.statusCode === 204) {
        // No results
        // Set range so when looping if its still within range of highest non found page it will attempt to get it
        if (!this.GetRecordTracker.hasOwnProperty(moduleName)) this.GetRecordTracker[moduleName] = options.params.page;
        else if (this.GetRecordTracker[moduleName] > options.params.page) this.GetRecordTracker[moduleName] = options.params.page;

        Logger.warn(`GetRecords -- Module: [${moduleName}] Page: ${options.params.page} - Response: 0`);
        return cb(false, [], { module: moduleName, data: options }, false);
      } // Error
      else {
        const response_data = JSON.parse(response.body);
        Logger.error(`GetRecords -- Module: [${moduleName}] Page: ${options.params.page}`);
        return (
          cb(
            {
              statusCode: response.statusCode,
              code: response_data.code,
              message: response_data.message,
              details: response_data.details,
            },
            [],
            { module: moduleName, data: options }
          ),
          false
        );
      }
    });
  }

  updateRecords(moduleName, data, cb) {
    const data_chunks = _.chunk(data, 100);
    let counter = 0;

    return new Promise((resolve, reject) => {
      data_chunks.map((row) => {
        let res_counter = 0;
        let errorData = [],
          successData = [];

        this.StackPush("MODULES", "put", { module: moduleName, body: { data: row } }, (response) => {
          counter++;
          if (response.statusCode === 200 || response.statusCode === 202) {
            const response_data = JSON.parse(response.body).data;
            response_data.map((res) => {
              if (res.status == "success") {
                successData.push({ id: res.details.id, ...row[res_counter], zoho_response: res });
                Logger.debug(`Updated -- Module: [${moduleName}] ID: [${row[res_counter].id}]`);
              } else {
                errorData.push({ error: res, data: row[res_counter] });
                Logger.warn(`Updated -- Module: [${moduleName}] ID: [${row[res_counter].id}]`);
                this.Log("warn", { error: res, data: row[res_counter] });
              }
              res_counter++;
            });

            cb(false, { success: successData, error: errorData }, { module: moduleName, data: row });
          } // error
          else {
            const response_data = JSON.parse(response.body);
            cb(
              {
                statusCode: response.statusCode,
                code: response_data.code,
                message: response_data.message,
                details: response_data.details,
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

  insertRecords(moduleName, data, cb) {
    const data_chunks = _.chunk(data, 100);
    let counter = 0;

    return new Promise((resolve, reject) => {
      data_chunks.map((row) => {
        let res_counter = 0;
        let errorData = [],
          successData = [];

        this.StackPush("MODULES", "post", { module: moduleName, body: { data: row } }, (response) => {
          counter++;
          if (response.statusCode === 200 || response.statusCode === 201 || response.statusCode === 202) {
            const response_data = JSON.parse(response.body).data;
            response_data.map((res) => {
              if (res.status == "success") {
                successData.push({ id: res.details.id, ...row[res_counter], zoho_response: res });
                Logger.debug(`Insert -- Module: [${moduleName}] ID: [${res.details.id}]`);
              } else {
                errorData.push({ error: res, data: row[res_counter] });
                Logger.warn(`Insert -- Module: [${moduleName}]`);
                this.Log("warn", { error: res, data: row[res_counter] });
              }
              res_counter++;
            });

            cb(false, { success: successData, error: errorData }, { module: moduleName, data: row });
          } // error
          else {
            const response_data = JSON.parse(response.body);
            cb(
              {
                statusCode: response.statusCode,
                code: response_data.code,
                message: response_data.message,
                details: response_data.details,
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

  searchRecords(moduleName, criteria, callback, data, options) {
    data = data || [];

    options = ToOptions.parse(options);
    options.params = options.hasOwnProperty("params") ? options.params : { page: 1, per_page: 200 };
    options.chunk = options.hasOwnProperty("chunk") ? options.chunk : 1;
    options.headers = options.hasOwnProperty("headers") ? options.headers : {};

    let searchData = [];

    let response_array = [];

    for (let i = 0; i < options.chunk; i++) {
      searchData.push({ ...options, ...{ params: { ...options.params, page: options.params.page + i } } });
    }

    if (!criteria.length) {
      if (callback !== undefined) callback({ statusCode: 400, code: "CRITERIA_LIMIT_EXCEEDED", message: "No criteria provided.", details: null });
      this.Log("error", "No criteria provided.");
      return;
    }

    return new Promise((resolve, reject) => {
      // Check if criteria is below max allowed
      const criteria_matches = criteria.match(/\(([A-Z0-9_.\-:@$ ]+):([A-Z0-9_.\-:@$ ]+):([A-Z0-9_.\-:@$ ]+)\)/gim);
      if (criteria_matches.length > 10) {
        if (callback !== undefined)
          callback({
            statusCode: 400,
            code: "CRITERIA_LIMIT_EXCEEDED",
            message: "Cannot send more than 10 criterias together.",
            details: null,
          });
        this.Log("error", "Cannot send more than 10 criterias together.");
        return;
      }

      searchData.map((row) => {
        if (data.length) {
          const search_criteria_matches = criteria.match(/\(([A-Z0-9_.\-:@$ ]+):([A-Z0-9_.\-:@$ ]+):([A-Z0-9_.\-:@$ ]+)\)/gim);
          //const chunk_size = data.length * search_criteria_matches.length < 10 ? 10 : (10 / search_criteria_matches.length) >> 0;
          const chunk_size =
            data.length * search_criteria_matches.length < 10
              ? this.StackClass.PoolSize < 10 && this.StackClass.PoolSize != 1
                ? this.StackClass.PoolSize
                : 10
              : (10 / search_criteria_matches.length) >> 0;
          const data_chunks = _.chunk(data, chunk_size);

          let counter = 0,
            maxCounter = data_chunks.length;

          data_chunks.map((chunk) => {
            let search_array = [];
            chunk.map((row) => {
              search_array.push(DataReplace.replace(row, criteria));
            });

            this._GetSearchChunk({ ...row, module: moduleName, params: { ...row.params, criteria: `(${search_array.join("OR")})` } }, chunk, (error, response_data, data, added_row) => {
              if (callback !== undefined) callback(error, response_data, data);
              if (added_row) maxCounter++;

              response_array = response_array.concat({ error: error, response: response_data, data: data });
              counter++;

              if (counter === maxCounter) return resolve({ error: false, response: response_array, data: searchData });
            });
          });
        } else {
          let counter = 0,
            maxCounter = 1;

          this._GetSearchChunk({ ...row, module: moduleName, params: { ...row.params, criteria: criteria } }, [], (error, response_data, data, added_row) => {
            if (callback !== undefined) callback(error, response_data, data);
            if (added_row) maxCounter++;

            response_array = response_array.concat({ error: error, response: response_data, data: data });
            counter++;

            if (counter === maxCounter) return resolve({ error: false, response: response_array, data: searchData });
          });
        }
      });
    });
  }

  _GetSearchChunk(searchData, data, cb) {
    Logger.debug(`Searching -- Module: [${searchData.module}] Page: ${searchData.params.page} - Criteria: ${searchData.params.criteria}`);

    this.StackPush("MODULES", "search", searchData, (response) => {
      if (response.statusCode === 200) {
        // Found something
        const response_data = JSON.parse(response.body);
        Logger.debug(`Searched -- Module: [${searchData.module}] Page: ${searchData.params.page} - Response: ${response_data.data.length} - Criteria: ${searchData.params.criteria}`);
        if (response_data.info.more_records) {
          searchData.params.page = searchData.chunk + searchData.params.page;
          this._GetSearchChunk(searchData, data, cb);
          return cb(false, response_data.data, { module: searchData.module, data: data }, true);
        } else return cb(false, response_data.data, { module: searchData.module, data: data }, false);
      } else if (response.statusCode === 204) {
        // No results
        Logger.debug(`Searched -- Module: [${searchData.module}]  Page: ${searchData.params.page} - Response: 0`);
        return cb(false, [], { module: searchData.module, data: data }, false);
      } // Error
      else {
        if (response.statusCode === 400 || response.statusCode == 429) {
          const response_data = JSON.parse(response.body);
          Logger.debug(`Searched -- Module: [${searchData.module}] Page: ${searchData.params.page} - Response: ${JSON.stringify(response_data)}`);
          return cb(
            {
              statusCode: response.statusCode,
              code: response_data.code,
              message: response_data.message,
              details: response_data.details,
            },
            [],
            { module: searchData.module, data: data },
            false
          );
        } else {
          const response_data = response;
          Logger.debug(`Searched -- Module: [${searchData.module}] Page: ${searchData.params.page} - Response: ${JSON.stringify(response_data)}`);
          return cb(
            {
              statusCode: response.statusCode,
              code: response_data.code,
              message: response_data.message,
              details: response_data.details,
            },
            [],
            { module: searchData.module, data: data },
            false
          );
        }
      }
    });
  }

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

        this.StackPush("MODULES", "upsert", { module: moduleName, body: { data: row, duplicate_check_fields: duplicate_check } }, (response) => {
          counter++;
          if (response.statusCode === 200 || response.statusCode === 201 || response.statusCode === 202) {
            const response_data = JSON.parse(response.body).data;
            response_data.map((res) => {
              if (res.status == "success") {
                successData.push({ id: res.details.id, ...row[res_counter], zoho_response: res });
                Logger.debug(`Upsert -- Module: [${moduleName}] ID: [${res.details.id}] - Type: [${res.message}]`);
              } else {
                errorData.push({ error: res, data: row[res_counter] });
                Logger.warn(`Upsert -- Module: [${moduleName}]`);
                this.Log("warn", { error: res, data: row[res_counter] });
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
                  details: response_data.details,
                },
                { success: successData, error: errorData },
                { module: moduleName, data: row }
              );
            response_array = response_array.concat({
              error: {
                statusCode: response.statusCode,
                code: response_data.code,
                message: response_data.message,
                details: response_data.details,
              },
              response: { success: successData, error: errorData },
              data: { module: moduleName, data: row },
            });
          }

          if (counter == data_chunks.length) return resolve({ error: false, response: response_array, data: data });
        });
      });
    });
  }

  deleteRecords(moduleName, data, cb) {
    //MODULES.delete
  }

  getProfiles(callback) {
    return new Promise((resolve, reject) => {
      this.StackPush("SETTINGS", "getProfiles", "", (response) => {
        const response_data = JSON.parse(response.body);
        callback(false, response_data.profiles);
        return resolve({ error: false, data: response_data.profiles });
      });
    });
  }

  getRoles() {
    //ROLES.getRoles
  }

  convertLead() {
    //ACTIONS.convert
  }

  getUsers() {
    //USERS.get
  }

  uploadFile() {
    //ATTACHMENTS.uploadFile
  }
  downloadFile() {}
  deleteFile() {}

  uploadLink() {
    //ATTACHMENTS.uploadLink
  }

  uploadPhoto() {
    //ATTACHMENTS.uploadPhoto
  }
  downloadPhoto() {}
  deletePhoto() {}

  coql(searchData) {
    /*
            `select Account_Name 
                from Accounts 
                where Modified_Time between '2020-01-01T00:00:01-03:00' and '2020-02-14T23:59:59-03:00' 
                order by Modified_Time asc limit 200
            `
        */
    ZCRMRestClient.API.MODULES.coql({
      body: {
        select_query: `
            SELECT First_Name, Last_Name, Full_Name, Account_Name
            FROM Contacts
            WHERE Account_Name = '116652000029367151'
            ORDER BY Full_Name ASC
            `,
      },
    }).then((response) => {
      console.log(response.statusCode);
      console.log(JSON.parse(response.body));
      //console.log( JSON.parse(response.body).data.length );
      console.log(JSON.parse(response.body).data[0]);
    });
  }
};
