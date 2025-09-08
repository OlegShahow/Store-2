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



	//   С СОХРАНЕНИЕМ ПОСЛЕ ПЕРЕЗАГРУЗКИ  !!!!!!  ................................................................................................
	// есть кнопка удаления карточки  и кнопка  "статуса "


	// https://drive.google.com/uc?id=FILE_ID пример адреса картинки



	// находим форму и контейнер
	const form = document.getElementById("add-card-form");
	const cardsContainer = document.querySelector(".main__cards");

	// вспомогательные функции
	function getCards() {
		return JSON.parse(localStorage.getItem("cards")) || [];
	}

	function saveCards(cards) {
		localStorage.setItem("cards", JSON.stringify(cards));
	}

	// функция рендера карточки
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
      </div>
      <div class="info--admin">
        <div class="admin--delite"><button class="del">Удалить товар</button></div>
        <div class="admin--status"><button class="stat">Статус</button></div>
      </div>
    </div>
  `;

		cardsContainer.appendChild(newCard);

		//  кнопка "О товаре" --  для одной !! не querySelector All
		const abButton = newCard.querySelector(".ab");
		const description = newCard.querySelector(".description");
		abButton.addEventListener("click", () => {
			description.style.display = description.style.display === "flex" ? "none" : "flex";
		});

		// удаление карточки из панели админа -- для одной !! не querySelector All
		const delButton = newCard.querySelector(".del");
		delButton.addEventListener("click", () => {
			newCard.remove();
			const cards = getCards().filter(c => !(c.name === card.name && c.price === card.price));
			saveCards(cards);
		});

		// кнопка "Статус" -- для одной !! не querySelector All
		const statButton = newCard.querySelector(".stat");
		const ava = newCard.querySelector(".item--availability");
		statButton.addEventListener("click", () => {
			// меняем текст статуса
			const newStatus = ava.textContent === "В наличии" ? "В дороге" : "В наличии";
			ava.textContent = newStatus;

			// сохраняем новый статус в localStorage
			let cards = getCards();
			const cardIndex = cards.findIndex(c => c.name === card.name && c.price === card.price);
			if (cardIndex !== -1) {
				cards[cardIndex].availability = newStatus;
				saveCards(cards);
			}
		});
	}

	// загрузка карточек из localStorage при старте
	getCards().forEach(renderCard);

	// добавление новой карточки
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

		// сохраняем и рендерим
		const allCards = getCards();
		allCards.push(card);
		saveCards(allCards);
		renderCard(card);

		form.reset();
	});

	// .................................................................................................................



	//  -- !!!!  ниже код БЕЗ ФОТО - ЕСЛИ НЕ ПРЕДУСМОТРЕНО ФОТО - НЕТ 	reader.readAsDataURL(file); В КОНЦЕ !!!!!


	// ................................  конец добавки карточки.........................................................................



	// ............................................................................................















	// ..........................................................................................................


});