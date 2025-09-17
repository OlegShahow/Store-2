
// ............................. Создание динамической карточки .............................................................................
//  ...........  отправка сайта на сервер !!!!!!!!


// так же  - добавление карточки в корзину !!!!

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
		// ДОБАВЛЕНО: отправка данных о затратах
		formData.append('cost', cardData.cost || '');

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
		console.log("✅ Карточка добавлена, ID:", result.id || result._id);
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
	const cardId = card.id || card._id; // Поддержка и id и _id
	const newCard = document.createElement("div");
	newCard.classList.add("item--card");
	newCard.dataset.id = cardId;

	// ДОБАВЛЕНО: data-атрибуты для передачи данных в корзину
	newCard.innerHTML = `
    <div class="item--info">
	    <div class="description">
		   <p>${card.description || ""}</p>
		</div>
        <div class="info--public">
		   <div class="item--foto adds">
		      <img src="${card.imgSrc}" alt="${card.name}" onerror="this.style.display='none'">
		   </div>
            <div class="item--name adds"><p>${card.name}</p></div>

			<div class="item--sbor">


               <div class="item--trio">

                    <div class="item--prize adds">
                          <p>${card.price}</p> <img src="./icon/g1.png" alt="@">
                          <!-- ДОБАВЛЕНО: блок с затратами -->
                         <div class="cost"><p>Затраты ${card.cost || ''}</p></div>
                    </div>
           
           
                    <div class="item--availability adds">${card.availability}</div>

                        <div class="item--about adds">
                           <button class="ab">О товаре</button>
                        </div>

		       </div>			  
					  
                 <div class="item--korzina">
                       <!-- ИЗМЕНЕНО: убрана ссылка, добавлены data-атрибуты -->
                       <button type="button" class="korz--btn" 
                           data-id="${cardId}" 
                           data-name="${card.name}" 
                           data-price="${card.price}" 
                           data-img="${card.imgSrc}">
                           <img src="./icon/k2.png" alt="Корзина">
                         </button>
                 </div>
				   
			  </div>
			  
        </div>


        <div class="info--admin">
            <div class="admin--delite"><button class="del">Удалить товар</button></div>
            <div class="admin--status"><button class="stat">Статус</button></div>
            <div class="admin--date"><p>Размещено <br> ${card.date}</p></div>
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
				await deleteCard(cardId);
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
			const newStatus = card.availability === "В наличии" ? "В дороге" : "В наличии";
			await updateCardStatus(cardId, newStatus);
			availabilityElement.textContent = newStatus;
			card.availability = newStatus;
		} catch (err) {
			alert(err.message);
		}
	});

	// ДОБАВЛЕНО: Обработчик кнопки корзины
	const korzBtn = newCard.querySelector('.korz--btn');
	korzBtn.addEventListener('click', function (e) {
		e.preventDefault();
		e.stopPropagation(); // Важно: предотвращаем всплытие события

		const productData = {
			id: this.dataset.id,
			name: this.dataset.name,
			price: this.dataset.price,
			img: this.dataset.img
		};

		addToCart(productData);
	});
}

// =======================================
// Загрузка всех карточек при старте
// =======================================
async function loadAllCards() {
	try {
		console.log("🔄 Загрузка карточек...");
		const cards = await getCards();
		console.log("📦 Полученные карточки:", cards); // Для отладки
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
		const cost = form.cost ? form.cost.value.trim() : ''; // ДОБАВЛЕНО: получение затрат
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
			cost, // ДОБАВЛЕНО: передача затрат
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
// НОВАЯ ФУНКЦИЯ: Добавление товара в корзину
// =======================================
function addToCart(productData) {
	try {
		console.log("🛒 Добавление в корзину:", productData);

		// Получаем текущую корзину или создаем пустую
		let cart = JSON.parse(localStorage.getItem('cart')) || [];

		// Проверяем, есть ли уже такой товар в корзине
		const existingItemIndex = cart.findIndex(item => item.id === productData.id);

		if (existingItemIndex > -1) {
			// Если товар уже есть - увеличиваем количество
			cart[existingItemIndex].quantity += 1;
			console.log("➕ Увеличено количество товара в корзине");
		} else {
			// Если товара нет - добавляем новый
			cart.push({
				id: productData.id,
				name: productData.name,
				price: productData.price,
				img: productData.img,
				quantity: 1
			});
			console.log("✅ Новый товар добавлен в корзину");
		}

		// Сохраняем обновленную корзину в localStorage
		localStorage.setItem('cart', JSON.stringify(cart));

		// Показываем уведомление пользователю
		showCartNotification('Товар добавлен в корзину!');

	} catch (err) {
		console.error('❌ Ошибка при добавлении в корзину:', err);
		showCartNotification('Ошибка при добавлении в корзину', 'error');
	}
}

// =======================================
// НОВАЯ ФУНКЦИЯ: Показ уведомлений о корзине
// =======================================
function showCartNotification(message, type = 'success') {
	// Создаем или находим контейнер для уведомлений
	let notificationContainer = document.getElementById('cart-notifications');
	if (!notificationContainer) {
		notificationContainer = document.createElement('div');
		notificationContainer.id = 'cart-notifications';
		notificationContainer.style.cssText = `
			position: fixed;
			top: 20px;
			right: 20px;
			z-index: 10000;
			display: flex;
			flex-direction: column;
			gap: 10px;
		`;
		document.body.appendChild(notificationContainer);
	}

	// Создаем уведомление
	const notification = document.createElement('div');
	notification.textContent = message;
	notification.style.cssText = `
		background: ${type === 'success' ? '#4CAF50' : '#f44336'};
		color: white;
		padding: 12px 20px;
		border-radius: 6px;
		box-shadow: 0 4px 12px rgba(0,0,0,0.15);
		font-family: Arial, sans-serif;
		font-size: 18px;
		opacity: 0;
		transform: translateX(100%);
		transition: all 0.3s ease;
	`;

	notificationContainer.appendChild(notification);

	// Анимация появления
	setTimeout(() => {
		notification.style.opacity = '1';
		notification.style.transform = 'translateX(0)';
	}, 10);

	// Удаляем через 5 секунды с анимацией
	setTimeout(() => {
		notification.style.opacity = '0';
		notification.style.transform = 'translateX(100%)';

		setTimeout(() => {
			notification.remove();
			if (notificationContainer.children.length === 0) {
				notificationContainer.remove();
			}
		}, 300);
	}, 5000);
}

// =======================================
// Инициализация при загрузке страницы
// =======================================
document.addEventListener('DOMContentLoaded', () => {
	console.log("🚀 Приложение запускается...");
	loadAllCards();

	// ДОБАВЛЕНО: Инициализация корзины при загрузке
	if (localStorage.getItem('cart')) {
		console.log("🛒 Корзина загружена из localStorage");
	} else {
		console.log("🛒 Корзина пуста");
	}
});

console.log("✨ Frontend JavaScript загружен!");

// =======================================
// ДЕЛАЕМ ФУНКЦИИ ГЛОБАЛЬНЫМИ ДЛЯ ОТЛАДКИ
// =======================================
window.loadAllCards = loadAllCards;
window.getCards = getCards;
window.renderCard = renderCard;
window.addCard = addCard;
window.deleteCard = deleteCard;
// ДОБАВЛЕНО: Функции для работы с корзиной
window.addToCart = addToCart;
window.showCartNotification = showCartNotification;