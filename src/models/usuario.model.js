const mongoose = require('mongoose');
const incidencia = require('./incidencia.model');

const schema = mongoose.Schema;

let usuarioSchema = new schema({

	nombre: {type: String, required: true, max: 150},
	apellidos: {type: String, required: false, default: '', max: 150},
	nick: {type: String, required: false, default: '', max: 150},
	telegram: {type: String, required: true, max: 50},
	email: {type: String, required: false, default: '', max: 150},
	notificar: {type: Boolean, required: true, default: true},
	estadoTelegram: {type: String, required: false, max: 50, default: ''},
	incidencia_foto: {type: String, required: false, default: '', max: 150},
	incidencia_coordenadas: {type: String, required: false, default: '', max: 150},
	incidencia_texto: {type: String, required: false, default: '', max: 150},
	incidencias: [incidencia.schema],
	registro_ine: {type: String, required: false, default: '', max: 150},
	registro_codigo: {type: String, required: false, default: '', max: 10},
	codigosIne: [{type: String, required: true, max: 150}]

});

module.exports = mongoose.model('usuario', usuarioSchema);