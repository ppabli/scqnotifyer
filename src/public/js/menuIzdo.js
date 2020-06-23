$(() => {

	function escapeHtml(text) {

		var map = {

			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;',
			'"': '&quot;',
			"'": '&#039;'

		};

		return text.replace(/[&<>"']/g, function(m) { return map[m]; });

	}

	if (!cliente.solucionar) {

		$(document.body).on('click', '.activadorModal', evento => {

			evento.preventDefault();

			$('#ruta').remove();
			$('#modal').modal('toggle');
			$('.modal-body p:first-child').after('<p id="ruta"> URL solicitada: <a id="url" class="disabled" href="' + $(evento.target).attr('href') + '">' + $(evento.target).attr('href') + '</a></p>');

		});

		$(document.body).on('click', '#comprobarContraseña', () => {

			let password = escapeHtml($('#contraseña').val());

			$.post('/comprobarPassword', {password: password}, resultado => {

				if (resultado.status == 'error') {

					$('#alerta').remove();
					$('.modal-body').append(`<div id="alerta" class="mt-4 alert ${resultado.alertType}" role="alert" align=center>${resultado.mensaje}</div>`);
					$('#alerta').hide().fadeIn(3000).delay(500).fadeOut(2500).delay(1);

				} else {

					location.href = $('#url').attr('href');

				}

			});

		});

	}

})