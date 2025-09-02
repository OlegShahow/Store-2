


const express = require("express");
const path = require("path");
const { Pool } = require("pg");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const app = express();
const PORT = process.env.PORT || 3000;

// =======================================
// Подключение к базе PostgreSQL (Render)
// =======================================
const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
	ssl: { rejectUnauthorized: false },
});

// Проверка подключения к базе
pool.connect()
	.then(() => console.log("✅ Подключение к базе PostgreSQL успешно"))
	.catch(err => console.error("❌ Ошибка подключения к базе PostgreSQL:", err));

// =======================================
// Настройка Cloudinary
// =======================================
cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

// =======================================
// Логирование Cloudinary config
// =======================================
console.log("🔑 Cloudinary config:");
console.log("cloud_name:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("api_key:", process.env.CLOUDINARY_API_KEY ? "OK" : "MISSING");
console.log("api_secret:", process.env.CLOUDINARY_API_SECRET ? "OK" : "MISSING");

// =======================================
// Настройка Multer + Cloudinary
// =======================================
const storage = new CloudinaryStorage({
	cloudinary,
	params: {
		folder: "my-online-store",
		allowed_formats: ["jpg", "jpeg", "png", "gif"],
	},
});
const upload = multer({ storage });

// =======================================
// Middleware
// =======================================
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// =======================================
// Создание таблицы cards (если её нет)
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

// Получение всех карточек
app.get("/api/cards", async (req, res) => {
	try {
		const { rows } = await pool.query("SELECT * FROM cards ORDER BY id ASC");
		res.json(rows);
	} catch (err) {
		console.error("❌ Ошибка при получении карточек:", err);
		res.status(500).json({ error: "Ошибка при получении карточек" });
	}
});

// Добавление новой карточки
app.post("/api/cards", async (req, res) => {
	const { name, price, description, availability, imgSrc, date } = req.body;

	try {
		const result = await pool.query(
			"INSERT INTO cards (name, price, description, availability, imgSrc, date) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *",
			[name, price, description, availability, imgSrc, date]
		);
		console.log("✅ Добавлена карточка:", result.rows[0]);
		res.json(result.rows[0]);
	} catch (err) {
		console.error("❌ Ошибка при добавлении карточки:", err);
		res.status(500).json({ error: "Ошибка при добавлении карточки" });
	}
});

// Удаление карточки
app.delete("/api/cards/:id", async (req, res) => {
	const { id } = req.params;
	try {
		await pool.query("DELETE FROM cards WHERE id=$1", [id]);
		console.log(`🗑 Удалена карточка id=${id}`);
		res.json({ status: "deleted" });
	} catch (err) {
		console.error("❌ Ошибка при удалении карточки:", err);
		res.status(500).json({ error: "Ошибка при удалении карточки" });
	}
});

// Обновление статуса карточки
app.patch("/api/cards/:id/status", async (req, res) => {
	const { id } = req.params;
	const { availability } = req.body;
	try {
		const result = await pool.query(
			"UPDATE cards SET availability=$1 WHERE id=$2 RETURNING *",
			[availability, id]
		);
		console.log(`♻️ Обновлён статус карточки id=${id}`);
		res.json(result.rows[0]);
	} catch (err) {
		console.error("❌ Ошибка при обновлении карточки:", err);
		res.status(500).json({ error: "Ошибка при обновлении карточки" });
	}
});

// =======================================
// API для загрузки фото на Cloudinary
// =======================================
app.post("/api/upload", upload.single("photo"), async (req, res) => {
	console.log("📌 Новый запрос на /api/upload");

	try {
		if (!req.file) {
			console.error("❌ Файл не дошёл до сервера. req.file:", req.file);
			return res.status(400).json({ error: "Файл не загружен" });
		}

		console.log("✅ Файл получен сервером:", req.file.originalname);
		console.log("✅ URL файла Cloudinary:", req.file.path);

		// Отправка корректного JSON клиенту
		res.json({ url: req.file.path });

	} catch (err) {
		console.error("❌ Ошибка при обработке файла:", err);
		res.status(500).json({
			error: "Ошибка при загрузке фото",
			message: err.message,
			stack: err.stack,
		});
	}
});

// =======================================
// Запуск сервера
// =======================================
app.listen(PORT, () => {
	console.log(`🚀 Server is running on port ${PORT}`);
});




