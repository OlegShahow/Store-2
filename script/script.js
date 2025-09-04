"use strict";

window.addEventListener('DOMContentLoaded', () => {



	// ............................... Подпись кнопки админ ...........................................................................

	const admin = document.querySelector(".header__nav--admin button");
	const navForm = document.querySelector(".header__nav--form");

	admin.addEventListener('click', () => {

		// условие ? значение_если_истина : значение_если_ложь

		navForm.style.opacity = navForm.style.opacity === "1" ? "0" : "1";
	})


	// ............................. Кнопка описания товара  .............................................................................



	const abouts = document.querySelectorAll(".ab");
	const description = document.querySelectorAll(".description");

	abouts.forEach((btn, index) => {
		btn.addEventListener("click", () => {
			// переключаем видимость блока description с тем же индексом
			description[index].style.display = description[index].style.display === "flex" ? "none" : "flex";
		});
	});



	// Как можно красиво сделать через target:
	// Можно найти ближайший.description относительно нажатой кнопки:

	// abouts.forEach((btn) => {
	// 	btn.addEventListener("click", (e) => {
	// 		const desc = e.target.closest(".item--about").querySelector(".description");
	// 		desc.style.display = desc.style.display === "flex" ? "none" : "flex";
	// 	});
	// });

	// .............................................................................................................


	// .....................................   кнопки   СТАТУС  ........................................................................


	const statusBtns = document.querySelectorAll(".stat");
	const itemAvas = document.querySelectorAll(".item--availability");

	statusBtns.forEach((btn, index) => {
		btn.addEventListener("click", () => {
			itemAvas[index].textContent =
				itemAvas[index].textContent === "В наличии"
					? "В дороге"
					: "В наличии";
		});
	});

	// .............................................................................................................

	// ............................. Создание динамической карточки .............................................................................
	//  ...........  отправка сайта на сервер !!!!!!!!  




	// Отлично, понял задачу.Ты хочешь полный, рабочий frontend - скрипт с учётом Cloudinary.Я беру твой старый код и переписываю его так, чтобы он работал с сервером, где картинки хранятся в Cloudinary, + оставлю все твои и новые комментарии.



	// =======================================
	// Находим форму и контейнер для карточек
	// =======================================
	const form = document.getElementById("add-card-form");
	const cardsContainer = document.querySelector(".main__cards");

	// =======================================
	// Получение всех карточек с сервера
	// =======================================
	async function getCards() {
		try {
			const response = await fetch("/api/cards");
			if (!response.ok) throw new Error(`Ошибка при получении карточек: ${response.status}`);
			return await response.json();
		} catch (err) {
			console.error("❌ getCards Error:", err);
			return [];
		}
	}

	// =======================================
	// Сохранение всех карточек на сервер
	// =======================================
	async function saveAllCards(cardsArray) {
		try {
			const response = await fetch("/api/cards", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(cardsArray),
			});

			if (!response.ok) throw new Error(`Ошибка при сохранении карточек: ${response.status}`);

			const result = await response.json();
			console.log("✅ Карточки успешно сохранены");
			return result;
		} catch (err) {
			console.error("❌ saveAllCards Error:", err);
			throw err;
		}
	}

	// =======================================
	// Функция рендера одной карточки
	// =======================================
	function renderCard(card) {
		const newCard = document.createElement("div");
		newCard.classList.add("item--card");
		newCard.dataset.id = card.id;

		newCard.innerHTML = `
    <div class="item--info">
        <div class="info--public">
            <div class="item--name adds"><p>${card.name}</p></div>
            <div class="item--prize adds"><p>${card.price} <img src="./icon/g1.png" alt="@"></p></div>
            <div class="item--foto adds"><img src="${card.imgSrc}" alt="${card.name}" onerror="this.src='./img/placeholder.jpg'"></div>
            <div class="item--about adds">
                <button class="ab">О товаре</button>
                <div class="description"><p>${card.description || ""}</p></div>
            </div>
            <div class="item--availability adds">${card.availability}</div>
            <div class="item--korzina">
                <button type="button" class="korz--btn">
                  <a href="corzina.html"><img src="./icon/k2.png" alt="Корзина"></a>  
                </button>
            </div>
        </div>
        <div class="info--admin">
            <div class="admin--delite"><button class="del">Удалить товар</button></div>
            <div class="admin--status"><button class="stat">Статус</button></div>
            <div class="admin--date"><p>Размещено - ${card.date}</p></div>
        </div>
    </div>
    `;

		cardsContainer.appendChild(newCard);

		// =======================================
		// Кнопка "О товаре"
		// =======================================
		const abButton = newCard.querySelector(".ab");
		const description = newCard.querySelector(".description");
		abButton.addEventListener("click", () => {
			description.style.display = description.style.display === "flex" ? "none" : "flex";
		});

		// =======================================
		// Удаление карточки
		// =======================================
		const delButton = newCard.querySelector(".del");
		delButton.addEventListener("click", async () => {
			if (confirm("Удалить этот товар?")) {
				try {
					// Получаем текущие карточки
					const currentCards = await getCards();
					// Фильтруем удаляемую карточку
					const updatedCards = currentCards.filter(c => c.id !== card.id);
					// Сохраняем обновленный массив
					await saveAllCards(updatedCards);
					// Удаляем из DOM
					newCard.remove();
					console.log("🗑 Карточка удалена");
				} catch (err) {
					console.error("❌ Ошибка при удалении:", err);
					alert("Не удалось удалить товар");
				}
			}
		});

		// =======================================
		// Кнопка "Статус"
		// =======================================
		const statButton = newCard.querySelector(".stat");
		const availabilityElement = newCard.querySelector(".item--availability");
		statButton.addEventListener("click", async () => {
			try {
				const currentCards = await getCards();
				const cardToUpdate = currentCards.find(c => c.id === card.id);

				if (cardToUpdate) {
					// Меняем статус
					const newStatus = cardToUpdate.availability === "В наличии" ? "Нет в наличии" : "В наличии";
					cardToUpdate.availability = newStatus;

					// Обновляем отображение
					availabilityElement.textContent = newStatus;

					// Сохраняем все карточки
					await saveAllCards(currentCards);
					console.log("✅ Статус обновлен:", newStatus);
				}
			} catch (err) {
				console.error("❌ Ошибка при изменении статуса:", err);
				alert("Не удалось изменить статус");
			}
		});
	}

	// =======================================
	// Загрузка всех карточек при старте
	// =======================================
	async function loadAllCards() {
		try {
			const cards = await getCards();
			cardsContainer.innerHTML = ''; // Очищаем контейнер
			cards.forEach(card => renderCard(card));
			console.log(`✅ Загружено ${cards.length} карточек`);
		} catch (err) {
			console.error("❌ Ошибка при загрузке карточек:", err);
		}
	}

	// =======================================
	// Добавление новой карточки (ИСПРАВЛЕННАЯ ВЕРСИЯ)
	// =======================================
	form.addEventListener("submit", async (event) => {
		event.preventDefault();

		// Блокируем кнопку чтобы избежать повторных нажатий
		const submitButton = form.querySelector('button[type="submit"]');
		const originalText = submitButton.textContent;
		submitButton.textContent = "Добавляем...";
		submitButton.disabled = true;

		try {
			const name = form.name.value.trim();
			const price = form.price.value.trim();
			const desc = form.desc.value.trim();
			const availability = form.availability.value.trim() || "В наличии";
			const file = form.photo.files[0];
			const date = form.date.value.trim();

			if (!name || !price || !file) {
				alert("Заполните обязательные поля: название, цену и выберите фото.");
				return;
			}

			// =======================================
			// Загрузка фото на сервер через /api/upload
			// =======================================
			console.log("📤 Начинаем загрузку фото...");
			const formData = new FormData();
			formData.append("photo", file);

			let imgSrc = "";
			try {
				const uploadRes = await fetch("/api/upload", {
					method: "POST",
					body: formData
				});

				if (!uploadRes.ok) {
					throw new Error(`Ошибка сервера: ${uploadRes.status}`);
				}

				const data = await uploadRes.json();
				if (!data.url) throw new Error("Сервер не вернул URL фото");

				imgSrc = data.url;
				console.log("✅ Фото загружено:", imgSrc);
			} catch (err) {
				console.error("❌ Ошибка при загрузке фото:", err);
				alert("Не удалось загрузить фото. Проверьте подключение и размер файла (макс. 5MB).");
				return;
			}

			// =======================================
			// ПОЛУЧАЕМ ТЕКУЩИЙ СПИСОК КАРТОЧЕК
			// =======================================
			console.log("📋 Получаем текущие карточки...");
			const currentCards = await getCards();

			// =======================================
			// СОЗДАЕМ НОВУЮ КАРТОЧКУ
			// =======================================
			const newCard = {
				id: Math.max(0, ...currentCards.map(c => c.id)) + 1, // Генерируем новый ID
				name,
				price,
				description: desc,
				availability,
				imgSrc,
				date
			};

			// =======================================
			// ДОБАВЛЯЕМ К СУЩЕСТВУЮЩИМ КАРТОЧКАМ
			// =======================================
			const updatedCards = [...currentCards, newCard];
			console.log("🔄 Обновляем массив карточек...");

			// =======================================
			// ОТПРАВЛЯЕМ ВЕСЬ МАССИВ КАРТОЧЕК НА СЕРВЕР
			// =======================================
			await saveAllCards(updatedCards);

			// =======================================
			// Рендерим новую карточку
			// =======================================
			renderCard(newCard);
			form.reset();

			console.log("✅ Товар успешно добавлен!");
			alert("Товар успешно добавлен!");

		} catch (err) {
			console.error("❌ Критическая ошибка при добавлении товара:", err);
			alert("Произошла ошибка при добавлении товара. Проверьте консоль для подробностей.");
		} finally {
			// Разблокируем кнопку в любом случае
			submitButton.textContent = originalText;
			submitButton.disabled = false;
		}
	});

	// =======================================
	// Инициализация при загрузке страницы
	// =======================================
	document.addEventListener('DOMContentLoaded', () => {
		console.log("🚀 Инициализация приложения...");
		loadAllCards();

		// Устанавливаем сегодняшнюю дату по умолчанию
		const today = new Date().toISOString().split('T')[0];
		document.getElementById('date').value = today;
	});

	// =======================================
	// Обработчик ошибок для изображений
	// =======================================
	function handleImageError(img) {
		img.src = './img/placeholder.jpg';
		img.alt = 'Изображение не найдено';
	}

	console.log("✨ Frontend JavaScript загружен и готов к работе!");




	// .................................................................................................................



















	// ..........................................................................................................


});