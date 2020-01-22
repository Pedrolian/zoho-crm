const csv = require('csv-parser');
const fs = require('fs');

const _ = require('lodash');

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
          this.rows.push(_.pick(data, this.file_options.whitelist));
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
