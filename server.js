const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// =======================================
// Модель Mongoose для карточек
// =======================================
const cardSchema = new mongoose.Schema({
	name: { type: String, required: true },
	price: { type: String, required: true },
	description: String,
	availability: { type: String, default: 'В наличии' },
	imgSrc: String,
	date: { type: String, default: () => new Date().toISOString().split('T')[0] }
}, {
	timestamps: true
});

const Card = mongoose.model('Card', cardSchema);

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
// Подключение к MongoDB
// =======================================
async function connectMongoDB() {
	try {
		if (!process.env.MONGODB_URI) {
			throw new Error("MONGODB_URI не указан в переменных окружения");
		}

		await mongoose.connect(process.env.MONGODB_URI);
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
// API для карточек (MongoDB)
// =======================================

// Получение всех карточек
app.get("/api/cards", async (req, res) => {
	try {
		console.log("📥 Запрос на получение всех карточек из MongoDB");
		const cards = await Card.find().sort({ createdAt: -1 });
		console.log(`✅ Отправлено ${cards.length} карточек из MongoDB`);
		res.json(cards);
	} catch (err) {
		console.error("❌ Ошибка при получении карточек из MongoDB:", err);
		res.status(500).json({ error: "Ошибка при получении карточек" });
	}
});

// Добавление ОДНОЙ карточки
app.post("/api/cards", upload.single('photo'), async (req, res) => {
	console.log("📦 Получен запрос на добавление карточки в MongoDB");

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

		// Сохраняем в MongoDB!
		const newCard = new Card({
			name: name.toString().trim(),
			price: price.toString().trim(),
			description: (description || '').toString().trim(),
			availability: (availability || 'В наличии').toString().trim(),
			imgSrc: imageUrl
		});

		await newCard.save();
		console.log("✅ Карточка добавлена в MongoDB, ID:", newCard._id);

		res.status(201).json(newCard);
	} catch (err) {
		console.error("❌ Ошибка при добавлении карточки в MongoDB:", err);
		res.status(500).json({ error: "Ошибка при добавлении карточки" });
	}
});

// Удаление карточки
app.delete("/api/cards/:id", async (req, res) => {
	const { id } = req.params;

	try {
		if (!mongoose.Types.ObjectId.isValid(id)) {
			return res.status(400).json({ error: "Неверный ID карточки" });
		}

		const deletedCard = await Card.findByIdAndDelete(id);

		if (!deletedCard) {
			return res.status(404).json({ error: "Карточка не найдена" });
		}

		console.log(`🗑️ Удалена карточка ID: ${id}`);
		res.json({ status: "deleted", id: id });

	} catch (err) {
		console.error("❌ Ошибка при удалении карточки из MongoDB:", err);
		res.status(500).json({ error: "Ошибка при удалении карточки" });
	}
});

// Обновление карточки
app.put("/api/cards/:id", async (req, res) => {
	const { id } = req.params;
	const { name, price, description, availability } = req.body;

	try {
		if (!mongoose.Types.ObjectId.isValid(id)) {
			return res.status(400).json({ error: "Неверный ID карточки" });
		}

		const updatedCard = await Card.findByIdAndUpdate(
			id,
			{
				name,
				price,
				description,
				availability,
				updatedAt: new Date()
			},
			{ new: true, runValidators: true }
		);

		if (!updatedCard) {
			return res.status(404).json({ error: "Карточка не найдена" });
		}

		console.log(`✏️ Обновлена карточка ID: ${id}`);
		res.json(updatedCard);

	} catch (err) {
		console.error("❌ Ошибка при обновлении карточки в MongoDB:", err);
		res.status(500).json({ error: "Ошибка при обновлении карточки" });
	}
});

// Получение одной карточки по ID
app.get("/api/cards/:id", async (req, res) => {
	const { id } = req.params;

	try {
		if (!mongoose.Types.ObjectId.isValid(id)) {
			return res.status(400).json({ error: "Неверный ID карточки" });
		}

		const card = await Card.findById(id);

		if (!card) {
			return res.status(404).json({ error: "Карточка не найдена" });
		}

		res.json(card);

	} catch (err) {
		console.error("❌ Ошибка при получении карточки из MongoDB:", err);
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
		// Проверяем MongoDB
		await mongoose.connection.db.admin().ping();

		res.json({
			status: "OK",
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
		// Подключаемся к MongoDB
		await connectMongoDB();

		console.log("✅ MongoDB подключена и готова к работе");

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


