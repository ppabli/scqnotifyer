const mongoose = require('mongoose');

const schema = mongoose.Schema;

let ayuntamientoSchema = new schema({

	nombre: {type: String, required: true, max: 150},
	email: {type: String, required: true, max: 150},
	ine: {type: String, required: true, max: 150},
	codigoAgente: {type: String, required: true, max: 10},
	agentes: [{type: String, required: true, max: 50}]

});

module.exports = mongoose.model('ayuntamiento', ayuntamientoSchema);