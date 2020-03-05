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

	$.ajaxSetup({cache: false});

	$(document.body).on('submit', '#formularioMeteo', evento => {

		evento.preventDefault();

		$.post('/obtenerMeteo', {ciudad: escapeHtml($('#ciudad').val())}, resultado => {

			if (resultado.status == 'ok') {

				$('div#contenido').remove();

				if (resultado.data) {

					let date = new Date(resultado.data.sys.sunrise * 1000);
					let minutos = "0" + date.getMinutes();
					let horaAmanecer = date.getHours() + ':' + minutos.substr(-2);

					date = new Date(resultado.data.sys.sunset * 1000);
					minutos = "0" + date.getMinutes();
					let horaPuesta = date.getHours() + ':' + minutos.substr(-2);

					$('fieldset').append(`<div id="contenido">Informacion metereologica sobre <strong>${resultado.data.name}</strong><br/>Méteo actual:<br/><img src='http://openweathermap.org/img/wn/${resultado.data.weather[0].icon}@2x.png' alt='${resultado.data.weather[0].description}'/><br/>Coordenadas (latitud,longitud): <strong>(${resultado.data.coord.lat},${resultado.data.coord.lon})</strong>.<br/>Temperatura actual: <strong>${resultado.data.main.temp}ºC</strong>.<br/>Sensación térmica: <strong>${resultado.data.main.feels_like}ºC</strong>.<br/>Temperatura mínima: <strong>${resultado.data.main.temp_min}ºC</strong>.<br/>Temperatura máxima: <strong>${resultado.data.main.temp_max}ºC</strong>.<br/>Presión atmosférica: <strong>${resultado.data.main.pressure}</strong>.<br/>Velocidad del viento: <strong>${resultado.data.wind.speed} Km/h</strong>.<br/>Dirección del viento: <strong>${resultado.data.wind.deg}</strong>.<br/>Hora amanecer: <strong>${horaAmanecer}</strong>.<br/>Hora puesta de sol: <strong>${horaPuesta}</strong>.<br/>Humedad: <strong>${resultado.data.main.humidity}%</strong></div>`);

				} else {

					$('fieldset').append(`<div id="contenido">${resultado.mensaje}</div>`);

				}

			} else {

				$('fieldset').append(`<div id="contenido">${resultado.mensaje}</div>`);

			}

		});

	});

});