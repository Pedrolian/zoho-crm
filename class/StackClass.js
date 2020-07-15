const Logger = require("../utility/WinstonLogger.js");
Logger.setPath("../log");

const ZCRMRestClient = require("zcrmsdk");

module.exports = class Stack {
  constructor(poolSize) {
    //console.log(`Constructor for Stack called...`);
    this.PoolSize = !isNaN(Number(poolSize)) ? poolSize : 5;
    this.timeOutDelay = 100;
    this._Stack = [];
    this._StackMaxAttempts = 2;

    this._Connections = [];
    for (let i = 0; i < this.PoolSize; i++) {
      this._Connections.push({
        id: i,
        timer: setTimeout(() => {
          this.Stack(i);
        }, this.timeOutDelay),
        retries: 0,
        processing: false,
      });
    }
  }

  StackPush(api, method, data, cb) {
    this._Stack.push({ api, method, data, cb });
  }

  Stack(connectionId) {
    const tmpConnection = this._Connections[connectionId];
    clearTimeout(this._Connections[connectionId].timer);
    this._Connections[connectionId].timer = null;

    if (tmpConnection.retries >= this._StackMaxAttempts) {
      const checkOpenConnections = this._Connections.filter((conn) => {
        return conn.processing;
      });
      if (!checkOpenConnections.length) return;
      else {
        Logger.silly(`#${connectionId} Complete stack reset.`);
        tmpConnection.retries = 0;
      }
    }

    if (this._Stack.length == 0) {
      tmpConnection.retries++;
      setTimeout(() => {
        this.Stack(connectionId);
      }, this.timeOutDelay);
      return;
    } else {
      tmpConnection.processing = true;

      const tmpStack = this._Stack.shift();

      Logger.silly(`#${connectionId} - Running method: ${tmpStack.method} on module: ${tmpStack.data.module}`);

      ZCRMRestClient.API[tmpStack.api][tmpStack.method](tmpStack.data).then((response) => {
        Logger.silly(`#${connectionId} Stack reset.`);
        tmpConnection.processing = false;
        tmpConnection.retries = 0;
        tmpConnection.timer = setTimeout(() => {
          this.Stack(tmpConnection.id);
        }, this.timeOutDelay);

        return tmpStack.cb(response);
      });
    }
  }
};
