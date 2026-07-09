const { sql, poolPromise } = require('./config/db');
async function addColumn() {
  try {
    const pool = await poolPromise;
    await pool.request().query('ALTER TABLE OpeningCashDenomination ADD ScreenType VARCHAR(50)');
    console.log('Added ScreenType');
  } catch (err) {
    console.log('Error:', err.message);
  } finally {
    process.exit();
  }
}
addColumn();
