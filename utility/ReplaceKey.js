toOptions = require('./ToOptions.js');

module.exports.exchange = function (data, keys_obj, options)
{

  options = toOptions.parse(options);

  return data.map(row => {
    let return_obj = !options.hasOwnProperty("new") ? row : {};
    Object.keys(keys_obj).map(key => {
      if(row.hasOwnProperty(key) || !options.hasOwnProperty("check"))
      {
        return_obj = { ...return_obj, [keys_obj[key]]: row[key] };
        if(!options.hasOwnProperty("new") && key !== keys_obj[key])
          delete return_obj[key];
      }
    });
    return return_obj;
  });

}
