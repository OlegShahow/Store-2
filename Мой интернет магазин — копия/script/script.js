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

	// =======================================
	// Находим форму и контейнер
	// =======================================
	const form = document.getElementById("add-card-form");
	const cardsContainer = document.querySelector(".main__cards");

	// =======================================
	// Вспомогательные функции
	// =======================================

	// ===== LOCAL STORAGE VERSION (работает сейчас) =====
	let cards = JSON.parse(localStorage.getItem("cards")) || [];

	function getCards() {
		// === Возвращает текущий массив карточек (локально) ===
		return cards;
	}

	function saveCards(updatedCards) {
		// === Обновляем массив и localStorage ===
		cards = updatedCards;
		localStorage.setItem("cards", JSON.stringify(cards));
	}

	// ===== SERVER READY VERSION (раскомментировать для сервера) =====
	/*
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
	*/

	// =======================================
	// Функция рендера карточки
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
          <div class="description"><p>${card.desc}</p></div>
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
		delButton.addEventListener("click", () => {
			newCard.remove();

			// ===== LOCAL STORAGE VERSION =====
			const updatedCards = getCards().filter(
				c => !(c.name === card.name && c.price === card.price)
			);
			saveCards(updatedCards);

			// ===== SERVER READY VERSION =====
			/*
			(async () => {
			  let updatedCards = await getCards();
			  updatedCards = updatedCards.filter(
				c => !(c.name === card.name && c.price === card.price)
			  );
			  await saveCards(updatedCards);
			})();
			*/
		});

		// =======================================
		// Кнопка "Статус"
		// =======================================
		const statButton = newCard.querySelector(".stat");
		const ava = newCard.querySelector(".item--availability");
		statButton.addEventListener("click", () => {
			const newStatus = ava.textContent === "В наличии" ? "В дороге" : "В наличии";
			ava.textContent = newStatus;

			// ===== LOCAL STORAGE VERSION =====
			let updatedCards = getCards();
			const cardIndex = updatedCards.findIndex(
				c => c.name === card.name && c.price === card.price
			);
			if (cardIndex !== -1) {
				updatedCards[cardIndex].availability = newStatus;
				saveCards(updatedCards);
			}

			// ===== SERVER READY VERSION =====
			/*
			(async () => {
			  let updatedCards = await getCards();
			  const cardIndex = updatedCards.findIndex(
				c => c.name === card.name && c.price === card.price
			  );
			  if (cardIndex !== -1) {
				updatedCards[cardIndex].availability = newStatus;
				await saveCards(updatedCards);
			  }
			})();
			*/
		});
	}

	// =======================================
	// Загрузка карточек при старте
	// =======================================
	getCards().forEach(renderCard);

	// =======================================
	// Добавление новой карточки
	// =======================================
	form.addEventListener("submit", (event) => {
		event.preventDefault();

		const name = form.name.value.trim();
		const price = form.price.value.trim();
		const desc = form.desc.value.trim();
		const availability = form.availability.value.trim();
		const imgUrl = form.imgUrl.value.trim();

		if (!name || !price || !imgUrl) {
			alert("Заполните обязательные поля: название, цену и ссылку на картинку.");
			return;
		}

		const card = { name, price, desc, availability, imgSrc: imgUrl };

		// ===== LOCAL STORAGE VERSION =====
		const allCards = getCards();
		allCards.push(card);
		saveCards(allCards);
		renderCard(card);

		// ===== SERVER READY VERSION =====
		/*
		(async () => {
		  let allCards = await getCards();
		  allCards.push(card);
		  await saveCards(allCards);
		  renderCard(card);
		})();
		*/

		form.reset();
	});






	// .................................................................................................................



















	// ..........................................................................................................


});