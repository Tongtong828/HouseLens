import express from "express";
import cors from "cors";
import pool from "./db.js";

const app = express();
app.use(cors());
app.use(express.json());

console.log("DB user =", process.env.DB_USER);
// Get the average price for each borough
app.get("/api/borough-prices", async (req, res, next) => {
    try {
        console.log("📡 /api/borough-prices called");
        const [rows] = await pool.query("SELECT borough, AVG(price) AS avg_price FROM transactions GROUP BY borough");
        console.log("✅ Query success:", rows.length, "rows");
        res.json(rows);
    } catch (err) {
        console.error("❌ Query failed:", err.message);
        next(err); // 把错误交给全局中间件处理
    }
});


// Get the transactions detail
app.get("/api/transactions/:borough", async (req, res) => {
    const borough = req.params.borough;

    try {
        const [rows] = await pool.query(
            `
      SELECT 
        price AS price,
        date AS date,
        street AS street,
        postcode AS postcode,
        property_type AS property_type,
        lat AS latitude,
        lng AS longitude
      FROM transactions
      WHERE UPPER(borough) = UPPER(?)
      ORDER BY date DESC
      LIMIT 300
      `,
            [borough]
        );

        res.json(rows);
    } catch (err) {
        console.error("❌ SQL ERROR in /api/transactions:", err);
        res.status(500).json({ error: "DB query failed" });
    }
});

// ✅ Get all London transactions
app.get("/api/transactions", async (req, res) => {
    try {
        const [rows] = await pool.query(`
      SELECT
        price,
        date,
        street,
        postcode,
        borough,
        property_type,
        lat AS latitude,
        lng AS longitude
      FROM transactions
      ORDER BY date DESC
      LIMIT 3000
    `);
        res.json(rows);
    } catch (err) {
        console.error("❌ SQL ERROR in /api/transactions:", err);
        res.status(500).json({ error: "DB query failed" });
    }
});


app.get("/api/borough-trend/:borough", async (req, res) => {
    const borough = req.params.borough;

    try {
        const [rows] = await pool.query(
            `
      SELECT 
        YEAR(Date) AS year,
        AVG(Price) AS avg_price
      FROM transactions
      WHERE UPPER(borough) = UPPER(?)
      GROUP BY YEAR(Date)
      ORDER BY YEAR(Date)
      `,
            [borough]
        );

        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "DB query failed" });
    }
});


app.listen(3001, () => console.log("✅ Backend running on port 3001"));

// 全局错误处理中间件 —— 放在所有路由定义的最后
app.use((err, req, res, next) => {
    console.error('🔥 ERROR:', err); // 打印错误信息
    res.status(500).json({ error: err.message }); // 返回 JSON 错误
});

