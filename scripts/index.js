// Require .env
require("dotenv").config({ path: "../.env" });

// Initiate logs
Logger = require("../utility/WinstonLogger.js");
Logger.setPath("../log");

// Initiate Stack Class
const StackClass = require("../class/StackClass.js");
const Stack = new StackClass(
  process.env.STACK_POOL_SIZE ? process.env.STACK_POOL_SIZE : 5,
  process.env.STACK_MAX_ATTEMPTS ? process.env.STACK_MAX_ATTEMPTS : 10,
  process.env.STACK_DELAY ? process.env.STACK_DELAY : 100
);

// Initiate Zoho Class
const Zoho = require("../class/ZohoClass.js");
module.exports = new Zoho(Stack);
