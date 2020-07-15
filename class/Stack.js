const Stack = require("./StackClass.js");

module.exports = new Stack(process.env.ZOHO_POOL ? process.env.ZOHO_POOL : 5);
