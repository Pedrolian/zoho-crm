const removeDiacritics = require('./RemoveDiactric.js');

const cleanCriteria = (val) => encodeURIComponent(val.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/(?=[(),])/g, '\\').replace(/\(/g, "%28").replace(/\)/g, "%29"))

module.exports.replace = function (data, str, skipDiacritics) {
  skipDiacritics = skipDiacritics || false;
  let tmpStr = str;
  if(str.match(/\$_(\w+)/g) != null)
  {
    str.match(/\$_(\w+)/g).map(key => {
      tmpStr = tmpStr.replace(key, cleanCriteria(data[key.replace("$_", "")]));
    });
  }
  return skipDiacritics ? tmpStr : removeDiacritics.replace(tmpStr);
}
