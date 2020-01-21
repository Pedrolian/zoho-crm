const removeDiacritics = require('./RemoveDiactric.js');

module.exports.replace = function (data, str) {
  let tmpStr = str;
  if(str.match(/\$(\w+)/g) != null)
  {
    str.match(/\$(\w+)/g).map(key => {
      tmpStr = tmpStr.replace(key, data[key.replace("$_", "")]);
    });
  }
  return removeDiacritics.replace(tmpStr);
}
