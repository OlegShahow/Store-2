"use strict";



window.addEventListener('DOMContentLoaded', () => {




	// =======================================
	// ФУНКЦИЯ ЗАГРУЗКИ И ОТОБРАЖЕНИЯ КОРЗИНЫ
	// =======================================
	function loadCart() {
		console.log('🛒 Загрузка корзины...');

		// Получаем элементы DOM
		const cart = JSON.parse(localStorage.getItem('cart')) || [];
		const cartContainer = document.querySelector('.cart-items');
		const emptyCart = document.querySelector('.cart-empty');
		const totalAmount = document.querySelector('.total-amount');
		const checkoutBtn = document.querySelector('.checkout-btn');

		// Очищаем контейнер товаров
		cartContainer.innerHTML = '';

		// Проверяем пустая ли корзина
		if (cart.length === 0) {
			emptyCart.style.display = 'block';
			totalAmount.textContent = '0';
			checkoutBtn.disabled = true;
			checkoutBtn.style.opacity = '0.5';
			console.log('📭 Корзина пуста');
			return;
		}

		// Корзина не пуста - скрываем сообщение
		emptyCart.style.display = 'none';
		checkoutBtn.disabled = false;
		checkoutBtn.style.opacity = '1';

		let total = 0;

		// Создаем и добавляем каждый товар в корзину
		cart.forEach((item, index) => {
			// Преобразуем цену в число и вычисляем сумму за товар
			const price = parseFloat(item.price) || 0;
			const itemTotal = price * item.quantity;
			total += itemTotal;

			// Создаем HTML для товара в корзине с НОВОЙ СТРУКТУРОЙ
			const cartItem = document.createElement('div');
			cartItem.classList.add('cart-item');
			cartItem.dataset.index = index;
			cartItem.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-image">
                    <img src="${item.img}" alt="${item.name}" onerror="this.style.display='none'">
                </div>
                <h3>${item.name}</h3>
                <p class="item-price">Цена: ${price} грн</p>
                <div class="cart-item-controls">
                    <button class="quantity-btn minus" data-action="minus">-</button>
                    <span class="quantity">${item.quantity}</span>
                    <button class="quantity-btn plus" data-action="plus">+</button>
                    <p class="item-total">Сумма: ${itemTotal.toFixed(2)} грн</p>
                    <button class="remove-btn" data-action="remove">Удалить</button>
                </div>
            </div>
        `;

			cartContainer.appendChild(cartItem);
		});

		// Обновляем общую сумму с округлением до 2 знаков
		totalAmount.textContent = total.toFixed(2);
		console.log(`💰 Общая сумма: ${total.toFixed(2)} грн`);
	}

	// =======================================
	// ФУНКЦИЯ ОБНОВЛЕНИЯ КОЛИЧЕСТВА ТОВАРА
	// =======================================
	function updateQuantity(index, change) {
		console.log(`🔄 Изменение количества товара ${index} на ${change}`);

		const cart = JSON.parse(localStorage.getItem('cart')) || [];

		// Проверяем существует ли товар с таким индексом
		if (cart[index]) {
			// Изменяем количество
			cart[index].quantity += change;

			// Если количество стало 0 или меньше - удаляем товар
			if (cart[index].quantity <= 0) {
				console.log(`🗑️ Удаление товара: ${cart[index].name}`);
				cart.splice(index, 1);
			}

			// Сохраняем обновленную корзину в localStorage
			localStorage.setItem('cart', JSON.stringify(cart));

			// Перезагружаем корзину для отображения изменений
			loadCart();
		}
	}

	// =======================================
	// ФУНКЦИЯ УДАЛЕНИЯ ТОВАРА ИЗ КОРЗИНЫ
	// =======================================
	function removeItem(index) {
		console.log(`🗑️ Запрос на удаление товара с индексом ${index}`);

		const cart = JSON.parse(localStorage.getItem('cart')) || [];

		if (cart[index]) {
			console.log(`✅ Удаление: ${cart[index].name}`);

			// Удаляем товар из массива
			cart.splice(index, 1);

			// Сохраняем обновленный массив
			localStorage.setItem('cart', JSON.stringify(cart));

			// Обновляем отображение корзины
			loadCart();

			// Показываем уведомление
			showNotification('Товар удален из корзины');
		}
	}

	// =======================================
	// ДЕЛЕГИРОВАНИЕ СОБЫТИЙ - ОБРАБОТЧИК НА КОНТЕЙНЕРЕ КОРЗИНЫ
	// =======================================
	document.querySelector('.cart__container').addEventListener('click', function (e) {
		// Находим ближайший элемент товара
		const cartItem = e.target.closest('.cart-item');
		if (!cartItem) return;

		// Получаем индекс товара из data-атрибута
		const index = parseInt(cartItem.dataset.index);

		// Обрабатываем кнопки с data-action
		if (e.target.dataset.action === 'plus') {
			// Увеличиваем количество на 1
			updateQuantity(index, 1);
		}
		else if (e.target.dataset.action === 'minus') {
			// Уменьшаем количество на 1
			updateQuantity(index, -1);
		}
		else if (e.target.dataset.action === 'remove') {
			// Полностью удаляем товар
			if (confirm('Удалить этот товар из корзины?')) {
				removeItem(index);
			}
		}
	});

	// =======================================
	// ОБРАБОТЧИК КНОПКИ ОФОРМЛЕНИЯ ЗАКАЗА
	// =======================================
	document.querySelector('.checkout-btn').addEventListener('click', function () {
		const cart = JSON.parse(localStorage.getItem('cart')) || [];
		const totalAmount = document.querySelector('.total-amount').textContent;

		if (cart.length === 0) {
			alert('Корзина пуста!');
			return;
		}

		// Подтверждение оформления заказа
		if (confirm(`Оформить заказ на сумму ${totalAmount} грн?`)) {
			// Здесь будет логика отправки заказа на сервер
			console.log('✅ Заказ оформлен:', cart);

			// Показываем сообщение об успехе
			alert(`Заказ оформлен! Сумма: ${totalAmount} грн\nСпасибо за покупку!`);

			// Очищаем корзину после оформления
			localStorage.removeItem('cart');

			// Обновляем отображение
			loadCart();
		}
	});

	// =======================================
	// ФУНКЦИЯ ПОКАЗА УВЕДОМЛЕНИЙ
	// =======================================
	function showNotification(message, type = 'success') {
		// Создаем элемент уведомления
		const notification = document.createElement('div');
		notification.textContent = message;
		notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : '#f44336'};
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 1000;
        font-family: Arial, sans-serif;
    `;

		// Добавляем на страницу
		document.body.appendChild(notification);

		// Удаляем через 5 секунда
		setTimeout(() => {
			notification.remove();
		}, 5000);
	}

	// =======================================
	// ИНИЦИАЛИЗАЦИЯ КОРЗИНЫ ПРИ ЗАГРУЗКЕ СТРАНИЦЫ
	// =======================================
	console.log('🚀 Страница корзины загружена');
	loadCart();

	// Добавляем стиль для disabled кнопки
	const style = document.createElement('style');
	style.textContent = `
    .checkout-btn:disabled {
        cursor: not-allowed;
        opacity: 0.5;
    }
    .cart-item {
        transition: all 0.3s ease;
    }
    .cart-item-removing {
        opacity: 0;
        transform: translateX(100%);
    }
`;
	document.head.appendChild(style);

	// =======================================
	// ДЕБАГ ФУНКЦИИ ДЛЯ ОТЛАДКИ
	// =======================================
	window.debugCart = {
		loadCart,
		updateQuantity,
		removeItem,
		clearCart: function () {
			localStorage.removeItem('cart');
			loadCart();
			console.log('🧹 Корзина очищена');
		}
	};


	// ..................   ПОЛНАЯ ОЧИСТКА КОРЗИНЫ ЧЕРЕЗ КНОПКУ  .......................................



	document.querySelector('.clear-corzina').addEventListener('click', () => {
		if (confirm('Вы уверены, что хотите очистить корзину?')) {
			localStorage.removeItem('cart');
			loadCart(); // Обновляем отображение
			alert('Корзина очищена!');
		}
	});


	// ................................    отправка формы из корзины ..................


	// =======================================
	// ДОБАВЛЯЕМ ПОСЛЕ ВСЕГО КОДА (В КОНЕЦ ФАЙЛА)
	// =======================================

	// Функция отправки данных в Formspree
	function sendOrderToFormspree(cart, totalAmount) {
		// Создаем временную форму (не добавляем в DOM)
		const formData = new FormData();

		// Добавляем общие данные
		formData.append('total_amount', totalAmount + ' грн');
		formData.append('order_date', new Date().toLocaleString('ru-RU'));
		formData.append('items_count', cart.length + ' шт.');

		// Добавляем данные каждого товара
		cart.forEach((item, index) => {
			const itemTotal = (item.price * item.quantity).toFixed(2);

			formData.append(`product_${index + 1}_name`, item.name || 'Без названия');
			formData.append(`product_${index + 1}_price`, item.price + ' грн');
			formData.append(`product_${index + 1}_quantity`, item.quantity + ' шт.');
			formData.append(`product_${index + 1}_total`, itemTotal + ' грн');
		});

		// Отправляем данные
		fetch('https://formspree.io/f/xpwjbozp', {
			method: 'POST',
			body: formData,
			headers: {
				'Accept': 'application/json'
			}
		})
			.then(response => response.json())
			.then(data => {
				console.log('✅ Данные отправлены в Formspree');
			})
			.catch(error => {
				console.error('❌ Ошибка отправки:', error);
			});
	}

	// Модифицируем обработчик оформления заказа (ДОБАВЛЯЕМ ОДНУ СТРОЧКУ)
	const originalCheckoutHandler = document.querySelector('.checkout-btn').onclick;
	document.querySelector('.checkout-btn').onclick = function () {
		const cart = JSON.parse(localStorage.getItem('cart')) || [];
		const totalAmount = document.querySelector('.total-amount').textContent;

		if (cart.length === 0) {
			alert('Корзина пуста!');
			return;
		}

		if (confirm(`Оформить заказ на сумму ${totalAmount} грн?`)) {
			// ДОБАВЛЯЕМ ЭТУ СТРОЧКУ ДЛЯ ОТПРАВКИ
			sendOrderToFormspree(cart, totalAmount);

			console.log('✅ Заказ оформлен:', cart);
			alert(`Заказ оформлен! Сумма: ${totalAmount} грн\nСпасибо за покупку!`);

			localStorage.removeItem('cart');
			loadCart();
		}
	};


});