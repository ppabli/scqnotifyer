$(() => {

	$.ajaxSetup({cache: false});

	$(document.body).on('click', '#botonBorrarIncidencia', evento => {

		evento.preventDefault();

		$.post('/borrarIncidencia', {id: $(evento.target).parent().parent().data("id")}, resultado => {

			if (resultado.status == 'ok') {

				$(evento.target).parent().parent().remove();

			}

			$('#alerta').remove();
			$('.card-title').after(`<div id="alerta" class="alert ${resultado.alertType}" role="alert" align=center>${resultado.mensaje}</div>`);
			$('#alerta').hide().fadeIn(3000).delay(500).fadeOut(2500);

		});

	});

});