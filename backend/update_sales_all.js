const fs = require('fs');
const file_path = 'routes/sales.js';
let content = fs.readFileSync(file_path, 'utf-8');

const replacement = `router.get("/all", async (req, res) => {
  try {
    res.set("Cache-Control", "no-store");
    const pool = await poolPromise;
    const { startDate, endDate } = req.query;

    const isDateOrDateTimeStr = (str) => {
      if (typeof str !== "string") return false;
      if (/^\\d{4}-\\d{2}-\\d{2}$/.test(str)) return true;
      if (/^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}$/.test(str)) return true;
      if (/^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}$/.test(str)) return true;
      return false;
    };
    const useRange = isDateOrDateTimeStr(startDate) && isDateOrDateTimeStr(endDate);

    let queryStr = "";
    if (useRange) {
      const shWhere = getReportDateWhereSqlForRange(startDate, endDate, "ISNULL(sh.Start_Date, sh.LastSettlementDate)");
      const cctWhere = getReportDateWhereSqlForRange(startDate, endDate, "ISNULL(cct.CreatedDate, cct.CreatedDate)");
      queryStr = \`
        SELECT * FROM (
          SELECT 
            sh.SettlementID, 
            DATEADD(MINUTE, -480, sh.LastSettlementDate) AS SettlementDate, 
            sh.BillNo AS OrderId, 
            sh.OrderType,
            sh.TableNo, 
            sh.Section, 
            sh.CashierId, 
            sh.BillNo, 
            sh.SER_NAME,
            \${normalizeReportPayModeSql("sts.PayMode")} as PayMode,
            ISNULL(sts.SysAmount, sh.SysAmount) as SysAmount,
            ISNULL(sts.ManualAmount, sh.ManualAmount) as ManualAmount,
            sh.SubTotal as SubTotal,
            ISNULL(sh.DiscountAmount, 0) as DiscountAmount,
            sh.DiscountType as DiscountType,
            ISNULL(sh.ServiceCharge, 0) as ServiceCharge,
            ISNULL(sh.TotalTax, 0) as TotalTax,
            ISNULL(sts.ReceiptCount, 0) as ReceiptCount,
            ISNULL(sh.VoidItemQty, 0) as VoidQty,
            ISNULL(sh.VoidItemAmount, 0) as VoidAmount,
            sh.IsCancelled,
            sh.CancellationReason,
            DATEADD(MINUTE, -480, sh.CancelledDate) as CancelledDate,
            sh.CancelledByUserName,
            ri.OrderId AS MasterOrderId,
            ISNULL(ri.TotalDiscountAmount, 0) as TotalDiscountAmount,
            ISNULL(ri.TotalLineItemDiscountAmount, 0) as TotalLineItemDiscountAmount,
            sh.RoundedBy as RoundedBy,
            ISNULL(ri.DiscountPercentage, 0) as DiscountPercentage,
            ISNULL(cct_sale.OutstandingAmount, 0) AS OutstandingAmount,
            COALESCE(mm.Name, ccm.Name, mm_sale.Name, ccm_sale.Name) AS CustomerName,
            sh.GuestName as GuestName,
            sh.Pax as Pax
          FROM SettlementHeader sh
          LEFT JOIN SettlementTotalSales sts ON sh.SettlementID = sts.SettlementID
          LEFT JOIN RestaurantInvoice ri ON sh.SettlementID = ri.RestaurantBillId
          LEFT JOIN CustomerCreditTransactions cct_sale ON sh.SettlementID = cct_sale.SettlementId AND cct_sale.TransactionType = 'CREDIT_SALE'
          LEFT JOIN MemberMaster mm ON sh.MemberId = mm.MemberId
          LEFT JOIN CreditCustomerMaster ccm ON sh.MemberId = ccm.CustomerId
          LEFT JOIN MemberMaster mm_sale ON cct_sale.MemberId = mm_sale.MemberId
          LEFT JOIN CreditCustomerMaster ccm_sale ON cct_sale.MemberId = ccm_sale.CustomerId
          WHERE \${shWhere}

          UNION ALL

          SELECT 
            cct.TransactionId AS SettlementID,
            DATEADD(MINUTE, -480, cct.CreatedDate) AS SettlementDate,
            CASE WHEN mm.MemberId IS NOT NULL THEN 'Member Payment Collected' ELSE 'Credit Payment Collected' END AS OrderId,
            'LEDGER' AS OrderType,
            'LEDGER' AS TableNo,
            COALESCE(mm.Name, m.Name, 'Customer') AS Section,
            CAST(cct.CreatedBy AS VARCHAR(50)) AS CashierId,
            cct.Remarks AS BillNo,
            'Cashier' AS SER_NAME,
            cct.PaymentMethod AS PayMode,
            cct.PaidAmount AS SysAmount,
            cct.PaidAmount AS ManualAmount,
            cct.PaidAmount AS SubTotal,
            0 AS DiscountAmount,
            NULL AS DiscountType,
            0 AS ServiceCharge,
            0 AS TotalTax,
            1 AS ReceiptCount,
            0 AS VoidQty,
            0 AS VoidAmount,
            0 AS IsCancelled,
            NULL AS CancellationReason,
            NULL AS CancelledDate,
            NULL AS CancelledByUserName,
            NULL AS MasterOrderId,
            0 AS TotalDiscountAmount,
            0 AS TotalLineItemDiscountAmount,
            0 AS RoundedBy,
            0 AS DiscountPercentage,
            0 AS OutstandingAmount,
            COALESCE(mm.Name, m.Name) AS CustomerName,
            NULL AS GuestName,
            NULL AS Pax
          FROM CustomerCreditTransactions cct
          LEFT JOIN CreditCustomerMaster m ON cct.MemberId = m.CustomerId
          LEFT JOIN MemberMaster mm ON cct.MemberId = mm.MemberId
          WHERE cct.TransactionType = 'PAYMENT' AND \${cctWhere}
        ) CombinedSales
        ORDER BY SettlementDate DESC
      \`;
    } else {
      queryStr = \`
        SELECT TOP 200 * FROM (
          SELECT 
            sh.SettlementID, 
            DATEADD(MINUTE, -480, sh.LastSettlementDate) AS SettlementDate, 
            sh.BillNo AS OrderId, 
            sh.OrderType,
            sh.TableNo, 
            sh.Section, 
            sh.CashierId, 
            sh.BillNo, 
            sh.SER_NAME,
            \${normalizeReportPayModeSql("sts.PayMode")} as PayMode,
            ISNULL(sts.SysAmount, sh.SysAmount) as SysAmount,
            ISNULL(sts.ManualAmount, sh.ManualAmount) as ManualAmount,
            sh.SubTotal as SubTotal,
            ISNULL(sh.DiscountAmount, 0) as DiscountAmount,
            sh.DiscountType as DiscountType,
            ISNULL(sh.ServiceCharge, 0) as ServiceCharge,
            ISNULL(sh.TotalTax, 0) as TotalTax,
            ISNULL(sts.ReceiptCount, 0) as ReceiptCount,
            ISNULL(sh.VoidItemQty, 0) as VoidQty,
            ISNULL(sh.VoidItemAmount, 0) as VoidAmount,
            sh.IsCancelled,
            sh.CancellationReason,
            DATEADD(MINUTE, -480, sh.CancelledDate) as CancelledDate,
            sh.CancelledByUserName,
            ri.OrderId AS MasterOrderId,
            ISNULL(ri.TotalDiscountAmount, 0) as TotalDiscountAmount,
            ISNULL(ri.TotalLineItemDiscountAmount, 0) as TotalLineItemDiscountAmount,
            sh.RoundedBy as RoundedBy,
            ISNULL(ri.DiscountPercentage, 0) as DiscountPercentage,
            ISNULL(cct_sale.OutstandingAmount, 0) AS OutstandingAmount,
            COALESCE(mm.Name, ccm.Name, mm_sale.Name, ccm_sale.Name) AS CustomerName,
            sh.GuestName as GuestName,
            sh.Pax as Pax
          FROM SettlementHeader sh
          LEFT JOIN SettlementTotalSales sts ON sh.SettlementID = sts.SettlementID
          LEFT JOIN RestaurantInvoice ri ON sh.SettlementID = ri.RestaurantBillId
          LEFT JOIN CustomerCreditTransactions cct_sale ON sh.SettlementID = cct_sale.SettlementId AND cct_sale.TransactionType = 'CREDIT_SALE'
          LEFT JOIN MemberMaster mm ON sh.MemberId = mm.MemberId
          LEFT JOIN CreditCustomerMaster ccm ON sh.MemberId = ccm.CustomerId
          LEFT JOIN MemberMaster mm_sale ON cct_sale.MemberId = mm_sale.MemberId
          LEFT JOIN CreditCustomerMaster ccm_sale ON cct_sale.MemberId = ccm_sale.CustomerId

          UNION ALL

          SELECT 
            cct.TransactionId AS SettlementID,
            DATEADD(MINUTE, -480, cct.CreatedDate) AS SettlementDate,
            CASE WHEN mm.MemberId IS NOT NULL THEN 'Member Payment Collected' ELSE 'Credit Payment Collected' END AS OrderId,
            'LEDGER' AS OrderType,
            'LEDGER' AS TableNo,
            COALESCE(mm.Name, m.Name, 'Customer') AS Section,
            CAST(cct.CreatedBy AS VARCHAR(50)) AS CashierId,
            cct.Remarks AS BillNo,
            'Cashier' AS SER_NAME,
            cct.PaymentMethod AS PayMode,
            cct.PaidAmount AS SysAmount,
            cct.PaidAmount AS ManualAmount,
            cct.PaidAmount AS SubTotal,
            0 AS DiscountAmount,
            NULL AS DiscountType,
            0 AS ServiceCharge,
            0 AS TotalTax,
            1 AS ReceiptCount,
            0 AS VoidQty,
            0 AS VoidAmount,
            0 AS IsCancelled,
            NULL AS CancellationReason,
            NULL AS CancelledDate,
            NULL AS CancelledByUserName,
            NULL AS MasterOrderId,
            0 AS TotalDiscountAmount,
            0 AS TotalLineItemDiscountAmount,
            0 AS RoundedBy,
            0 AS DiscountPercentage,
            0 AS OutstandingAmount,
            COALESCE(mm.Name, m.Name) AS CustomerName,
            NULL AS GuestName,
            NULL AS Pax
          FROM CustomerCreditTransactions cct
          LEFT JOIN CreditCustomerMaster m ON cct.MemberId = m.CustomerId
          LEFT JOIN MemberMaster mm ON cct.MemberId = mm.MemberId
          WHERE cct.TransactionType = 'PAYMENT'
        ) CombinedSales
        ORDER BY SettlementDate DESC
      \`;
    }

    const result = await pool.request().query(queryStr);
    const records = result.recordset || [];
    let finalRecords = [];
    if (records.length > 0) {
      const masterOrderIds = records
        .map(r => r.MasterOrderId)
        .filter(id => id && id.length > 30);

      const mergeMap = {};
      if (masterOrderIds.length > 0) {
        try {
          const formattedIds = masterOrderIds.map(id => \`'\${id}'\`).join(',');
          const mergeResult = await pool.request().query(\`
            SELECT 
              omh.ParentOrderId, 
              omh.ChildTableNo,
              COALESCE(ro.OrderNumber, ro_cur.OrderNumber) AS ChildOrderNo
            FROM OrderMergeHistory omh
            LEFT JOIN RestaurantOrder ro ON omh.ChildOrderId = ro.OrderId
            LEFT JOIN RestaurantOrderCur ro_cur ON omh.ChildOrderId = ro_cur.OrderId
            WHERE omh.ParentOrderId IN (\${formattedIds})
          \`);

          mergeResult.recordset.forEach(row => {
            const parentId = String(row.ParentOrderId).toLowerCase();
            const childTable = String(row.ChildTableNo || "").trim();
            const childOrder = String(row.ChildOrderNo || "").trim();
            const displayStr = childTable ? \`T\${childTable}\${childOrder ? \` [#\${childOrder}]\` : ""}\` : childOrder;
            if (displayStr) {
              if (!mergeMap[parentId]) mergeMap[parentId] = [];
              mergeMap[parentId].push(displayStr);
            }
          });
        } catch (mergeErr) {
          console.error("⚠️ [Report API] Failed to fetch merge history details:", mergeErr.message);
        }
      }

      // Group split payment transactions under the same SettlementID
      const groups = {};
      records.forEach(row => {
        if (!row.SettlementID) return;
        if (!groups[row.SettlementID]) {
          groups[row.SettlementID] = [];
        }
        groups[row.SettlementID].push(row);
      });

      records.forEach(row => {
        const parentId = row.MasterOrderId ? String(row.MasterOrderId).toLowerCase() : null;

        // 1. Merge details
        if (parentId && mergeMap[parentId]) {
          row.isMerged = true;
          row.mergedDetails = [...new Set(mergeMap[parentId])].join(', ');
        } else {
          row.isMerged = false;
          row.mergedDetails = "";
        }

        // 2. Split details
        const group = groups[row.SettlementID];
        if (group && group.length > 1) {
          // It's a split payment!
          const index = group.indexOf(row);
          if (index === 0) {
            row.isSplit = false;
            row.splitNo = "";
            finalRecords.push(row);
          } else {
            const suffix = \`-S\${index}\`;
            const newRow = {
              ...row,
              SettlementID: \`\${row.SettlementID}-\${index}\`,
              OrderId: \`\${row.OrderId}\${suffix}\`,
              BillNo: \`\${row.BillNo}\${suffix}\`,
              isSplit: true,
              splitNo: \`S\${index}\`
            };
            finalRecords.push(newRow);
          }
        } else {
          // Standard check for split by item that already has suffix
          if (row.BillNo && row.BillNo.includes('-S')) {
            row.isSplit = true;
            row.splitNo = 'S' + row.BillNo.split('-S').pop();
          } else {
            row.isSplit = false;
            row.splitNo = "";
          }
          finalRecords.push(row);
        }
      });
    }

    res.json(finalRecords);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});`;

const startIdx = content.indexOf('router.get("/all", async (req, res) => {');
const endIdx = content.indexOf('router.get("/transactions", async (req, res) => {');

if (startIdx !== -1 && endIdx !== -1) {
    content = content.substring(0, startIdx) + replacement + '\n\n' + content.substring(endIdx);
    fs.writeFileSync(file_path, content, 'utf-8');
    console.log('Successfully updated /all route!');
} else {
    console.log('Failed to find start or end index.');
}
