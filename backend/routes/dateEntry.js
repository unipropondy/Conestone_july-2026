const express = require("express");
const router = express.Router();
const { poolPromise, sql } = require("../config/db");

router.post("/save-date", async (req, res) => {
  try {
    const { startDate, username } = req.body;
    const pool = await poolPromise;

    await pool.request()
      .input("username", sql.VarChar(100), username || "admin")
      .input("startDate", sql.VarChar, startDate)
      .query(`
        IF EXISTS (SELECT 1 FROM dateentry)
        BEGIN
          UPDATE dateentry
          SET 
            StartDate = @startDate,
            username = @username,
            updateby = @username,
            updatedate = GETDATE()
        END
        ELSE
        BEGIN
          INSERT INTO dateentry (DateEntryId, username, StartDate, Createdby, CreatedDate)
          VALUES (NEWID(), @username, @startDate, @username, GETDATE())
        END
      `);

    res.json({ success: true, message: "Date saved successfully" });
  } catch (err) {
    console.error("Save date error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 🔹 GET Global Date from dateentry
router.get("/get-date", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT TOP 1 StartDate FROM dateentry ORDER BY CreatedDate DESC");
    if (result.recordset.length > 0) {
      res.json({ date: result.recordset[0].StartDate });
    } else {
      res.json({ date: null });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔹 UPDATE Global Date in dateentry (Dayend Operation)
router.post("/delete-date", async (req, res) => {
  try {
    const pool = await poolPromise;
    
    // As requested: just unconditionally update the DateEntry to the next day
    const queryStr = "UPDATE DateEntry SET StartDate = CAST(GETDATE() + 1 AS DATE)";
    
    await pool.request().query(queryStr);

    res.json({ success: true, message: "Date entry updated successfully" });
  } catch (err) {
    console.error("Dayend Close error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
