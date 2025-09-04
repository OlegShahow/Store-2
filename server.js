

const express = require("express");
const path = require("path");
const { Pool } = require("pg");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cors = require("cors");

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

const upload = multer({
	storage: storage,
	fileFilter: (req, file, cb) => {
		if (file.mimetype.startsWith('image/')) {
			cb(null, true);
		} else {
			cb(new Error('Можно загружать только изображения!'), false);
		}
	},
	limits: {
		fileSize: 5 * 1024 * 1024
	}
});

// =======================================
// Middleware
// =======================================
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname)));

// Обработчик ошибок Multer
app.use((error, req, res, next) => {
	if (error instanceof multer.MulterError) {
		if (error.code === 'LIMIT_FILE_SIZE') {
			return res.status(400).json({ error: 'Файл слишком большой (макс. 5MB)' });
		}
	}
	next(error);
});

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
// Очистка битых карточек (ВРЕМЕННЫЙ ЭНДПОИНТ)
// =======================================
app.delete('/api/cards/clean', async (req, res) => {
	try {
		const result = await pool.query(
			"DELETE FROM cards WHERE name IS NULL OR name = '' OR price IS NULL OR price = ''"
		);
		console.log(`🗑️ Удалено ${result.rowCount} битых карточек`);
		res.json({ deleted: result.rowCount });
	} catch (err) {
		console.error("❌ Ошибка при очистке:", err);
		res.status(500).json({ error: "Ошибка очистки" });
	}
});

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

// Сохранение ВСЕХ карточек (как ожидает фронтенд)
app.post("/api/cards", async (req, res) => {
	const cards = req.body;

	console.log("📦 Получено карточек для сохранения:", cards.length);

	// Валидация
	if (!Array.isArray(cards)) {
		return res.status(400).json({ error: "Ожидается массив карточек" });
	}

	// Фильтруем битые карточки
	const validCards = cards.filter(card =>
		card &&
		card.name &&
		card.name.toString().trim() !== '' &&
		card.price &&
		card.price.toString().trim() !== ''
	);

	if (validCards.length !== cards.length) {
		console.warn(`⚠️  Отфильтровано ${cards.length - validCards.length} битых карточек`);
	}

	const client = await pool.connect();

	try {
		await client.query('BEGIN');

		// Очищаем таблицу
		await client.query("TRUNCATE cards");

		// Вставляем только валидные карточки
		for (const card of validCards) {
			await client.query(
				"INSERT INTO cards (name, price, description, availability, imgSrc, date) VALUES ($1,$2,$3,$4,$5,$6)",
				[
					card.name.toString().trim(),
					card.price.toString().trim(),
					card.description?.toString().trim() || '',
					card.availability?.toString().trim() || 'В наличии',
					card.imgSrc?.toString().trim() || '',
					card.date?.toString().trim() || new Date().toISOString().split('T')[0]
				]
			);
		}

		await client.query('COMMIT');
		console.log(`✅ Сохранено ${validCards.length} валидных карточек`);
		res.json({ status: "ok", saved: validCards.length });

	} catch (err) {
		await client.query('ROLLBACK');
		console.error("❌ Ошибка при сохранении карточек:", err);
		res.status(500).json({ error: "Ошибка при сохранении карточек" });
	} finally {
		client.release();
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
			console.error("❌ Файл не дошёл до сервера");
			return res.status(400).json({ error: "Файл не загружен" });
		}

		console.log("✅ Файл получен сервером:", req.file.originalname);
		console.log("✅ URL файла Cloudinary:", req.file.path);

		res.json({ url: req.file.path });

	} catch (err) {
		console.error("❌ Ошибка при обработке файла:", err);
		res.status(500).json({
			error: "Ошибка при загрузке фото",
			message: err.message
		});
	}
});

// =======================================
// Запуск сервера
// =======================================
app.listen(PORT, () => {
	console.log(`🚀 Server is running on port ${PORT}`);
});

// =======================================
// Грейсфул шатдаун
// =======================================
process.on('SIGINT', async () => {
	console.log('\n🔻 Завершение работы...');
	await pool.end();
	process.exit(0);
});



