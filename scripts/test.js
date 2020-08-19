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

/* 
// Search records
ZohoImport.searchRecords(
  "Accounts",
  "(Account_Name:equals:$_name)",
  (error, response, data) => {
    // console.log({ type: "CB", error, response: response, data: data });
    console.log(response);
  },
  [{ name: "Wiki Consultoria" }]
).then(({ error, response, data }) => {
  console.log({ type: "resolve", error, response: response.length, data });
  console.log(response[1]);
}); 
*/

/* 
// Upsert records
ZohoImport.upsertRecords("ImportacaoTeste", [{ Name: "Abc" }], "", (error, response, data) => {
  // console.log({ error, response, data });
  console.log({ type: "CB", error, response_success: response.success.length, response_error: response.error.length, data: data });
}).then(({ error, response, data }) => {
  console.log({ type: "RESOLVE", error, response_success: response[0].response.success.length, response_error: response[0].response.error.length, data: data });
}); */
