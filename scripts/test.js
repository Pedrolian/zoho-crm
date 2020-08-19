const { addColors } = require("winston/lib/winston/config");

// Require .env
require("dotenv").config({ path: "./.env" });

const ZohoImport = require("./index");

/* 
// Get records
ZohoImport.getRecords("Accounts", {}, (error, response, data) => {
  console.log({ type: "CB", error, response: response[0].id, data });
}).then(({ error, response, data }) => {
  console.log({ type: "resolve", error, response: response[0].id, data });
});
 */
/* ZohoImport.getRecords("Accounts", {}).then(({ error, response, data }) => {
  console.log({ type: "resolve", error, response: response[0].id, data });
}); */
/* ZohoImport.getRecords("Accounts", {}, (error, response, data) => {
  console.log({ type: "CB", error, response: response[0].id, data });
}) 
*/

/* 
// get Id
ZohoImport.getId("Accounts", ["4448982000001817050", "4448982000001817051"], (error, response, data) => {
  console.log({ error, response: !error ? response.length : response, data });
}).then(({ error, response }) => {
  console.log({ error, response });
});
 */

// Search records
ZohoImport.searchRecords(
  "Accounts",
  "(Account_Name:equals:$_name)",
  (error, response, data) => {
    // console.log({ type: "CB", error, response: response, data: data });
    // console.log(data);
  },
  [
    { name: "Wiki Consultoria" },
    { name: "Wiki Consultoria 2" },
    { name: "Wiki Consultoria 3" },
    { name: "Wiki Consultoria 4" },
    { name: "Wiki Consultoria 5" },
    { name: "Wiki Consultoria 6" },
    { name: "Wiki Consultoria 7" },
    { name: "Wiki Consultoria 8" },
    { name: "Wiki Consultoria 9" },
    { name: "Wiki Consultoria 10" },
    { name: "Wiki Consultoria 11" },
  ]
).then(({ error, response, data }) => {
  console.log({ type: "resolve", error, response: response.length, data });
  console.log(response[1]);
});
