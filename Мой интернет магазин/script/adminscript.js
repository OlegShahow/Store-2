"use strict";

window.addEventListener('DOMContentLoaded', () => {





	// ---- режим администратора ----

	// задаём пароль здесь
	const ADMIN_PASSWORD = "12345";

	// находим форму входа
	const loginForm = document.querySelector(".header__nav--form form"); // получ. нужную форму
	const passwordInput = loginForm.querySelector('input[type="password"]');  // ищим нужный инпут
	const exitBtn = loginForm.querySelector(".off--admin");  // закрыть панель


	const formBlockBody = document.querySelector(".form__block"); // форма карточек админа

	// const adminBtns = document.querySelectorAll(".info--admin"); // кнопки админа в карточке
	// так нельзя - это не отразит карточки динамически добавленые !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!


	// обработка входа
	loginForm.addEventListener("submit", (e) => {
		e.preventDefault();

	

		if (passwordInput.value === ADMIN_PASSWORD) {
			// показать все админ-блоки (включая динамически добавленные) !!!!!!!!!!!!
			document.querySelectorAll(".info--admin").forEach(block => {
				block.style.display = "flex"; // или "block"

				formBlockBody.style.display = "block";
			});
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

			formBlockBody.style.display = "none";
		});
		alert("Режим администратора выключен");
	});

});