$(() => {

	$.ajaxSetup({cache: false});

	$('#actualizarPerfil').hide();
	$('#cancelarEdicion').hide();

	$(document.body).on('click', '#editarPerfil', () => {

		$('.editable').each(function () {

			if ($(this).text() == 'true' || $(this).text() == 'false') {

				if ($(this).text() == 'true') {

					$(this).replaceWith('<input checked type="checkbox" class="editable"/>');

				} else {

					$(this).replaceWith('<input type="checkbox" class="editable"/>');

				}

			} else if ($(this).text().match(new RegExp('@', 'g'))) {

				$(this).replaceWith(`@ <input class="editable" value="${$(this).text()}" maxlength="150">`);

			} else {

				$(this).replaceWith(`<input class="editable" value="${$(this).text()}" maxlength="150">`);

			}

		});

		$('#editarPerfil').hide();
		$('#borrarPerfil').hide();
		$('#actualizarPerfil').show();
		$('#cancelarEdicion').show();

	});

	$(document.body).on('click', '#borrarPerfil', () => {

		$.get('/borrarPerfil', resultado => {

			$('#alerta').remove();
			$('.card-title').after(`<div id="alerta" class="alert ${resultado.alertType}" role="alert" align=center>${resultado.mensaje}</div>`);
			$('#alerta').hide().fadeIn(3000).delay(500).fadeOut(2500, () => {

				if (resultado.status == 'ok') {

					location.reload();

				}

			});

		});

	});

	$(document.body).on('click', '#actualizarPerfil', () => {

		let datos = [];

		$('.editable').each(function () {

			if ($(this).is('input[type=checkbox]')) {

				datos.push($(this).prop('checked'));

			} else {

				datos.push($(this).val());

			}

		});

		$.post('/actualizarPerfil', {data: datos}, resultado => {

			$('#alerta').remove();
			$('.card-title').after(`<div id="alerta" class="alert ${resultado.alertType}" role="alert" align=center>${resultado.mensaje}</div>`);
			$('#alerta').hide().fadeIn(3000).delay(500).fadeOut(2500);
			$('#cancelarEdicion').click();

		});

	});

	$(document.body).on('click', '#cancelarEdicion', () => {

		$('.editable').each(function () {

			if ($(this).is('input[type=checkbox]')) {

				$(this).replaceWith('<label class="editable">' + $(this).prop('checked') + '</label>');

			} else {

				$(this).replaceWith('<label class="editable">' + $(this).val() + '</label>');

			}

		});

		$('#actualizarPerfil').hide();
		$('#cancelarEdicion').hide();
		$('#editarPerfil').show();
		$('#borrarPerfil').show();

	});

});