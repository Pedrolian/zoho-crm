// Parse examples
const DataReplace = require('../utility/DataReplaceString.js');

const test = DataReplace.replace({ "foo": "bar1" }, `(Subject:equals:$_foo)`);
console.log(test);
