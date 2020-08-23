// Require .env
require("dotenv").config({ path: "../.env" });

const ZohoImport = require("./index");

// Get records
ZohoImport.getRecords("Accounts", {}, (error, response, data) => {
  console.log({ type: "CB", error, response: response[0].id, data });
}).then((response) => {
  console.log(response.length);
});

/* 
ZohoImport.getRecords("Accounts", {}).then(({ error, response, data }) => {
  console.log({ type: "resolve", error, response: response[0].id, data });
}); 
*/
/* 
ZohoImport.getRecords("Accounts", {}, (error, response, data) => {
  console.log({ type: "CB", error, response: response[0].id, data });
}) 
*/
/* 
// get Id
ZohoImport.getId("Accounts", ["4448982000001817050", "4448982000001817051"], (error, response, data) => {
  console.log({ error, response: !error ? response.length : response, data });
}).then((response) => {
  console.log(response);
});

 */
// Search records
/* // Search records
ZohoImport.searchRecords(
  "Accounts",
  "(Account_Name:equals:$_name)AND(Age:equals:$_age)",
  (error, response, data) => {
    console.log(data);
  },
  [
    { name: "Wiki Consultoria", age: 11 },
    { name: "Pedro", age: 29 },
    { name: "Delanno", age: 36 },
  ]
);
 */
/* 
// Upsert records
ZohoImport.upsertRecords("ImportacaoTeste", [{ Name: "Abc" }, { Name: "Bar" }, { foo: "Bar" }], ["Name"], (error, response, data) => {
  // console.log({ error, response, data });
  // console.log({ type: "CB", error, response_success: response.success.length, response_error: response.error.length, data: data });
  console.log(`==CB==`);
  console.log(response.success[0]);
  console.log(`--`);
  console.log(response.error[0]);
  console.log(`==/CB==`);
}).then((response) => {
  console.log({ type: "RESOLVE", response_success: response[0].response.success.length, response_error: response[0].response.error.length, data: response[0].data });
  console.log(response[0].response.success);
  console.log(response[0].response.error);
  // response.map((res) => {
  //   console.log(res.response.success);
  //   console.log(`--`);
  //   console.log(res.response.error);
  // });
});
 */
