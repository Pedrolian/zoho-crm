// Parse examples
const DataReplace = require('../utility/DataReplaceString.js');

const test = DataReplace.replace({ "foo": "bar1", "foo2": "bar2" }, `((Subject:equals:$_foo)AND(Contact_Name.name:equals:$_foo2))`);
console.log(test);
