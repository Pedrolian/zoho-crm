module.exports.replace = function (data, keys_obj, flags)
{

  flags = flags || "";
  flags = Array.isArray(flags) ? flags.map(flag => flag.replace("-","").trim()) : flags.split("-").map(flag => flag.trim());

  return new Promise((resolve, reject) =>
  {
    resolve( data.map(row => {
      let return_obj = {};
      Object.keys(keys_obj).map(key => {
        if(row.hasOwnProperty(key) || !flags.includes("c"))
          return_obj = { ...return_obj, [keys_obj[key]]: row[key] };
      });
      return return_obj;
    }) )
  });

}

module.exports.exchange = function (data, keys_obj, flags)
{

  flags = flags || "";
  flags = Array.isArray(flags) ? flags.map(flag => flag.replace("-","").trim()) : flags.split("-").map(flag => flag.trim());

  return data.map(row => {
    let return_obj = {};
    Object.keys(keys_obj).map(key => {
      if(row.hasOwnProperty(key) || !flags.includes("c"))
        return_obj = { ...return_obj, [keys_obj[key]]: row[key] };
    });
    return return_obj;
  });

}
