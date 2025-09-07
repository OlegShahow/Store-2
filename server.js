const express = require("express");
const path = require("path");
const { Pool } = require("pg");
const mongoose = require("mongoose");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// =======================================
// Настройка Cloudinary
// =======================================
cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log("🔑 Cloudinary настроен для:", process.env.CLOUDINARY_CLOUD_NAME);

// =======================================
// Настройка Multer + Cloudinary для загрузки файлов
// =======================================
const storage = new CloudinaryStorage({
	cloudinary: cloudinary,
	params: {
		folder: "my-online-store",
		allowed_formats: ["jpg", "jpeg", "png", "gif"],
		transformation: [{ width: 800, height: 600, crop: "limit" }]
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
		fileSize: 5 * 1024 * 1024 // 5MB
	}
});

// =======================================
// Подключение к PostgreSQL (Render)
// =======================================
const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
	ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
	idleTimeoutMillis: 30000,
	connectionTimeoutMillis: 5000,
});

// Функция для проверки подключения к PostgreSQL
async function checkPostgreSQLConnection() {
	let retries = 5;
	while (retries > 0) {
		try {
			const client = await pool.connect();
			console.log("✅ Подключение к PostgreSQL успешно");
			client.release();
			return true;
		} catch (err) {
			console.error(`❌ Ошибка подключения к PostgreSQL (попыток left: ${retries}):`, err.message);
			retries -= 1;
			await new Promise(resolve => setTimeout(resolve, 5000));
		}
	}
	throw new Error("Не удалось подключиться к PostgreSQL после нескольких попыток");
}

// =======================================
// Подключение к MongoDB
// =======================================
async function connectMongoDB() {
	try {
		if (!process.env.MONGODB_URI) {
			throw new Error("MONGODB_URI не указан в переменных окружения");
		}

		// Настройки подключения
		const mongooseOptions = {
			useNewUrlParser: true,
			useUnifiedTopology: true,
			serverSelectionTimeoutMS: 5000,
			socketTimeoutMS: 45000,
		};

		await mongoose.connect(process.env.MONGODB_URI, mongooseOptions);
		console.log("✅ Подключение к MongoDB успешно");
		console.log(`   База данных: ${mongoose.connection.db?.databaseName}`);

	} catch (err) {
		console.error("❌ Ошибка подключения к MongoDB:", err.message);
		throw err;
	}
}

// =======================================
// Middleware
// =======================================
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname)));

// Логирование всех запросов
app.use((req, res, next) => {
	console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
	next();
});

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
async function initializeDatabase() {
	try {
		await pool.query(`
      CREATE TABLE IF NOT EXISTS cards (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        price TEXT NOT NULL,
        description TEXT,
        availability TEXT DEFAULT 'В наличии',
        imgSrc TEXT,
        date TEXT DEFAULT TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD'),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

		await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_cards_name ON cards(name);
    `);

		console.log("✅ Таблица cards инициализирована");
	} catch (err) {
		console.error("❌ Ошибка при инициализации таблицы:", err);
		throw err;
	}
}

// =======================================
// API для карточек
// =======================================

// Получение всех карточек
app.get("/api/cards", async (req, res) => {
	try {
		console.log("📥 Запрос на получение всех карточек");
		const { rows } = await pool.query("SELECT * FROM cards ORDER BY created_at DESC");
		console.log(`✅ Отправлено ${rows.length} карточек`);
		res.json(rows);
	} catch (err) {
		console.error("❌ Ошибка при получении карточек:", err);
		res.status(500).json({ error: "Ошибка при получении карточек" });
	}
});

// Добавление ОДНОЙ карточки
app.post("/api/cards", upload.single('photo'), async (req, res) => {
	console.log("📦 Получен запрос на добавление карточки");

	try {
		const { name, price, description, availability } = req.body;

		if (!name || !price) {
			return res.status(400).json({ error: "Название и цена обязательны" });
		}

		let imageUrl = '';

		if (req.file) {
			imageUrl = req.file.path;
			console.log("✅ Фото загружено на Cloudinary:", imageUrl);
		}

		const result = await pool.query(
			`INSERT INTO cards (name, price, description, availability, imgSrc, date) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
			[
				name.toString().trim(),
				price.toString().trim(),
				(description || '').toString().trim(),
				(availability || 'В наличии').toString().trim(),
				imageUrl,
				new Date().toISOString().split('T')[0]
			]
		);

		const newCard = result.rows[0];
		console.log("✅ Карточка добавлена в БД, ID:", newCard.id);

		res.status(201).json(newCard);

	} catch (err) {
		console.error("❌ Ошибка при добавлении карточки:", err);
		res.status(500).json({ error: "Ошибка при добавлении карточки" });
	}
});

// Удаление карточки
app.delete("/api/cards/:id", async (req, res) => {
	const { id } = req.params;

	try {
		const result = await pool.query(
			"DELETE FROM cards WHERE id = $1 RETURNING *",
			[id]
		);

		if (result.rows.length === 0) {
			return res.status(404).json({ error: "Карточка не найдена" });
		}

		console.log(`🗑️ Удалена карточка ID: ${id}`);
		res.json({ status: "deleted", id: id });

	} catch (err) {
		console.error("❌ Ошибка при удалении карточки:", err);
		res.status(500).json({ error: "Ошибка при удалении карточки" });
	}
});

// Обновление карточки
app.put("/api/cards/:id", async (req, res) => {
	const { id } = req.params;
	const { name, price, description, availability } = req.body;

	try {
		const result = await pool.query(
			`UPDATE cards 
       SET name = $1, price = $2, description = $3, availability = $4, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $5 
       RETURNING *`,
			[name, price, description, availability, id]
		);

		if (result.rows.length === 0) {
			return res.status(404).json({ error: "Карточка не найдена" });
		}

		console.log(`✏️ Обновлена карточка ID: ${id}`);
		res.json(result.rows[0]);

	} catch (err) {
		console.error("❌ Ошибка при обновлении карточки:", err);
		res.status(500).json({ error: "Ошибка при обновлении карточки" });
	}
});

// Получение одной карточки по ID
app.get("/api/cards/:id", async (req, res) => {
	const { id } = req.params;

	try {
		const result = await pool.query(
			"SELECT * FROM cards WHERE id = $1",
			[id]
		);

		if (result.rows.length === 0) {
			return res.status(404).json({ error: "Карточка не найдена" });
		}

		res.json(result.rows[0]);

	} catch (err) {
		console.error("❌ Ошибка при получении карточки:", err);
		res.status(500).json({ error: "Ошибка при получении карточки" });
	}
});

// =======================================
// API для загрузки фото на Cloudinary
// =======================================
app.post("/api/upload", upload.single("photo"), async (req, res) => {
	console.log("📸 Запрос на загрузку фото");

	try {
		if (!req.file) {
			console.error("❌ Файл не получен");
			return res.status(400).json({ error: "Файл не загружен" });
		}

		console.log("✅ Файл загружен:", req.file.originalname);
		console.log("✅ URL Cloudinary:", req.file.path);

		res.json({
			success: true,
			url: req.file.path,
			message: "Фото успешно загружено"
		});

	} catch (err) {
		console.error("❌ Ошибка при загрузке файла:", err);
		res.status(500).json({
			error: "Ошибка при загрузке фото",
			message: err.message
		});
	}
});

// =======================================
// Health check endpoint
// =======================================
app.get("/api/health", async (req, res) => {
	try {
		// Проверяем PostgreSQL
		await pool.query("SELECT 1");

		// Проверяем MongoDB
		await mongoose.connection.db.admin().ping();

		res.json({
			status: "OK",
			postgresql: "connected",
			mongodb: "connected",
			timestamp: new Date().toISOString()
		});
	} catch (err) {
		res.status(500).json({
			status: "ERROR",
			error: err.message,
			timestamp: new Date().toISOString()
		});
	}
});

// =======================================
// Обработка 404
// =======================================
app.use((req, res) => {
	console.warn(`⚠️  Маршрут не найден: ${req.method} ${req.url}`);
	res.status(404).json({ error: "Маршрут не найден" });
});

// =======================================
// Глобальный обработчик ошибок
// =======================================
app.use((err, req, res, next) => {
	console.error("🔥 Необработанная ошибка:", err);
	res.status(500).json({
		error: "Внутренняя ошибка сервера",
		message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
	});
});

// =======================================
// Инициализация и запуск сервера
// =======================================
async function startServer() {
	try {
		// Ждем подключения к БД
		await checkPostgreSQLConnection();

		// Подключаемся к MongoDB
		await connectMongoDB();

		// Инициализируем таблицы
		await initializeDatabase();

		// Запускаем сервер
		app.listen(PORT, '0.0.0.0', () => {
			console.log(`🚀 Сервер запущен на порту ${PORT}`);
			console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
		});

	} catch (err) {
		console.error("❌ Не удалось запустить сервер:", err);
		process.exit(1);
	}
}

// =======================================
// Graceful shutdown
// =======================================
async function gracefulShutdown() {
	console.log('\n🔻 Завершение работы сервера...');

	try {
		// Закрываем PostgreSQL
		await pool.end();
		console.log('✅ Подключение к PostgreSQL закрыто');

		// Закрываем MongoDB
		await mongoose.connection.close();
		console.log('✅ Подключение к MongoDB закрыто');

		process.exit(0);
	} catch (err) {
		console.error('❌ Ошибка при завершении работы:', err);
		process.exit(1);
	}
}

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Запускаем сервер
startServer();


