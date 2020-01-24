module.exports.parse = function (opt)
{
  let options = opt ? Array.isArray(opt) ? {} : typeof(opt) === "object" ? opt : {[opt]: null} : {};
  if(Array.isArray(opt))
    opt.map(key => { options[key] = null })
  return options;
}
