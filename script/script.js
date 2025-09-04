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
	// Добавление ОДНОЙ карточки на сервер
	// =======================================
	async function addCard(cardData) {
		try {
			const formData = new FormData();

			// Добавляем все поля карточки
			formData.append('name', cardData.name);
			formData.append('price', cardData.price);
			formData.append('description', cardData.description || '');
			formData.append('availability', cardData.availability || 'В наличии');

			// Если есть файл - добавляем его
			if (cardData.photoFile) {
				formData.append('photo', cardData.photoFile);
			}

			const response = await fetch("/api/cards", {
				method: "POST",
				body: formData  // FormData автоматически установит Content-Type
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(`Ошибка при добавлении карточки: ${response.status} - ${JSON.stringify(errorData)}`);
			}

			return await response.json();
		} catch (err) {
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
				throw new Error(`Ошибка при удалении карточки: ${response.status}`);
			}

			return await response.json();
		} catch (err) {
			console.error("❌ deleteCard Error:", err);
			throw err;
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
				throw new Error(`Ошибка при обновлении статуса: ${response.status}`);
			}

			return await response.json();
		} catch (err) {
			console.error("❌ updateCardStatus Error:", err);
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
					await deleteCard(card.id);
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
				const newStatus = card.availability === "В наличии" ? "Нет в наличии" : "В наличии";
				await updateCardStatus(card.id, newStatus);

				// Обновляем отображение
				availabilityElement.textContent = newStatus;
				card.availability = newStatus;

				console.log("✅ Статус обновлен:", newStatus);
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
	// Добавление новой карточки
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

			if (!name || !price || !file) {
				alert("Заполните обязательные поля: название, цену и выберите фото.");
				return;
			}

			// =======================================
			// Добавляем карточку (фото загрузится автоматически)
			// =======================================
			const newCard = await addCard({
				name,
				price,
				description: desc,
				availability,
				photoFile: file
			});

			// =======================================
			// Рендерим новую карточку
			// =======================================
			renderCard(newCard);
			form.reset();

			console.log("✅ Товар успешно добавлен!");
			alert("Товар успешно добавлен!");

		} catch (err) {
			console.error("❌ Критическая ошибка при добавлении товара:", err);
			alert("Произошла ошибка при добавлении товара: " + err.message);
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
	});

	console.log("✨ Frontend JavaScript загружен и готов к работе!");













	// ..........................................................................................................


});