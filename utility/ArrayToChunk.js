module.exports.make = function (data, chunk_size)
{
  chunk_size = chunk_size || 100;
  data = Array.isArray(data) ? data : [data];
  return Array(Math.ceil(data.length / chunk_size)).fill().map((_, index) => index * chunk_size).map(begin => data.slice(begin, begin + chunk_size))
};
