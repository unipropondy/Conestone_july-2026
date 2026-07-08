const sql = require("mssql");
const { poolPromise } = require("../config/db.js");

async function run() {
  try {
    const pool = await poolPromise;
    
    console.log("=== PrintMaster configurations ===");
    const printMaster = await pool.request().query("SELECT PrinterId, PrinterName, PrinterType, PrinterIP, KitchenTypeValue, IsActive FROM PrintMaster");
    console.log(printMaster.recordset);

    console.log("=== Latest 10 jobs in PrintJobQueue ===");
    const queue = await pool.request().query("SELECT TOP 10 JobId, PrinterName, PrinterIp, Status, ErrorMessage, CreatedOn FROM PrintJobQueue ORDER BY CreatedOn DESC");
    console.log(queue.recordset);
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
