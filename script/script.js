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
	// Находим форму и контейнер
	// =======================================
	const form = document.getElementById("add-card-form");
	const cardsContainer = document.querySelector(".main__cards");

	// =======================================
	// Вспомогательные функции
	// =======================================

	// ===== SERVER READY VERSION =====
	// Функция для получения всех карточек с сервера
	async function getCards() {
		try {
			const response = await fetch("/api/cards");
			if (!response.ok) throw new Error("Ошибка при получении карточек");
			return await response.json();
		} catch (err) {
			console.error(err);
			return [];
		}
	}

	// Функция для сохранения карточек на сервер
	async function saveCards(cards) {
		try {
			await fetch("/api/cards", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(cards),
			});
		} catch (err) {
			console.error(err);
		}
	}

	// =======================================
	// Функция рендера карточки
	// =======================================
	function renderCard(card) {
		const newCard = document.createElement("div");
		newCard.classList.add("item--card");

		// Вёрстка карточки
		newCard.innerHTML = `
    <div class="item--info">
      <div class="info--public">
        <div class="item--name adds"><p>${card.name}</p></div>
        <div class="item--prize adds"><p>${card.price} <img src="./icon/g1.png" alt="@"></p></div>
        <div class="item--foto adds"><img src="${card.imgSrc}" alt="${card.name}"></div>
        <div class="item--about adds">
          <button class="ab">О товаре</button>
          <div class="description"><p>${card.description}</p></div>
        </div>
        <div class="item--availability adds">${card.availability}</div>
        <div class="item--korzina">
          <button type="button" class="korz--btn">
               <img src="./icon/k2.png" alt="Корзина">
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
		// Кнопка "О товаре" (скрыть/показать описание)
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
			newCard.remove();
			let updatedCards = await getCards();
			updatedCards = updatedCards.filter(c => !(c.name === card.name && c.price === card.price));
			await saveCards(updatedCards);
		});

		// =======================================
		// Кнопка "Статус" (меняем доступность)
		// =======================================
		const statButton = newCard.querySelector(".stat");
		const ava = newCard.querySelector(".item--availability");
		statButton.addEventListener("click", async () => {
			const newStatus = ava.textContent === "В наличии" ? "В дороге" : "В наличии";
			ava.textContent = newStatus;

			let updatedCards = await getCards();
			const cardIndex = updatedCards.findIndex(c => c.name === card.name && c.price === card.price);
			if (cardIndex !== -1) {
				updatedCards[cardIndex].availability = newStatus;
				await saveCards(updatedCards);
			}
		});
	}

	// =======================================
	// Загрузка карточек при старте
	// =======================================
	(async () => {
		const cards = await getCards();
		cards.forEach(renderCard);
	})();

	// =======================================
	// Добавление новой карточки с поддержкой загрузки фото
	// =======================================
	form.addEventListener("submit", async (event) => {
		event.preventDefault();

		const name = form.name.value.trim();
		const price = form.price.value.trim();
		const desc = form.desc.value.trim();
		const availability = form.availability.value.trim();
		const file = form.photo.files[0]; // input type="file"
		const date = form.date.value.trim();

		// Проверка обязательных полей
		if (!name || !price || !file) {
			alert("Заполните обязательные поля: название, цену и выберите фото.");
			return;
		}

		// =======================================
		// Загружаем фото на сервер через /api/upload
		// Сервер сам загрузит его в Cloudinary и вернёт URL
		// =======================================
		const formData = new FormData();
		formData.append("photo", file);

		let imgSrc = "";
		try {
			const uploadRes = await fetch("/api/upload", {
				method: "POST",
				body: formData,
			});
			const data = await uploadRes.json();

			if (!uploadRes.ok || !data.url) {
				throw new Error(data.error || "Ошибка при загрузке фото");
			}

			imgSrc = data.url; // <-- теперь Cloudinary URL
		} catch (err) {
			console.error("Ошибка при загрузке фото:", err);
			alert("Не удалось загрузить фото");
			return;
		}

		// Создаём карточку
		const card = { name, price, description: desc, availability, imgSrc, date };

		// Сохраняем карточку и сразу рендерим
		let allCards = await getCards();
		allCards.push(card);
		await saveCards(allCards);
		renderCard(card);

		form.reset();
	});



	// Что изменилось:
	// Закомментирован код localStorage(можно оставить для локального теста).
	// Раскомментированы блоки SERVER READY VERSION, чтобы все действия выполнялись через сервер.
	// Все комментарии сохранены, чтобы не потерять описание логики.


	// .................................................................................................................



















	// ..........................................................................................................


});