module.exports.exchange = function (data, keys_obj, flags)
{

  flags = flags || "";
  flags = Array.isArray(flags) ? flags.map(flag => flag.replace("-","").trim()) : flags.split("-").map(flag => flag.trim());

  return data.map(row => {
    let return_obj = !flags.includes("new") ? row : {};
    Object.keys(keys_obj).map(key => {
      if(row.hasOwnProperty(key) || !flags.includes("check"))
      {
        return_obj = { ...return_obj, [keys_obj[key]]: row[key] };
        if(!flags.includes("new") && key !== keys_obj[key])
          delete return_obj[key];
      }
    });
    return return_obj;
  });

}
