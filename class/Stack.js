const Stack = require("./StackClass.js");

module.exports = new Stack(
  process.env.STACK_POOL_SIZE ? process.env.STACK_POOL_SIZE : 5,
  process.env.STACK_MAX_ATTEMPTS ? process.env.STACK_MAX_ATTEMPTS : 10,
  process.env.STACK_DELAY ? process.env.STACK_DELAY : 100
);
