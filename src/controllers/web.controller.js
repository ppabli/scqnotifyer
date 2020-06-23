const usuario = require('../models/usuario.model');
const ayuntamiento= require('../models/ayuntamiento.model');
const fs = require('fs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

function escapeHtml(text) {

	var map = {

		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#039;'

	};

	return text.replace(/[&<>"']/g, function (m) {

		return map[m];

	});

}

exports.raiz = (req, res) => {

	res.render('index', {titulo: "SCQN - Index"});

};

exports.info = (req, res) => {

	res.render('info', {titulo: "SCQN - Info"});

};

exports.incidencias = (req, res) => {

	usuario.find({}, (error, resultados) => {
		
		if (error) {

			res.status(200).send({status: 'ok', mensaje: 'Error listando incidencias'});

		} else {

			let datos = [];

			for (resultado in resultados) {

				for (incidencia in resultados[resultado].incidencias) {

					if (datos.length == 0) {

						datos.push(resultados[resultado].incidencias[incidencia]);

					} else {

						for (let i = 0; i < datos.length; i++) {

							if ((datos[i].fecha - resultados[resultado].incidencias[incidencia].fecha) < 0) {

								datos.splice(i, 0, resultados[resultado].incidencias[incidencia]);

								break;

							}

							if (i == datos.length - 1) {

								datos.push(resultados[resultado].incidencias[incidencia]);

								break;

							}

						}

					}

				}

			}

			res.render('incidencias', {titulo: "SCQN - Incidencias", incidencias: datos.slice(0, 10)});

		}

	});

};

exports.mapa = (req, res) => {

	usuario.find({}, (error, resultados) => {

		if (error) {

			res.status(200).send({status: 'ok', mensaje: 'Error cargando el mapa'});

		} else {

			let datos = [];

			for (resultado in resultados) {

				for (incidencia in resultados[resultado].incidencias) {

					if (resultados[resultado].incidencias[incidencia].resuelta == false || req.query.id == resultados[resultado].incidencias[incidencia]._id) {

						datos.push(resultados[resultado].incidencias[incidencia]);

					}

				}

			}

			if (req.query.id) {

				res.render('mapa', {titulo: "SCQN - Mapa", incidencias: datos, id: req.query.id});

			} else {

				res.render('mapa', {titulo: "SCQN - Mapa", incidencias: datos, id: ''});

			}

		}

	});

};

exports.meteo = function (req, res) {

	res.render('meteo', {titulo: "SCQN - Meteo"});

};

exports.obtenerMeteo = (req, res) => {

	const request = require('request');

	request(`http://api.openweathermap.org/data/2.5/weather?q=${req.body.ciudad}&appid=${process.env.API_KEY}&units=metric`, (err, respuesta, body) => {

		if (err) {

			res.status(200).json({status: 'error', mensaje: 'Error en la peticion'});

		} else {

			let info = JSON.parse(body);

			if (info.main == undefined) {

				res.status(200).json({status: 'ok', mensaje: 'No se ha encontrado la ciudad - ' + req.body.ciudad});

			} else {

				res.status(200).json({status: 'ok', data: info});

			}

		}

	});

};

exports.login = (req, res) => {

	res.render('login', {titulo: "SCQN - Login" });

};

exports.grabarSesion = (req, res) => {

	req.session.cliente = {};

	usuario.find({ "telegram": req.body.id }, (error, resultado) => {

		if (error) {

			res.status(200).json({status: 'error', mensaje: 'Error comprobando el nuevo  usuario'});

		} else {

			if (!resultado.length) {

				if (req.body.last_name) {

					apellidos = req.body.last_name.substring(0, 150);

				} else {

					apellidos = '';

				}

				if (req.body.username) {

					nick = req.body.username.substring(0, 150);

				} else {

					nick = '';

				}

				if (req.body.email) {

					email = req.body.email.substring(0, 150);

				} else {

					email = '';

				}

				elUsuario = new usuario({nombre: req.body.first_name.substring(0, 150), apellidos: apellidos, nick: nick, telegram: req.body.id, email: email, auth_date: req.body.auth_date, incidencias: []});
				elUsuario.save(error => {

					if (error) {

						res.status(200).json({status: 'error', mensaje: 'Error creando el nuevo  usuario'});

					} else {

						req.session.cliente.id = elUsuario.telegram;
						req.session.cliente.nombre = elUsuario.nombre;
						req.session.cliente.apellidos = elUsuario.apellidos;
						req.session.cliente.nick = elUsuario.nick;
						req.session.cliente.email = elUsuario.email;
						req.session.cliente.solucionar = false;
						req.session.cliente.agente = false;
						req.session.cliente.notificar = elUsuario.notificar;

						res.status(200).json({status: 'ok', mensaje: 'Usuario creado correctamente'});

					}

				});

			} else {

				elUsuario = resultado[0];

				req.session.cliente.id = elUsuario.telegram;
				req.session.cliente.nombre = elUsuario.nombre;
				req.session.cliente.apellidos = elUsuario.apellidos;
				req.session.cliente.nick = elUsuario.nick;
				req.session.cliente.email = elUsuario.email;
				req.session.cliente.solucionar = false;
				req.session.cliente.notificar = elUsuario.notificar;
				req.session.cliente.agente = false;

				ayuntamiento.find({}, (error, resultados2) => {

					if (error) {

						res.status(200).json({status: 'error', mensaje: 'Error grabando usuario'});

					} else {

						for (resultado2 in resultados2) {

							if (resultados2[resultado2].agentes.indexOf(elUsuario.telegram) != -1) {

								req.session.cliente.agente = true;
								break;

							}

						}

						res.status(200).json({status: 'ok'});

					}

				});

			}

		}

	});

};

exports.desconectar = function (req, res) {

	req.session.destroy((error) => {

		if (error) {

			res.end('Error cerrando sesion');

		} else {

			res.writeHead(307, { Location: '/' });
			res.end();

		}

	});

};

exports.ayuntamientos = (req, res) => {

	ayuntamiento.find({}, (error, resultado) => {

		if (error) {

			res.status(200).json({status: 'error', alertType: 'alert-warning', mensaje: 'Error listando ayuntamientos'});

		} else {

			res.render('ayuntamientos', {titulo: "SCQN - Ayuntamientos registrados", ayuntamientos: resultado});

		}

	});

}

// Rutas privadas

exports.borrarIncidencia = (req, res) => {

	usuario.find({}, (error, resultado) => {

		if (error) {

			res.status(200).json({ status: 'error', alertType: 'alert-warning', mensaje: 'Error buscando el usuario' });

		} else {

			for (valor in resultado) {

				for (incidencia in resultado[valor].incidencias) {

					if (resultado[valor].incidencias[incidencia]._id == req.body.id && (resultado[valor].telegram == cliente.id || cliente.solucionar || cliente.codigosIne.indexOf(resultado[valor].incidencias[incidencia].ine) != -1)) {

						fs.unlink('./public/img/' + resultado[valor].incidencias[incidencia].foto, () => { });

						resultado[valor].incidencias.splice(incidencia, 1);

						resultado[valor].save(error => {

							if (error) {

								res.status(200).json({status: 'error', alertType: 'alert-warning', mensaje: 'Error borrando la incidencia'});

							} else {

								res.status(200).json({status: 'ok', alertType: 'alert-success', mensaje: 'Incidencia borrada correctamente'});

							}

						});

					}

				}

			}

		}

	});

}

exports.borrarPerfil = (req, res) => {

	ayuntamiento.find({}, (error, resultados) => {

		if (error) {

			res.status(200).json({status: 'error', alertType: 'alert-warning', mensaje: 'Error borrando el agente'});

		} else {

			for (resultado in resultados) {

				if (resultados[resultado].agentes.indexOf(cliente.id) != -1) {

					resultados[resultado].agentes.splice(resultados[resultado].agentes.indexOf(cliente.id), 1);

				}

				resultados[resultado].save();

			}

			usuario.deleteOne({ 'telegram': cliente.id }, (error) => {

				if (error) {

					res.status(200).json({status: 'error', alertType: 'alert-warning', mensaje: 'Error borrando el usuario'});

				} else {

					fs.readdir('./public/img', (err, files) => {

						for (file in files) {

							if (files[file].split('-')[0] == cliente.id) {

								fs.unlink('./public/img/' + files[file], () => { });

							}

						};

						req.session.destroy(error => {

							if (error) {

								res.status(200).json({status: 'error', alertType: 'alert-warning', mensaje: 'Error borrando la sesion del usuario'});

							} else {

								res.status(200).json({status: 'ok', alertType: 'alert-success', mensaje: 'Usuario borrado correctamente'});

							}

						});

					});

				}

			});

		}

	});

}

exports.perfil = (req, res) => {

	res.render('perfil', { 'titulo': 'SCQ - Perfil' });

};

exports.editarIncidencia = (req, res) => {

	usuario.find({}, (error, resultado) => {

		if (error) {

			res.status(200).json({status: 'error', mensaje: 'Error usuario'});

		} else {

			for (valor in resultado) {

				for (incidencia in resultado[valor].incidencias) {

					if (resultado[valor].incidencias[incidencia]._id == req.query.id && (resultado[valor].telegram == cliente.id || cliente.solucionar)) {

						res.render('editarIncidencia', {titulo: 'SCQ - Editar incidencia', incidencia: resultado[valor].incidencias[incidencia]});

					}

				}

			}

		}

	});

}

exports.misIncidencias = (req, res) => {

	usuario.find({"telegram": cliente.id}, (error, resultado) => {

		if (error) {

			res.status(200).json({status: 'error', mensaje: 'Error usuario'});

		} else {

			res.render('misincidencias', {titulo: 'SCQ - Mis incidencias', incidencias: resultado[0].incidencias});

		}

	});

};

exports.comprobarPassword = (req, res) => {

	if (req.body.password && req.body.password != '') {

		if (crypto.createHash("sha256").update(req.body.password).digest("hex") == crypto.createHash("sha256").update(process.env.ADMIN_PASSWORD).digest("hex")) {

			cliente.solucionar = true;

			res.status(200).json({status: 'ok', alertType: 'alert-success', mensaje: 'Contraseña correcta'});

		} else {

			res.status(200).json({status: 'error', alertType: 'alert-warning', mensaje: 'Contraseña incorrecta'});

		}

	} else {

		res.status(200).json({status: 'error', alertType: 'alert-danger', mensaje: 'Falta contraseña'});

	}

}

exports.actualizarPerfil = (req, res) => {

	usuario.updateOne({ "telegram": cliente.id }, { $set: { "nombre": req.body.data[0], "apellidos": req.body.data[1], "nick": req.body.data[2], "email": req.body.data[3], "notificar": ('true' == req.body.data[4]) } }, error => {

		if (error) {

			res.status(200).json({status: 'error', alertType: 'alert-danger', mensaje: 'Error actualizando el usuario'});

		} else {

			cliente.nombre = escapeHtml(req.body.data[0].substring(0, 150));
			cliente.apellidos = escapeHtml(req.body.data[1].substring(0, 150));
			cliente.nick = escapeHtml(req.body.data[2].substring(0, 150));
			cliente.email = escapeHtml(req.body.data[3].substring(0, 150));
			cliente.notificar = ('true' == req.body.data[4]);

			res.status(200).json({status: 'ok', alertType: 'alert-success', mensaje: 'Usuario actualizado correctamente'});

		}

	});

};

exports.actualizarIncidencia = (req, res) => {

	usuario.find({}, (error, resultado) => {

		if (error) {

			res.status(200).json({status: 'error', alertType: 'alert-danger', mensaje: 'Error actualizando la incidencia | Error: ' + error});

		} else {

			for (valor in resultado) {

				for (incidencia in resultado[valor].incidencias) {

					if (resultado[valor].incidencias[incidencia]._id == req.body.id) {

						resultado[valor].incidencias[incidencia].texto_incidencia = escapeHtml(req.body.texto_incidencia.substring(0, 300));
						resultado[valor].incidencias[incidencia].texto_solucion = escapeHtml(req.body.texto_solucion.substring(0, 300));
						resultado[valor].incidencias[incidencia].resuelta = req.body.resuelta;

						if (resultado[valor].incidencias[incidencia].resuelta && resultado[valor].notificar) {

							if (resultado[valor].email != '') {

								var transporter = nodemailer.createTransport({

									service: 'gmail',
									auth: {

										user: process.env.EMAIL,
										pass: process.env.EMAIL_PASSWORD

									}

								});

								var mailOptions = {

									from: process.env.EMAIL,
									to: resultado[valor].email,
									subject: 'Actualizacion en sus incidencias',
									html: `<h1> Se ha registrado un cambio </h1> <p> Su incidencia con ID: <strong> ${resultado[valor].incidencias[incidencia]._id} </strong> ha sido actualizada. </p> <p> Texto incidencia: ${resultado[valor].incidencias[incidencia].texto_incidencia} </p> <p> El nuevo estado es: ${resultado[valor].incidencias[incidencia].resuelta}</p> <p> Texto solucion: ${resultado[valor].incidencias[incidencia].texto_solucion} </p> <p> Compruebe el estado accediendo a: http://a18pablolc.ddns.net/misIncidencias </p>`

								};

								transporter.sendMail(mailOptions, error => {

									if (error) {

										res.status(200).json({status: 'error', alertType: 'alert-danger', mensaje: 'Error mandando el correo | Error: ' + error});

									}

								});

							}

							bot.telegram.sendMessage(resultado[valor].telegram, `Se ha registrado un cambio \nSu incidencia con ID: ${resultado[valor].incidencias[incidencia]._id} ha sido actualizada. \nTexto incidencia: ${resultado[valor].incidencias[incidencia].texto_incidencia} \nEl nuevo estado es: ${resultado[valor].incidencias[incidencia].resuelta} \nTexto solucion: ${resultado[valor].incidencias[incidencia].texto_solucion} \nCompruebe el estado accediendo a: http://a18pablolc.ddns.net/misIncidencias`);

						}

						resultado[valor].save(error => {

							if (error) {

								res.status(200).json({status: 'error', alertType: 'alert-danger', mensaje: 'Error actualizando la incidencia | Error: ' + error});

							} else {

								res.status(200).json({status: 'ok', alertType: 'alert-success', mensaje: 'Incidencia actualizada correctamente'});

							}

						});

					}

				}

			}

		}

	});

};

// Rutas agente

exports.agenteIncidencias = (req, res) => {

	usuario.find({}, async (error, resultados) => {

		if (error) {

			res.status(200).json({status: 'error', mensaje: 'Error usuario'});

		} else {

			let datos = [];

			for (resultado in resultados) {

				for (incidencia in resultados[resultado].incidencias) {

					try {

						let resultados2 = await ayuntamiento.find({'ine': resultados[resultado].incidencias[incidencia].ine});

						if (resultados2[0].agentes.indexOf(cliente.id) != -1) {

							datos.push(resultados[resultado].incidencias[incidencia]);

						}

					} catch {

						res.status(200).json({status: 'error', mensaje: 'Error agente'});

					}

				}

			}

			res.render('agenteIncidencia', {titulo: "SCQN - Agente Incidencias", incidencias: datos});

		}

	});

}

// Rutas admin

exports.adminAyuntamientos = (req, res) => {

	ayuntamiento.find({}, (error, resultado) => {

		if (error) {

			res.status(200).json({status: 'error', alertType: 'alert-warning', mensaje: 'Error listando ayuntamientos'});

		} else {

			res.render('adminAyuntamiento', {titulo: "SCQN - Admin ayuntamientos", ayuntamientos: resultado});

		}

	});

}

exports.adminIncidencias = (req, res) => {

	usuario.find({}, (error, resultados) => {

		if (error) {

			res.status(200).json({status: 'error', mensaje: 'Error usuario'});

		} else {

			let datos = [];

			for (resultado in resultados) {

				for (incidencia in resultados[resultado].incidencias) {

					datos.push(resultados[resultado].incidencias[incidencia]);

				}

			}

			res.render('adminIncidencia', {titulo: "SCQN - Admin Incidencias", incidencias: datos});

		}

	});

};

exports.agregarAyuntamiento = (req, res) => {

	ayuntamiento.find({'ine': req.body.ine}, (error, resultado) => {

		if (error) {

			res.status(200).json({status: 'error', mensaje: 'Error comprobando el nuevo ayuntamiento'});

		} else {

			if (!resultado.length) {

				let nuevoAyuntamiento = new ayuntamiento({nombre: req.body.nombre, email: req.body.email, ine: req.body.ine, codigoAgente: crypto.createHash("sha256").update(Date.now().toString()).digest("hex").substring(0, 10)});
				nuevoAyuntamiento.save(error => {

					if (error) {

						res.status(200).json({status: 'error',alertType: 'alert-warning',  mensaje: 'Error guardando el ayuntamiento' + error});

					} else {

						res.status(200).json({status: 'ok', alertType: 'alert-success', mensaje: 'Ayuntamiento creado correctamente'});

					}

				})

			} else {

				res.status(200).json({status: 'error', alertType: 'alert-warning', mensaje: 'Ya existe el ayuntamiento'});

			}

		}

	});

}

exports.editarAyuntamiento = (req, res) => {

	ayuntamiento.find({'_id': req.query.id}, (error, resultado) => {

		if (error) {

			console.log(error);

		} else {

			res.render('editarAyuntamiento', {titulo: 'SCQ - Editar ayuntamiento', ayuntamiento: resultado[0]});

		}

	});

}

exports.actualizarAyuntamiento = (req, res) => {

	ayuntamiento.find({'_id': req.body.id}, (error, resultado) => {

		if (error) {

			res.status(200).json({status: 'error', alertType: 'alert-warning', mensaje: 'Error encontrando ayuntamiento'});

		} else {

			resultado[0].email = req.body.email;

			resultado[0].save(error => {

				if (error) {

					res.status(200).json({status: 'error', alertType: 'alert-warning', mensaje: 'Error actualizando ayuntamiento | Error: ' + error});

				} else {

					res.status(200).json({status: 'ok', alertType: 'alert-success', mensaje: 'Ayuntamiento actualizado correctamente'});

				}

			});

		}

	});

};

exports.borrarAyuntamiento = (req, res) => {

	ayuntamiento.deleteOne({'_id': req.body.id}, error => {

		if (error) {

			res.status(200).json({status: 'error', alertType: 'alert-warning', mensaje: 'Error borrando el ayuntamiento'});

		} else {

			res.status(200).json({status: 'ok', alertType: 'alert-success', mensaje: 'Ayuntamiento borrado correctamente'});

		}

	});

}