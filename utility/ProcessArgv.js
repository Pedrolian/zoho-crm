let args = {};
process.argv
  .slice(2)
  .map((arg) => arg.slice(2).split("="))
  .map((arg) => (args[arg[0]] = arg.length > 1 ? arg.slice(1).join(" ") : true));

module.exports = args;
