$(() => {

	$.ajaxSetup({cache: false});

	$('#cancelarAdicion').hide();

	$(document.body).on('click', '#botonBorrarAyuntamiento', evento => {

		evento.preventDefault();

		$.post('/borrarAyuntamiento', {id: $(evento.target).parent().parent().data("id")}, resultado => {

			if (resultado.status == 'ok') {

				$(evento.target).parent().parent().remove();

			}

			$('#alerta').remove();
			$('.card-title').after(`<div id="alerta" class="alert ${resultado.alertType}" role="alert" align=center>${resultado.mensaje}</div>`);
			$('#alerta').hide().fadeIn(3000).delay(500).fadeOut(2500);

		});

	});

	$(document.body).on('click', '#añadirAyuntamiento', evento => {

		evento.preventDefault();

		$('#añadirAyuntamiento').hide().before('<form style="display: inline"><label class="mr-2">Nombre ayuntamiento</label><input max="150" id="nombre" required class="mr-2" type="text"></input><label class="mr-2"> Email ayuntamiento</label><input required max="150" id="email" class="mr-2" type="email"></input><button class="btn btn-success btn-rounded" type="submit"><a><i class="fas fa-user-slash"></i> Confirmar edicion </a></button></form>');
		$('#cancelarAdicion').show();

	});

	$(document.body).on('submit', 'form', evento => {

		evento.preventDefault();

		$.get('https://public.opendatasoft.com/api/records/1.0/search/?dataset=espana-municipios&rows=1&refine.municipio=' + $('#nombre').val(), resultado => {

			if (resultado.records.length != 0) {

				$.post('/agregarAyuntamiento', {nombre: resultado.records[0].fields.municipio, email: $('#email').val(), ine: resultado.records[0].fields.codigo_postal || resultado.records[0].fields.municipio}, resultado => {

					$('#alerta').remove();
					$('.card-title').after(`<div id="alerta" class="alert ${resultado.alertType}" role="alert" align=center>${resultado.mensaje}</div>`);
					$('#alerta').hide().fadeIn(3000).delay(500).fadeOut(2500);

				});

			} else {

				$('#alerta').remove();
				$('.card-title').after(`<div id="alerta" class="alert alert-warning" role="alert" align=center>Ayuntamiento no valido</div>`);
				$('#alerta').hide().fadeIn(3000).delay(500).fadeOut(2500);

			}

		});

	});

	$(document.body).on('click', '#cancelarAdicion', evento => {

		evento.preventDefault();

		$('.card-footer > form').remove();
		$('#añadirAyuntamiento').show();
		$('#cancelarAdicion').hide();

	});

});