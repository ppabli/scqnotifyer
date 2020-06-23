$(() => {

	$.ajaxSetup({cache: false});

	$(document.body).on('submit', '#editarAyuntamiento', evento => {

		evento.preventDefault();

		$.post("/actualizarAyuntamiento", {id: $('#id').val(), email: $('#email').val()}, resultado => {

			$('#alerta').remove();
			$('.card-title').after(`<div id="alerta" class="alert ${resultado.alertType}" role="alert" align=center>${resultado.mensaje}</div>`);
			$('#alerta').hide().fadeIn(3000).delay(500).fadeOut(2500);

		});

	});

});