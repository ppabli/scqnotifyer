const logger = require('./../logs/logger');

log = (req, res, next) => {

	logger.info(`${req.method} ${req.url} Nueva conexion`);
	next();

}

usuarioConectado = (req, res, next) => {

	cliente = req.session.cliente || null;
	logger.info(`${req.method} ${req.url} Usuario conectado`);
	next();

}

rutasPrivadas = (req, res, next) => {

	if (!cliente) {

		res.status(403).send('<h1 style="font-size: 18em; text-align: center" > No tienes permisos!! </h1><p style="text-align: center"><a href="/login">a18pablolc.ddns.net/login</a></p>');

	} else {

		next();

	}

};

rutasAgente = (req, res, next) => {

	if (!cliente.agente && !cliente.solucionar) {

		res.status(403).send('<h1 style="font-size: 18em; text-align: center" > No tienes permisos!! </h1><p style="text-align: center"><a href="/login">a18pablolc.ddns.net/login</a></p>');

	} else {

		next();

	}

};


rutasAdmin = (req, res, next) => {

	if (!cliente.solucionar) {

		res.status(403).send('<h1 style="font-size: 18em; text-align: center" > No tienes permisos!! </h1><p style="text-align: center"><a href="/login">a18pablolc.ddns.net/login</a></p>');

	} else {

		next();

	}

};

module.exports = {log, usuarioConectado, rutasPrivadas, rutasAgente, rutasAdmin};