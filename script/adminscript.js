"use strict";

window.addEventListener('DOMContentLoaded', () => {

	// 	// ---- режим администратора ----

	// // задаём пароль здесь - это если не менять пароль
	// const ADMIN_PASSWORD = "12345";

	// 	// задаём пароль здесь
	// 	let ADMIN_PASSWORD = "12345"; // <- теперь let, чтобы его можно было менять

	// 	// находим форму входа
	// 	const loginForm = document.querySelector(".header__nav--form form"); // получ. нужную форму
	// 	const passwordInput = loginForm.querySelector('input[type="password"]');  // ищим нужный инпут ВВОДА ТЕКУЩЕГО ПАРОЛЯ ДЛЯ ВХОДА !!!
	// 	const exitBtn = loginForm.querySelector(".off--admin");  // закрыть панель


	// 	const formBlockBody = document.querySelector(".form__block"); // форма карточек админа

	// 	// const adminBtns = document.querySelectorAll(".info--admin"); // кнопки админа в карточке
	// 	// так нельзя - это не отразит карточки динамически добавленые !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!



	// // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

	// 	// ---- Смена пароля ----
	// 	const changePasswordDiv = document.querySelector(".change--password"); // блок смены пароля
	// 	const changeInput = changePasswordDiv.querySelector('input[type="password"]'); // поля смены пароля
	// 	const changeBtn = changePasswordDiv.querySelector(".changebtn"); // кнопка смены пароля

	// 	changeBtn.addEventListener("click", (e) => {
	// 		e.preventDefault();
	// 		const newPassword = changeInput.value.trim();

	// 		if (newPassword.length < 4) {
	// 			alert("Пароль слишком короткий. Минимум 4 символа.");
	// 			return;
	// 		}

	// 		ADMIN_PASSWORD = newPassword;
	// 		alert("Пароль успешно изменён!");
	// 		changeInput.value = "";
	// 	});

	// 	// <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<


	// 	// обработка входа
	// 	loginForm.addEventListener("submit", (e) => {
	// 		e.preventDefault();



	// 		if (passwordInput.value === ADMIN_PASSWORD) {
	// 			// показать все админ-блоки (включая динамически добавленные) !!!!!!!!!!!!
	// 			document.querySelectorAll(".info--admin").forEach(block => {
	// 				block.style.display = "flex"; // или "block"

	// 				formBlockBody.style.display = "block";
	// 			});
	// 			alert("Режим администратора включён");
	// 			passwordInput.value = ""; // очистим поле
	// 		} else {
	// 			alert("Неверный пароль");
	// 		}
	// 	});

	// 	// обработка выхода
	// 	exitBtn.addEventListener("click", (e) => {
	// 		e.preventDefault();
	// 		// ВЫКЛЮЧИТЬ все админ-блоки (включая динамически добавленные) !!!!!!!!!!!!
	// 		document.querySelectorAll(".info--admin").forEach(block => {
	// 			block.style.display = "none";

	// 			formBlockBody.style.display = "none";
	// 		});
	// 		alert("Режим администратора выключен");
	// 	});


	// ---- режим администратора ----


	// // задаём пароль здесь -   const     это если не менять пароль
	// const ADMIN_PASSWORD = "12345";


	// ---- Задаём пароль ----
	// Берём пароль из localStorage, если он там есть, иначе дефолт "12345"
	let ADMIN_PASSWORD = localStorage.getItem("adminPassword") || "12345"; // <- теперь пароль сохраняется между перезагрузками

	// находим форму входа
	const loginForm = document.querySelector(".header__nav--form form"); // получаем нужную форму
	const passwordInput = loginForm.querySelector('input[type="password"]');  // ищем нужный инпут ВВОДА ТЕКУЩЕГО ПАРОЛЯ ДЛЯ ВХОДА !!!
	const exitBtn = loginForm.querySelector(".off--admin");  // кнопка выхода из режима администратора

	const formBlockBody = document.querySelector(".form__block"); // форма карточек админа

	// ---- Смена пароля ----
	const changePasswordDiv = document.querySelector(".change--password"); // блок смены пароля
	const changeInput = changePasswordDiv.querySelector('input[type="password"]'); // поле ввода нового пароля
	const changeBtn = changePasswordDiv.querySelector(".changebtn"); // кнопка смены пароля

	changeBtn.addEventListener("click", (e) => {
		e.preventDefault();
		const newPassword = changeInput.value.trim();

		if (newPassword.length < 4) {
			alert("Пароль слишком короткий. Минимум 4 символа.");
			return;
		}

		ADMIN_PASSWORD = newPassword; // обновляем текущий пароль
		localStorage.setItem("adminPassword", ADMIN_PASSWORD); // <- сохраняем в localStorage, чтобы пароль остался после перезагрузки
		alert("Пароль успешно изменён!");
		changeInput.value = "";
	});

	// обработка входа
	loginForm.addEventListener("submit", (e) => {
		e.preventDefault();

		if (passwordInput.value === ADMIN_PASSWORD) {
			// показать все админ-блоки (включая динамически добавленные) !!!!!!!!!!!!
			document.querySelectorAll(".info--admin").forEach(block => {
				block.style.display = "flex"; // или "block"
			});


			// ДОБАВЛЕНО: показать блоки с затратами
			document.querySelectorAll(".cost").forEach(costBlock => {
				costBlock.style.display = "block";
			});


			formBlockBody.style.display = "block";
			alert("Режим администратора включён");
			passwordInput.value = ""; // очистим поле
		} else {
			alert("Неверный пароль");
		}
	});

	// обработка выхода
	exitBtn.addEventListener("click", (e) => {
		e.preventDefault();
		// ВЫКЛЮЧИТЬ все админ-блоки (включая динамически добавленные) !!!!!!!!!!!!
		document.querySelectorAll(".info--admin").forEach(block => {
			block.style.display = "none";
		});

		// ДОБАВЛЕНО: скрыть блоки с затратами
		document.querySelectorAll(".cost").forEach(costBlock => {
			costBlock.style.display = "none";
		});


		formBlockBody.style.display = "none";
		alert("Режим администратора выключен");
	});



});