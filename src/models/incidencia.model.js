const mongoose = require('mongoose');

const schema = mongoose.Schema;

let incidenciaSchema = new schema({

	fecha: {type: Date, required: true, default: Date.now},
	foto: {type: String, required: true},
	latitud: {type: Number, required: true},
	longitud: {type: Number, required: true},
	ine: {type: String, required: true, max: 150},
	texto_incidencia: {type: String, required: true, max: 300},
	resuelta: {type: Boolean, required: true, default: false},
	texto_solucion: {type: String, required: false, max: 300, default: ''},

});

module.exports = mongoose.model('incidencia', incidenciaSchema);
