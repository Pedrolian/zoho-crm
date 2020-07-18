const Logger = require("../utility/WinstonLogger.js");
Logger.setPath("../log");

const ZCRMRestClient = require("zcrmsdk");

module.exports = class Stack {
  constructor(poolSize, maxAttempts, delayAttempt) {
    this.PoolSize = !isNaN(Number(poolSize)) ? poolSize : 5;

    this._maxAttempts = !isNaN(Number(maxAttempts)) ? maxAttempts : 5;
    this._currentAttmept = 0;
    this._delayAttempt = !isNaN(Number(delayAttempt)) ? delayAttempt : 100;

    this._stack = [];
    this._Connections = [];
    for (let i = 0; i < this.PoolSize; i++) {
      this._Connections.push({
        id: i,
        retries: 0,
        processing: false,
      });
    }

    this._process();
  }

  push(api, method, data, cb) {
    this._currentAttmept = 0;
    this._stack.push({ api, method, data, cb });
    this._process();
  }

  _process() {
    // Check if any open connection can grab first from stack
    const availableConns = this._Connections.filter((conn) => !conn.processing);
    if (availableConns.length == 0) return;

    if (availableConns.length == this._Connections.length && this._stack.length === 0) {
      // Check if stack has been empty for awhile
      // Come back in 1 second, and see if still nothing was readded, after n attempts, shut down program.
      this._currentAttmept++;
      Logger.silly(`All connections available, attempts: ${this._currentAttmept} / ${this._maxAttempts}`);
      if (this._currentAttmept < this._maxAttempts) {
        setTimeout(() => {
          this._process();
        }, this._delayAttempt);
      }
      return;
    }

    if (this._stack.length === 0) return;

    //  process data
    const processData = this._stack.shift();

    // first available connection
    const connection = availableConns[0];
    this._Connections[connection.id].processing = true;

    Logger.debug(`#${connection.id} - Running method: ${processData.method} on module: ${processData.data.module}`);

    ZCRMRestClient.API[processData.api][processData.method](processData.data).then((response) => {
      //
      Logger.debug(`#${connection.id} - Finished..`);
      this._currentAttmept = 0;
      this._Connections[connection.id].processing = false;
      this._process();
      //
      return processData.cb(response);
    });
  }

  getConnections() {
    console.table(this._Connections);
  }

  getStack() {
    console.table(this._stack);
  }
};
