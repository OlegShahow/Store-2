// Отлично! Давай сделаем полностью рабочий server.js, который будет:
// Отдавать твои статические файлы(HTML, CSS, JS)
// Подключаться к базе PostgreSQL на Render
// Содержать API / api / cards для получения и сохранения карточек
// Вот готовый код для server.js:



// =======================================
// server.js — рабочий с Render PostgreSQL
// =======================================

const express = require("express");
const path = require("path");
const { Pool } = require("pg");
const app = express();
const PORT = process.env.PORT || 3000;

// =======================================
// Подключение к базе PostgreSQL на Render
// =======================================
const pool = new Pool({
	connectionString: process.env.DATABASE_URL || "postgresql://my_online_store_db_3azz_user:ZHMRtsPt7zs4lVvk6ypLSfgv6y06p9FS@dpg-d2q207adbo4c73bntt80-a.oregon-postgres.render.com/my_online_store_db_3azz",
	ssl: { rejectUnauthorized: false }
});

// =======================================
// Middleware
// =======================================
app.use(express.json()); // для работы с JSON
app.use(express.static(path.join(__dirname))); // отдаём все файлы проекта

// =======================================
// Создание таблицы cards, если её нет
// =======================================
async function createTableIfNotExists() {
	try {
		await pool.query(`
      CREATE TABLE IF NOT EXISTS cards (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        price TEXT NOT NULL,
        desc TEXT,
        availability TEXT,
        imgSrc TEXT,
        date TEXT
      )
    `);
		console.log("Таблица cards готова");
	} catch (err) {
		console.error("Ошибка при создании таблицы:", err);
	}
}
createTableIfNotExists();

// =======================================
// API для карточек
// =======================================

// Получить все карточки
app.get("/api/cards", async (req, res) => {
	try {
		const { rows } = await pool.query("SELECT * FROM cards ORDER BY id ASC");
		res.json(rows);
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Ошибка при получении карточек" });
	}
});

// Сохранить карточки (перезаписать)
app.post("/api/cards", async (req, res) => {
	const cards = req.body;
	try {
		await pool.query("TRUNCATE cards");
		for (const c of cards) {
			await pool.query(
				"INSERT INTO cards (name, price, desc, availability, imgSrc, date) VALUES ($1,$2,$3,$4,$5,$6)",
				[c.name, c.price, c.desc, c.availability, c.imgSrc, c.date]
			);
		}
		res.json({ status: "ok" });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Ошибка при сохранении карточек" });
	}
});

// =======================================
// Запуск сервера
// =======================================
app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});
