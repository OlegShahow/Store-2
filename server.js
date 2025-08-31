// Отлично! Давай сделаем полностью рабочий server.js, который будет:
// Отдавать твои статические файлы(HTML, CSS, JS)
// Подключаться к базе PostgreSQL на Render
// Содержать API / api / cards для получения и сохранения карточек
// Вот готовый код для server.js:

// Отлично, это полностью рабочий server.js для Render. ✅
// Вот что важно:
// Статические файлы — весь проект(HTML, CSS, JS, картинки) отдаётся через express.static.
// PostgreSQL — подключение через pg к базе Render с SSL.
// API / api / cards — теперь можно получать карточки(GET) и сохранять(POST) в централизованной базе.
// Таблица cards создаётся автоматически, если её нет.

// =======================================
// server.js — рабочий для Render PostgreSQL
// =======================================



// =======================================
// server.js — полностью рабочий для Render
// =======================================

const express = require("express");
const path = require("path");
const { Pool } = require("pg");
const multer = require("multer");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// =======================================
// Подключение к базе PostgreSQL на Render
// =======================================
const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
	ssl: { rejectUnauthorized: false },
});

// =======================================
// Middleware
// =======================================
app.use(express.json());
app.use(express.static(path.join(__dirname)));
app.use('/uploadsfoto', express.static(path.join(__dirname, 'uploadsfoto')));

// =======================================
// Создание папки для фото, если нет
// =======================================
const uploadDir = path.join(__dirname, 'uploadsfoto');
if (!fs.existsSync(uploadDir)) {
	fs.mkdirSync(uploadDir);
}

// =======================================
// Настройка Multer для загрузки фото
// =======================================
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, 'uploadsfoto');
	},
	filename: function (req, file, cb) {
		const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
		cb(null, uniqueSuffix + path.extname(file.originalname));
	},
});
const upload = multer({ storage });

// =======================================
// Создание таблицы cards, если нет
// =======================================
async function createTableIfNotExists() {
	try {
		await pool.query(`
      CREATE TABLE IF NOT EXISTS cards (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        price TEXT NOT NULL,
        description TEXT,
        availability TEXT,
        imgSrc TEXT,
        date TEXT
      )
    `);
		console.log("✅ Таблица cards готова");
	} catch (err) {
		console.error("❌ Ошибка при создании таблицы:", err);
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
		console.error("❌ Ошибка при получении карточек:", err);
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
				"INSERT INTO cards (name, price, description, availability, imgSrc, date) VALUES ($1,$2,$3,$4,$5,$6)",
				[c.name, c.price, c.description, c.availability, c.imgSrc, c.date]
			);
		}
		res.json({ status: "ok" });
	} catch (err) {
		console.error("❌ Ошибка при сохранении карточек:", err);
		res.status(500).json({ error: "Ошибка при сохранении карточек" });
	}
});

// =======================================
// API для загрузки фото
// =======================================
app.post("/api/upload", upload.single("photo"), (req, res) => {
	if (!req.file) return res.status(400).json({ error: "Файл не загружен" });
	// Возвращаем путь к файлу для использования в imgSrc
	res.json({ path: `/uploadsfoto/${req.file.filename}` });
});

// =======================================
// Запуск сервера
// =======================================
app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});

