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
	// Получение всех карточек с сервера (с обработкой "спящего" сервера)
	// =======================================
	async function getCards() {
		try {
			console.log("🔄 Запрос карточек... (может занять до 60 секунд)");

			// Увеличиваем таймаут для "просыпающегося" сервера Render
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 60000);

			const response = await fetch("/api/cards", {
				signal: controller.signal
			});

			clearTimeout(timeoutId);

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Ошибка сервера: ${response.status} - ${errorText}`);
			}

			const cards = await response.json();
			console.log(`✅ Получено ${cards.length} карточек`);
			return cards;

		} catch (err) {
			if (err.name === 'AbortError') {
				console.error("❌ Таймаут запроса: сервер долго не отвечает (возможно, 'спит')");
				alert("Сервер просыпается... Попробуйте через 30 секунд.");
			} else {
				console.error("❌ getCards Error:", err);
			}
			return [];
		}
	}

	// =======================================
	// Добавление ОДНОЙ карточки на сервер
	// =======================================
	async function addCard(cardData) {
		try {
			console.log("📤 Отправка новой карточки...");

			const formData = new FormData();
			formData.append('name', cardData.name);
			formData.append('price', cardData.price);
			formData.append('description', cardData.description || '');
			formData.append('availability', cardData.availability || 'В наличии');

			if (cardData.photoFile) {
				formData.append('photo', cardData.photoFile);
			}

			// Таймаут для загрузки
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 120000);

			const response = await fetch("/api/cards", {
				method: "POST",
				body: formData,
				signal: controller.signal
			});

			clearTimeout(timeoutId);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(`Ошибка сервера: ${response.status} - ${JSON.stringify(errorData)}`);
			}

			const result = await response.json();
			console.log("✅ Карточка добавлена, ID:", result.id);
			return result;

		} catch (err) {
			if (err.name === 'AbortError') {
				console.error("❌ Таймаут при добавлении: сервер не ответил вовремя");
				throw new Error("Сервер не ответил. Попробуйте снова.");
			}
			console.error("❌ addCard Error:", err);
			throw err;
		}
	}

	// =======================================
	// Удаление ОДНОЙ карточки
	// =======================================
	async function deleteCard(cardId) {
		try {
			const response = await fetch(`/api/cards/${cardId}`, {
				method: "DELETE"
			});

			if (!response.ok) {
				throw new Error(`Ошибка сервера: ${response.status}`);
			}

			console.log("🗑️ Карточка удалена, ID:", cardId);
			return await response.json();

		} catch (err) {
			console.error("❌ deleteCard Error:", err);
			throw new Error("Не удалось удалить товар");
		}
	}

	// =======================================
	// Обновление статуса ОДНОЙ карточки
	// =======================================
	async function updateCardStatus(cardId, newStatus) {
		try {
			const response = await fetch(`/api/cards/${cardId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ availability: newStatus })
			});

			if (!response.ok) {
				throw new Error(`Ошибка сервера: ${response.status}`);
			}

			console.log("🔄 Статус обновлен, ID:", cardId);
			return await response.json();

		} catch (err) {
			console.error("❌ updateCardStatus Error:", err);
			throw new Error("Не удалось изменить статус");
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
            <div class="item--foto adds"><img src="${card.imgsrc || card.imgSrc}" alt="${card.name}" onerror="this.style.display='none'"></div>
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

		// Кнопка "О товаре"
		const abButton = newCard.querySelector(".ab");
		const description = newCard.querySelector(".description");
		abButton.addEventListener("click", () => {
			description.style.display = description.style.display === "flex" ? "none" : "flex";
		});

		// Удаление карточки
		const delButton = newCard.querySelector(".del");
		delButton.addEventListener("click", async () => {
			if (confirm("Удалить этот товар?")) {
				try {
					await deleteCard(card.id);
					newCard.remove();
				} catch (err) {
					alert(err.message);
				}
			}
		});

		// Кнопка "Статус"
		const statButton = newCard.querySelector(".stat");
		const availabilityElement = newCard.querySelector(".item--availability");
		statButton.addEventListener("click", async () => {
			try {
				const newStatus = card.availability === "В наличии" ? "Нет в наличии" : "В наличии";
				await updateCardStatus(card.id, newStatus);
				availabilityElement.textContent = newStatus;
				card.availability = newStatus;
			} catch (err) {
				alert(err.message);
			}
		});
	}

	// =======================================
	// Загрузка всех карточек при старте
	// =======================================
	async function loadAllCards() {
		try {
			console.log("🔄 Загрузка карточек...");
			const cards = await getCards();
			cardsContainer.innerHTML = '';

			if (cards.length === 0) {
				console.log("ℹ️ Карточек нет");
				cardsContainer.innerHTML = '<div class="empty-state">Товаров пока нет</div>';
			} else {
				cards.forEach(card => renderCard(card));
				console.log(`✅ Загружено ${cards.length} карточек`);
			}
		} catch (err) {
			console.error("❌ Ошибка при загрузке карточек:", err);
			cardsContainer.innerHTML = '<div class="empty-state">Ошибка загрузки товаров</div>';
		}
	}

	// =======================================
	// Добавление новой карточки
	// =======================================
	form.addEventListener("submit", async (event) => {
		event.preventDefault();

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

			if (!name || !price) {
				alert("Заполните название и цену!");
				return;
			}

			if (!file) {
				alert("Выберите фото товара!");
				return;
			}

			const newCard = await addCard({
				name,
				price,
				description: desc,
				availability,
				photoFile: file
			});

			renderCard(newCard);
			form.reset();
			alert("✅ Товар успешно добавлен!");

		} catch (err) {
			console.error("❌ Ошибка при добавлении товара:", err);
			alert("Ошибка: " + err.message);
		} finally {
			submitButton.textContent = originalText;
			submitButton.disabled = false;
		}
	});

	// =======================================
	// Инициализация при загрузке страницы
	// =======================================
	document.addEventListener('DOMContentLoaded', () => {
		console.log("🚀 Приложение запускается...");
		loadAllCards();
	});

	console.log("✨ Frontend JavaScript загружен!");



	// ..........................................................................................................


});