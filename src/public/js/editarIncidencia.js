$(() => {

	$.ajaxSetup({cache: false});

	$(document.body).on('submit', '#editarIncidencia', evento => {

		evento.preventDefault();

		$.post("/actualizarIncidencia", {id: $('#id').val(), texto_incidencia: $('#texto_incidencia').val(), texto_solucion: $('#texto_solucion').val(), resuelta: $('#resuelta').prop('checked')}, resultado => {

			$('#alerta').remove();
			$('.card-title').after(`<div id="alerta" class="alert ${resultado.alertType}" role="alert" align=center>${resultado.mensaje}</div>`);
			$('#alerta').hide().fadeIn(3000).delay(500).fadeOut(2500);

		});

	});

});