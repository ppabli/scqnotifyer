$(() => {

	let map = '';

	map = L.map('map').setView([42.880510, -8.545590], 14);

	L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, <a href="https://solarmobi.iessanclemente.net">SolarMobi</a>',maxZoom: 22}).addTo(map);

	L.control.scale().addTo(map);

	for (incidencia in incidencias) {

		let marker = L.marker([incidencias[incidencia].latitud, incidencias[incidencia].longitud]).addTo(map);

		marker.bindPopup(

			`ID: ${incidencias[incidencia]._id} 
			<br> 
			Fecha: ${incidencias[incidencia].fecha}
			<br> 
			Coordenadas: ${incidencias[incidencia].latitud} : ${incidencias[incidencia].longitud}
			<br> 
			Descripcion: ${incidencias[incidencia].texto_incidencia}
			<br> 
			Resuelta: ${incidencias[incidencia].resuelta}
			<br> 
			Solucion: ${incidencias[incidencia].texto_solucion}
			<br> 
			<img width="150" height="100" src='img/${incidencias[incidencia].foto}'>

		`);

		if (id && incidencias[incidencia]._id == id) {

			map.setView([incidencias[incidencia].latitud, incidencias[incidencia].longitud], 14);
			marker.openPopup();

		}

		marker.on('mouseover', function (e) {

			this.openPopup();

		});

		marker.on('mouseout', function (e) {

			this.closePopup();

		});

	}

})