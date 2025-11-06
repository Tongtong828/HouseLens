// server.js
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import pool from "./db.js";

// 获取当前文件路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// ✅ 托管前端静态文件（前端网页放在 Front 文件夹中）
app.use(express.static(path.join(__dirname, "Front")));

// ✅ 首页（防止 “Cannot GET /”）
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "Front", "Homepage.html"));
});

// ======================== API 路由 ========================

// 1️⃣ 获取各行政区平均房价
app.get("/api/borough-prices", async (req, res, next) => {
    try {
        console.log("📡 /api/borough-prices called");
        const [rows] = await pool.query(
            "SELECT borough, AVG(price) AS avg_price FROM transactions GROUP BY borough"
        );
        console.log("✅ Query success:", rows.length, "rows");
        res.json(rows);
    } catch (err) {
        console.error("❌ Query failed:", err.message);
        next(err);
    }
});

// 2️⃣ 获取某个行政区的详细交易记录
app.get("/api/transactions/:borough", async (req, res, next) => {
    const borough = req.params.borough;
    try {
        const [rows] = await pool.query(
            `
      SELECT 
        price,
        date,
        street,
        postcode,
        property_type,
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
        console.error("❌ SQL ERROR in /api/transactions/:borough:", err);
        next(err);
    }
});

// 3️⃣ 获取最近 3000 条伦敦交易记录
app.get("/api/transactions", async (req, res, next) => {
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
        next(err);
    }
});

// 4️⃣ 获取 Borough 年度平均价格趋势
app.get("/api/borough-trend/:borough", async (req, res, next) => {
    const borough = req.params.borough;
    try {
        const [rows] = await pool.query(
            `
      SELECT 
        YEAR(date) AS year,
        AVG(price) AS avg_price
      FROM transactions
      WHERE UPPER(borough) = UPPER(?)
      GROUP BY YEAR(date)
      ORDER BY YEAR(date)
      `,
            [borough]
        );
        res.json(rows);
    } catch (err) {
        console.error("❌ SQL ERROR in /api/borough-trend:", err);
        next(err);
    }
});

// ======================== 全局错误处理 ========================
app.use((err, req, res, next) => {
    console.error("🔥 ERROR:", err.message);
    res.status(500).json({ error: err.message });
});

// ======================== 启动服务器 ========================
const PORT = 3001;
app.listen(PORT, () => {
    console.log(`✅ Backend running on http://localhost:${PORT}`);
});
