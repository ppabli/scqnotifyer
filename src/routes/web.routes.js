const express = require('express');
const router = express.Router();
const web_controller = require('../controllers/web.controller');
const middlewares = require('../middlewares/web.middlewares');

// Rutas publicas
router.use([middlewares.log, middlewares.usuarioConectado]);

router.get('/' , web_controller.raiz);
router.get('/info', web_controller.info);
router.get('/incidencias', web_controller.incidencias);
router.get('/mapa', web_controller.mapa);
router.get('/meteo' ,web_controller.meteo);
router.get('/login', web_controller.login);
router.get('/desconectar', web_controller.desconectar);
router.get('/ayuntamientos', web_controller.ayuntamientos);

router.post('/obtenerMeteo' ,web_controller.obtenerMeteo);
router.post('/grabarSesion' , web_controller.grabarSesion);

// Rutas privadas
router.use([middlewares.log, middlewares.usuarioConectado, middlewares.rutasPrivadas]);

router.get('/perfil', web_controller.perfil);
router.get('/misIncidencias', web_controller.misIncidencias);
router.get('/borrarPerfil', web_controller.borrarPerfil);
router.get('/editarIncidencia', web_controller.editarIncidencia);

router.post('/actualizarPerfil', web_controller.actualizarPerfil);
router.post('/actualizarIncidencia', web_controller.actualizarIncidencia);
router.post('/borrarIncidencia', web_controller.borrarIncidencia);
router.post('/comprobarPassword', web_controller.comprobarPassword);

// Rutas agente
router.use([middlewares.log, middlewares.usuarioConectado, middlewares.rutasPrivadas, middlewares.rutasAgente]);

router.get('/agenteIncidencias', web_controller.agenteIncidencias);

// Rutas admin
router.use([middlewares.log, middlewares.usuarioConectado, middlewares.rutasPrivadas, middlewares.rutasAgente, middlewares.rutasAdmin]);

router.get('/adminIncidencias', web_controller.adminIncidencias);
router.get('/adminAyuntamientos', web_controller.adminAyuntamientos);
router.get('/editarAyuntamiento', web_controller.editarAyuntamiento);

router.post('/agregarAyuntamiento', web_controller.agregarAyuntamiento);
router.post('/actualizarAyuntamiento', web_controller.actualizarAyuntamiento);
router.post('/borrarAyuntamiento', web_controller.borrarAyuntamiento);

module.exports = router;