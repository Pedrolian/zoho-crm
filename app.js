require("dotenv").config({ path: "./.env" });

Logger = require("./utility/WinstonLogger.js");
Logger.setPath("./log");

const Stack = require("./class/Stack.js");
const Zoho = require("./class/Zoho");

/*
Zoho.getRecords("Accounts", { headers: { "If-Modified-Since": "2020-05-10T00:00:00-03:00" } }, (error, response, data) => {
  console.log([error, response.length, data]);
})
  .then(() => {
    Logger.info(`Finished fetching all data..`);
  })
  .catch((error) => {
    Logger.error(error);
  });
  */

/* Zoho.searchRecords("Accounts", "(Account_Name:equals:COLEGIO VITRUVIO)", (error, returned_data, chunk_data) => {
  if (error) Logger.error(JSON.stringify(error, null, 2));

  Logger.info(`Returned: ${returned_data.length}`);

  console.timeEnd("App");
}).then(() => {
  console.log(`Search completed`);
}); */

//{"data": [{"CEP": "29146012", "Bairro": "CAMPO GRANDE", "Cidade": "CARIACICA", "E_mail": "politintas_nfe@politintas.com.br", "Estado": "ES", "RG_I_E": "080619592", "CPF_CNPJ": "27171883000159", "Endere_o": "AV MARIO GURGEL, 4119, COM 01, PAV 01/02", "Complemento": "00001", "Data_Cadastro_GIX": "2020-07-01", "C_digo_Cliente_GIX": "1"}], "duplicate_check_fields": ["C_digo_Cliente_GIX"]}

let upsertArray = Array.apply(null, Array(5)).map((x, i) => {
  return { Account_Name: `Teste Wiki Integracao #${i}`, C_digo_Cliente_GIX: i.toString() };
});

Zoho.upsertRecords("Accounts", upsertArray, ["C_digo_Cliente_GIX"], (data) => {
  console.log(data);
});

/*
Zoho.searchRecords(
  "Accounts",
  "(Account_Name:starts_with:$_name)",
  (error, returned_data, chunk_data) => {
    if (error) Logger.error(JSON.stringify(error, null, 2));
    Logger.info(`Returned1: ${returned_data.length}`);
  },
  [{ name: "ESCOLA SUPER" }]
).then(() => {
  console.log(`Search completed 1`);
});
*/
