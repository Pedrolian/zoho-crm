const csv = require('csv-parser');
const fs = require('fs');

module.exports = class CSV {

  constructor(file, options) {
    this.file = file;
    this.file_options = options != undefined ? options : {};
    this.rows = [];
  }

  ParseFile() {
    this.rows = [];
    return new Promise((resolve, reject) =>
    {
      fs.createReadStream(this.file)
      .pipe(csv(this.file_options))
      .on('data', (data) => {
        if(this.file_options.hasOwnProperty("whitelist"))
        {
          let return_obj = {};
          this.file_options.whitelist.map(key => {
            return_obj = { ...return_obj, [key]: data[key] };
          });
          this.rows.push(return_obj);
        }
        else
          this.rows.push(data);
      })
      .on('end', () => {
        resolve(this.rows);
      });
    });
  }

}
