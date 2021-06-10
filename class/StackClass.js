const ZCRMRestClient = require('@pedrolian/zcrmsdk');

module.exports = class Stack {
  constructor(poolSize) {
    this.PoolSize = !isNaN(Number(poolSize)) ? poolSize : 5;

    this._stack = [];
    this._Connections = [];
    for (let i = 0; i < this.PoolSize; i++) {
      this._Connections.push({
        id: i,
        isProcessing: false
      });
    }

    this._process();
  }

  push(api, method, data, cb) {
    this._stack.push({ api, method, data, cb });
    this._process();
  }

  _process() {

    // Return out if no jobs to process
    if (this._stack.length === 0) return;

    // Check if any open connection can grab first from stack
    const availableConns = this._Connections.filter((conn) => !conn.isProcessing);
    if (availableConns.length == 0) return;

    //  process data
    const processData = this._stack.shift();

    // first available connection
    const connection = availableConns[0];
    this._Connections[connection.id].isProcessing = true;

    Logger.debug(`#${connection.id} - Running method: ${processData.method} on module: ${processData.data.module}`);
    Logger.silly(`#${connection.id} - Processing: ${JSON.stringify(processData.data)}`);

    ZCRMRestClient.API[processData.api][processData.method](processData.data).then((response) => {
      //
      Logger.debug(`#${connection.id} - Finished.`);
      this._Connections[connection.id].isProcessing = false;
      this._process();
      //
      return processData.cb(response);
    });
  }

  getConnections() {
    return this._Connections;
  }

  getStack() {
    return this._stack;
  }
};
