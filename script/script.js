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
	// Функция рендера одной карточки
	// =======================================
	function renderCard(card) {
		const newCard = document.createElement("div");
		newCard.classList.add("item--card");

		newCard.innerHTML = `
		<div class="item--info">
			<div class="info--public">
				<div class="item--name adds"><p>${card.name}</p></div>
				<div class="item--prize adds"><p>${card.price} <img src="./icon/g1.png" alt="@"></p></div>
				<div class="item--foto adds"><img src="${card.imgSrc}" alt="${card.name}"></div>
				<div class="item--about adds">
					<button class="ab">О товаре</button>
					<div class="description"><p>${card.description || ""}</p></div>
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
			newCard.remove();
			await fetch(`/api/cards/${card.id}`, { method: "DELETE" });
		});

		// =======================================
		// Кнопка "Статус"
		// =======================================
		const statButton = newCard.querySelector(".stat");
		const ava = newCard.querySelector(".item--availability");
		statButton.addEventListener("click", async () => {
			const newStatus = ava.textContent === "В наличии" ? "В дороге" : "В наличии";
			ava.textContent = newStatus;

			await fetch(`/api/cards/${card.id}/status`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ availability: newStatus }),
			});
		});
	}

	// =======================================
	// Загрузка всех карточек при старте
	// =======================================
	(async () => {
		const cards = await getCards();
		cards.forEach(card => renderCard(card));
	})();

	// =======================================
	// Добавление новой карточки
	// =======================================
	form.addEventListener("submit", async (event) => {
		event.preventDefault();

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
		const formData = new FormData();
		formData.append("photo", file);

		let imgSrc = "";
		try {
			const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
			const data = await uploadRes.json();
			if (!uploadRes.ok || !data.url) throw new Error("Ошибка при загрузке фото");
			imgSrc = data.url;
		} catch (err) {
			console.error("❌ Ошибка при загрузке фото:", err);
			alert("Не удалось загрузить фото. Проверьте сервер и Cloudinary.");
			return;
		}

		// =======================================
		// Создаём карточку и сохраняем в базу
		// =======================================
		const response = await fetch("/api/cards", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name, price, description: desc, availability, imgSrc, date }),
		});
		const savedCard = await response.json();

		// =======================================
		// Рендерим новую карточку
		// =======================================
		renderCard(savedCard);

		form.reset();
	});





	// .................................................................................................................



















	// ..........................................................................................................


});