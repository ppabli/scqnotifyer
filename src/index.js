const fs = require('fs');
const dotenv = require ('dotenv');
const http = require ('http');
const https = require ('https');
const express = require ('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const favicon = require('serve-favicon');
const telegraf = require ('telegraf');
const request = require('request')
const bodyParser = require('body-parser');
const path = require ('path');
const uniqueFilename = require ('unique-filename');
const engine = require('ejs-blocks');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

const web = require('./routes/web.routes');
const usuario = require('./models/usuario.model');
const incidencia = require('./models/incidencia.model');
const ayuntamiento = require('./models/ayuntamiento.model');
const httpLogger = require('./logs/httpLoger');

dotenv.config();

const privateKey = fs.readFileSync(`${process.env.PRIVATE_KEY}`, 'utf8');
const certificate = fs.readFileSync(`${process.env.CERT}`, 'utf8');
const ca = fs.readFileSync(`${process.env.CA}`, 'utf8');

const credenciales = {

	key: privateKey,
	cert: certificate,
	ca: ca

};

bot = new telegraf(process.env.BOT_TOKEN);
const app = express()

bot.telegram.setWebhook(process.env.WEBHOOK_URL + ':' + process.env.PUERTO_BOT + process.env.WEBHOOK_CARPETA_SECRETA);

app.engine('ejs', engine);
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.use(bot.webhookCallback(process.env.WEBHOOK_CARPETA_SECRETA));

app.use(httpLogger);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(favicon(path.join(__dirname, '/public', 'favicon.ico')));
app.use(express.static(path.join(__dirname, '/public')));
app.use('/css', express.static(__dirname + '../../node_modules/bootstrap/dist/css'));
app.use('/css', express.static(__dirname + '../../node_modules/mdbootstrap/'));
app.use('/css', express.static(__dirname + '../../node_modules/font-awesome'));
app.use('/js', express.static(__dirname + '../../node_modules/jquery/dist'));
app.use('/js', express.static(__dirname + '../../node_modules/bootstrap/dist/js'));
app.use(cookieParser());
app.use(session({

	secret: 'bucata',
	resave: true,
	saveUninitialized: true,
	cookie: {

		path: '/',
		httpOnly: true,
		maxAge: 1000 * 60 * 30,
		sameSite: true

	},

	rolling: true

}));

app.use('/', web);

const httpServer = http.createServer(credenciales, app);
httpServer.listen(process.env.PUERTO_WEB_HTTP, () => {

	console.log(`Servidor http funcionando en puerto ${process.env.PUERTO_WEB_HTTP}`);

});

const httpsServer = https.createServer(credenciales, app);

httpsServer.listen(process.env.PUERTO_WEB_HTTPS, () => {

	console.log(`Servidor https funcionando en puerto ${process.env.PUERTO_WEB_HTTPS}`);

});

const botServer = https.createServer(credenciales, app);

botServer.listen(process.env.PUERTO_BOT, () => {

	console.log(`Bot funcionando en puerto ${process.env.PUERTO_BOT}`);

});

const mongoDB = `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DB}`;

const opcionesMongo = {

	keepAlive: 1,
	useUnifiedTopology: true,
	useNewUrlParser: true

};

mongoose.set('useFindAndModify', false);
mongoose.connect(mongoDB, opcionesMongo).catch(error => { 

	console.log('No me puedo conectar al servidor MongoDB: ' + error)

});

mongoose.connection.on('error', error => {

	console.log('Se ha producido un error en la conexión a MongoDB: ' + error);

});

mongoose.connection.on('connected', () => {

	console.log('Conectado a servidor MongoDB.');

});

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

function comprobarCampos(msg) {

	usuario.find({'telegram': msg.chat.id}, (error , resultado) => {

		if (resultado.length != 0) {

			let salida = 'Faltan estos campos:';

			if (resultado[0].estadoTelegram == 'altaincidencia') {

				if (resultado[0].incidencia_coordenadas == '') {

					salida += ' coordenadas';

				}

				if (resultado[0].incidencia_texto == '') {

					salida += ' texto';

				}

				if (resultado[0].incidencia_foto == '') {

					salida += ' foto';

				}

				if (salida == 'Faltan estos campos:') {

					bot.telegram.sendMessage(msg.chat.id, 'Datos de la incidencia completos. Escribe /confirm para enviar la incidencia | /exit para cancelar la incidencia | o manda otra foto, texto o direccion para actualizar el valor');

				} else {

					bot.telegram.sendMessage(msg.chat.id, salida += '.');

				}

			} else if (resultado[0].estadoTelegram == 'registraragente') {

				if (resultado[0].registro_codigo == '') {

					salida += ' codigo agente';

				}

				if (resultado[0].registro_ine == '') {

					salida += ' INE';

				}

				if (salida == 'Faltan estos campos:') {

					bot.telegram.sendMessage(msg.chat.id, 'Datos del agente completos. Escribe /confirm para enviar la peticion | /exit para cancelar la peticion | o manda otra INE o codigo de agente para actualizar el valor');

				} else {

					bot.telegram.sendMessage(msg.chat.id, salida += '.');

				}

			} else {

				bot.telegram.sendMessage(msg.chat.id, 'No hay nada que comprobar');

			}

		} else {

			bot.telegram.sendMessage(msg.chat.id, "No se encuentra el usuario \n Registrese en http://a18pablolc.ddns.net");

		}

	});

}

function notificar(msg, incidencia) {

	ayuntamiento.find({'ine': incidencia.ine}, (error, resultado) => {

		if (error) {

			bot.telegram.sendMessage(resultado[valor].telegram, `Error`);

		} else {

			if (resultado.length != 0) {

				var transporter = nodemailer.createTransport({

					service: 'gmail',
					auth: {

						user: process.env.EMAIL,
						pass: process.env.EMAIL_PASSWORD

					}

				});

				var mailOptions = {

					from: process.env.EMAIL,
					to: resultado[0].email,
					subject: 'Nueva incidencia en su ayuntamiento',
					html: `<h1> Se ha registrado una nueva incidencia en el ayuntamiento: ${resultado[0].nombre} </h1> <p> ID incidencia: <strong> ${incidencia._id} </strong> </p> <p> Texto incidencia: ${incidencia.texto_incidencia} </p> <p> Se ha notificado a los agentes del ayuntamiento </p> <p> Compruebe el estado accediendo a: http://a18pablolc.ddns.net/ </p>`

				};

				transporter.sendMail(mailOptions, (error, info) => {

					if (error) {

						bot.telegram.sendMessage(msg.chat.id, 'Error mandando el correo al ayuntamiento');

					}

				});

				for (agente in resultado[0].agentes) {

					bot.telegram.sendMessage(resultado[0].agentes[agente], `Se ha registrado una nueva incidencia en el ayuntamiento: ${resultado[0].nombre}. \nID incidencia: ${incidencia._id}. \nTexto incidencia: ${incidencia.texto_incidencia} \nSe ha notificado a los agentes del ayuntamiento. \nCompruebe el estado accediendo a: http://a18pablolc.ddns.net`);

				}

			} else {

				bot.telegram.sendMessage(msg.chat.id, 'Este ayuntamiento no esta registrado. La incidencia esta registrada pero no se ha avisado a los agentes ni al ayuntamiento');

			}

		}

	});

}

bot.command('start', (msg) => {

	bot.telegram.sendMessage(msg.chat.id, 'Hola amigo');

});

bot.command('registraragente', (msg) => {

	usuario.find({'telegram': msg.chat.id}, (error, resultado) => {

		if (resultado.length != 0) {

			if (resultado[0].estadoTelegram == '') {

				bot.telegram.sendMessage(msg.chat.id, "Alta de agente activada, Necesitamos primero un INE y luego un codigo de registro | /confirm para enviar registrar | /exit para salir");
				resultado[0].estadoTelegram = 'registraragente';
				resultado[0].save();

			} else {

				bot.telegram.sendMessage(msg.chat.id, "Otro proceso en uso");

			}

		} else {

			bot.telegram.sendMessage(msg.chat.id, "No se encuentra el usuario \n Registrese en http://a18pablolc.ddns.net");

		}

	});

});

bot.command('altaincidencia', (msg) => {

	usuario.find({'telegram': msg.chat.id}, (error, resultado) => {

		if (resultado.length != 0) {

			if (resultado[0].estadoTelegram == '') {

				bot.telegram.sendMessage(msg.chat.id, "Alta de incidencia activada, Necesitamso texto, coordenadas y foto | /confirm para enviar incidencia | /exit para salir");
				resultado[0].estadoTelegram = 'altaincidencia';
				resultado[0].save();

			} else {

				bot.telegram.sendMessage(msg.chat.id, "Otro proceso en uso");

			}

		} else {

			bot.telegram.sendMessage(msg.chat.id, "No se encuentra el usuario \n Registrese en http://a18pablolc.ddns.net");

		}

	});

});

bot.command('exit', (msg) => {

	usuario.find({'telegram': msg.chat.id}, (error, resultado) => {

		if (resultado.length != 0) {

			if (resultado[0].estadoTelegram == 'altaincidencia') {

				if (resultado[0].incidencia_foto != '') {

					fs.unlink('./public/img/' + resultado[0].incidencia_foto, () => {});

				}

				resultado[0].estadoTelegram = '';
				resultado[0].incidencia_coordenadas = '';
				resultado[0].incidencia_texto = '';
				resultado[0].incidencia_foto = '';

				resultado[0].save(() => {

					bot.telegram.sendMessage(msg.chat.id, "Incidencia cancelada");

				});

			} else if (resultado[0].estadoTelegram == 'registraragente') {

				resultado[0].estadoTelegram = '';
				resultado[0].registro_ine = '';
				resultado[0].registro_codigo = '';

				resultado[0].save(() => {

					bot.telegram.sendMessage(msg.chat.id, "Registro de agente cancelado");

				});

			} else {

				bot.telegram.sendMessage(msg.chat.id, "No hay nada que cancelar");

			}

		} else {

			bot.telegram.sendMessage(msg.chat.id, "No se encuentra el usuario \n Registrese en http://a18pablolc.ddns.net");

		}

	});

}),

bot.command('confirm', (msg) => {

	usuario.find({'telegram': msg.chat.id}, (error, resultado) => {

		if (resultado.length != 0) {

			if (resultado[0].estadoTelegram == 'altaincidencia') {

				if (resultado[0].incidencia_coordenadas != '' && resultado[0].incidencia_texto != '' && resultado[0].incidencia_foto != '') {

					request(`https://public.opendatasoft.com/api/records/1.0/search/?dataset=espana-municipios&geofilter.distance=${resultado[0].incidencia_coordenadas.split(':')[0]},+${resultado[0].incidencia_coordenadas.split(':')[1]}`, {json: true}, (err, res, body) => {

						if (body.records.length != 0) {

							let nuevaIncidencia = new incidencia({

								foto: resultado[0].incidencia_foto,
								latitud: resultado[0].incidencia_coordenadas.split(':')[0],
								longitud: resultado[0].incidencia_coordenadas.split(':')[1],
								ine: body.records[0].fields.codigo_postal || body.records[0].fields.municipio,
								texto_incidencia: resultado[0].incidencia_texto

							});

							resultado[0].incidencias.push(nuevaIncidencia);

							resultado[0].estadoTelegram = '';
							resultado[0].incidencia_coordenadas = '';
							resultado[0].incidencia_texto = '';
							resultado[0].incidencia_foto = '';

							resultado[0].save((error) => {

								if (error) {

									bot.telegram.sendMessage(msg.chat.id, "Error guardando la incidencia ");

								} else {

									bot.telegram.sendMessage(msg.chat.id, "Incidencia finalizada. ID: " + nuevaIncidencia._id);
									notificar(msg, nuevaIncidencia);

								}

							});

						} else {

							bot.telegram.sendMessage(msg.chat.id, "No existe el INE del lugar");

						}

					});

				} else {

					comprobarCampos(msg);

				}

			} else if (resultado[0].estadoTelegram == 'registraragente') {

				ayuntamiento.find({'ine': resultado[0].registro_ine}, (error , resultado2) => {

					if (error) {

						bot.telegram.sendMessage(msg.chat.id, "Error encontrando el ayuntamiento");

					} else {

						if (resultado2.length != 0) {

							if (resultado2[0].codigoAgente == resultado[0].registro_codigo) {

								if (resultado2[0].agentes.indexOf(resultado[0].telegram) == -1) {

									resultado2[0].agentes.push(resultado[0].telegram);
									resultado2[0].save(error => {

										if (error) {

											bot.telegram.sendMessage(msg.chat.id, "Error guardando el agente");

										} else {

											resultado[0].estadoTelegram = '';
											resultado[0].registro_ine = '';
											resultado[0].registro_codigo = '';

											resultado[0].save(() => {

												bot.telegram.sendMessage(msg.chat.id, "Agente creado con exito");

											});

										}

									})

								} else {

									bot.telegram.sendMessage(msg.chat.id, "Ya esta registrado como agente para este ayuntamiento");

								}

							} else {

								bot.telegram.sendMessage(msg.chat.id, "Conbinacion de INE y codigo de agente incorrecta");

							}

						} else {

							bot.telegram.sendMessage(msg.chat.id, "El ayuntamiento no esta registrado");

						}

					};

				});

			} else {

				bot.telegram.sendMessage(msg.chat.id, "No hay nada que confirmar");

			}

		} else {

			bot.telegram.sendMessage(msg.chat.id, "No se encuentra el usuario \n Registrese en http://a18pablolc.ddns.net");

		}

	});

}),

bot.on('photo', (msg) => {

	usuario.find({'telegram': msg.chat.id}, (error, resultado) => {

		if (resultado.length != 0) {

			if (resultado[0].estadoTelegram == 'altaincidencia') {

				if (resultado[0].incidencia_foto == '') {

					let urlInfoFichero = `https://api.telegram.org/bot${process.env.BOT_TOKEN}/getFile?file_id=${msg.message.photo[msg.message.photo.length - 1].file_id}`;

					request(urlInfoFichero, (err, response, body) => {

						body = JSON.parse(body);

						let urlDescargaFichero = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${body.result.file_path}`;
						foto = uniqueFilename('', msg.from.id) + '.' + body.result.file_path.split('.').pop();

						request(urlDescargaFichero).pipe(fs.createWriteStream('./public/img/' + foto));

						resultado[0].incidencia_foto = foto;

						resultado[0].save(() => {

							bot.telegram.sendMessage(msg.chat.id, "Foto enviada").then(() => {

								comprobarCampos(msg);

							});

						});

					});

				} else {

					let urlInfoFichero = `https://api.telegram.org/bot${process.env.BOT_TOKEN}/getFile?file_id=${msg.message.photo[msg.message.photo.length - 1].file_id}`;

					request(urlInfoFichero, (err, response, body) => {

						body = JSON.parse(body);

						fs.unlink('./public/img/' + resultado[0].incidencia_foto, (error) => {

							if (error) {

								bot.telegram.sendMessage(msg.chat.id, "Error actualizando la foto");

							}

						});

						let urlDescargaFichero = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${body.result.file_path}`;
						foto = uniqueFilename('', msg.from.id) + '.' + body.result.file_path.split('.').pop();

						request(urlDescargaFichero).pipe(fs.createWriteStream('./public/img/' + foto));

						resultado[0].incidencia_foto = foto;

						resultado[0].save(() => {

							bot.telegram.sendMessage(msg.chat.id, "Foto actualizada").then(() => {

								comprobarCampos(msg);
	
							});

						});

					});
				}

			} else {

				bot.telegram.sendMessage(msg.chat.id, "No queremos tu foto");

			}

		} else {

			bot.telegram.sendMessage(msg.chat.id, "No se encuentra el usuario \n Registrese en http://a18pablolc.ddns.net");

		}

	});

});

bot.on('location', (msg) => {

	usuario.find({'telegram': msg.chat.id}, (error, resultado) => {

		if (resultado.length != 0) {

			if (resultado[0].estadoTelegram == 'altaincidencia') {

				if (resultado[0].incidencia_coordenadas == '') {

					resultado[0].incidencia_coordenadas = msg.message.location.latitude + ':' + msg.message.location.longitude;
					resultado[0].save(() => {

						bot.telegram.sendMessage(msg.chat.id, "Coordenadas enviadas").then(() => {

							comprobarCampos(msg);

						});

					});

				} else {

					resultado[0].incidencia_coordenadas = msg.message.location.latitude + ':' + msg.message.location.longitude;
					resultado[0].save(() => {

						bot.telegram.sendMessage(msg.chat.id, "Coordenadas actualizadas").then(() => {

							comprobarCampos(msg);

						});

					});

				}

			} else {

				bot.telegram.sendMessage(msg.chat.id, "No queremos tus coordenadas");

			}

		} else {

			bot.telegram.sendMessage(msg.chat.id, "No se encuentra el usuario \n Registrese en http://a18pablolc.ddns.net");

		}

	});

});

bot.on('text', (msg) => {

	usuario.find({'telegram': msg.chat.id}, (error, resultado) => {

		if (resultado.length != 0) {

			if (resultado[0].estadoTelegram == 'altaincidencia') {

				if (resultado[0].incidencia_texto == '') {

					resultado[0].incidencia_texto = escapeHtml(msg.message.text.substring(0, 150));
					resultado[0].save(() => {

						bot.telegram.sendMessage(msg.chat.id, "Texto enviado").then(() => {

							comprobarCampos(msg);

						});

					});

				} else {

					resultado[0].incidencia_texto = escapeHtml(msg.message.text.substring(0, 150));
					resultado[0].save(() => {

						bot.telegram.sendMessage(msg.chat.id, "Texto actualizado").then(() => {

							comprobarCampos(msg);

						});

					});

				}

			} else if (resultado[0].estadoTelegram == 'registraragente') {

				if (msg.message.text.length == 10 && msg.message.text.indexOf(' ') == -1) {

					if (resultado[0].registro_codigo == '') {

						ayuntamiento.find({'codigoAgente': msg.message.text}, (error, resultado2) => {

							if (error) {

								bot.telegram.sendMessage(msg.chat.id, "Error encontrando el ayuntamiento");

							} else {

								if (resultado2.length != 0) {

									resultado[0].registro_codigo = escapeHtml(msg.message.text.substring(0, 10));
									resultado[0].save(() => {

										bot.telegram.sendMessage(msg.chat.id, "Codigo agente proporcionado").then(() => {

											comprobarCampos(msg);

										});

									})

								} else {

									bot.telegram.sendMessage(msg.chat.id, "No existe el ayuntamiento");

								}

							}

						});

					} else {

						ayuntamiento.find({'codigoAgente': msg.message.text}, (error, resultado2) => {

							if (error) {

								bot.telegram.sendMessage(msg.chat.id, "Error encontrando el ayuntamiento");

							} else {

								if (resultado2.length != 0) {

									resultado[0].registro_codigo = escapeHtml(msg.message.text.substring(0, 10));
									resultado[0].save(() => {

										bot.telegram.sendMessage(msg.chat.id, "Codigo agente actualizado").then(() => {

											comprobarCampos(msg);

										});

									})

								} else {

									bot.telegram.sendMessage(msg.chat.id, "No existe el ayuntamiento");

								}

							}

						});

					}

				} else {

					if (resultado[0].registro_ine == '') {

						ayuntamiento.find({'ine': msg.message.text}, (error, resultado2) => {

							if (error) {

								bot.telegram.sendMessage(msg.chat.id, "Error encontrando el ayuntamiento");

							} else {

								if (resultado2.length != 0) {

									resultado[0].registro_ine = escapeHtml(msg.message.text.substring(0, 150));
									resultado[0].save(() => {

										bot.telegram.sendMessage(msg.chat.id, "INE proporcionado").then(() => {

											comprobarCampos(msg);

										});

									})

								} else {

									bot.telegram.sendMessage(msg.chat.id, "No existe el ayuntamiento");

								}

							}

						});

					} else {

						ayuntamiento.find({'ine': msg.message.text}, (error, resultado2) => {

							if (error) {

								bot.telegram.sendMessage(msg.chat.id, "Error encontrando el ayuntamiento");

							} else {

								if (resultado2.length != 0) {

									resultado[0].registro_ine = escapeHtml(msg.message.text.substring(0, 150));
									resultado[0].save(() => {

										bot.telegram.sendMessage(msg.chat.id, "INE actualizado").then(() => {

											comprobarCampos(msg);

										});

									})

								} else {

									bot.telegram.sendMessage(msg.chat.id, "No existe el ayuntamiento");

								}

							}

						});

					}

				}

			} else {

				bot.telegram.sendMessage(msg.chat.id, "No queremos tu texto");

			}

		} else {

			bot.telegram.sendMessage(msg.chat.id, "No se encuentra el usuario \n Registrese en http://a18pablolc.ddns.net");

		}

	});

});