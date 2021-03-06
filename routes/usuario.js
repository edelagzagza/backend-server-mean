var express = require('express');
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');

// var SEED = require('../config/config').SEED;
var mdAutenticacion = require('../middlewares/autenticacion');

var app = express();

var Usuario = require('../models/usuario');


// =====================================================================
// Obtener todos los usuarios de la base de datos
// =====================================================================
app.get('/', (req, res, next) => {

    var desde = req.query.desde || 0;
    desde = Number(desde); // hardcoding para asegurar que es número

    // Usuario.find({}, (err, usuarios) => {
    Usuario.find({}, 'nombre email img role')
        .skip(desde) // empezar "desde"
        .limit(5) // de 5 en 5
        .exec((err, usuarios) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error cargando usuario',
                    errors: err
                });
            }

            Usuario.count({}, (err, conteo) => { // a futuro poner rutina de cacheo de error (la de arriba)
                res.status(200).json({
                    ok: true,
                    usuarios: usuarios,
                    total: conteo
                });
            });

            // res.status(200).json({  // se pasó para arriba para agregar el conteo de registros
            //     ok: true,
            //     usuarios: usuarios
            // });
        });

});


// =====================================================================
// Verificar token - manera de agregar para autenticar todo hacia abajo
// se crea middleware para optimizar su uso
// =====================================================================
/* app.use('/', (req, res, next) => {
    var token = req.query.token;
    jwt.verify(token, SEED, (err, decoded) => {
        if (err) {
            return res.status(401).json({
                ok: false,
                mensaje: 'Token incorrecto',
                errors: err
            });
        }

        next();
    });
}); */



// =====================================================================
// Actualizar usuario
// =====================================================================
app.put('/:id', mdAutenticacion.verificaToken, (req, res) => {
    var id = req.params.id;
    var body = req.body;

    Usuario.findById(id, (err, usuario) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar usuario',
                errors: err
            });
        }

        if (!usuario) {
            return res.status(400).json({
                ok: false,
                mensaje: 'El usuario con el id: ' + id + ' no existe',
                errors: { message: 'No existe usuario con ese ID' } // err se reemplazo por ese mensaje
            });
        }

        usuario.nombre = body.nombre;
        usuario.email = body.email;
        usuario.role = body.role;

        usuario.save((err, usuarioGuardado) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Error al actualizar usuario',
                    errors: err
                });
            }

            usuarioGuardado.password = 'encriptado';

            res.status(200).json({
                ok: true,
                usuario: usuarioGuardado
            });

        });

    });

});




// =====================================================================
// Crear un nuevo usuario
// =====================================================================
app.post('/', mdAutenticacion.verificaToken, (req, res) => {
    var body = req.body;
    var usuario = new Usuario({
        nombre: body.nombre,
        email: body.email,
        password: bcrypt.hashSync(body.password, 10),
        img: body.img,
        role: body.role
    });

    usuario.save((err, usuarioGuardado) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Error al crear usuario',
                errors: err
            });
        }

        res.status(201).json({
            ok: true,
            usuario: usuarioGuardado,
            usuariotoken: req.usuario
        });
    });
});


// =====================================================================
// Borrar usuario
// =====================================================================
app.delete('/:id', mdAutenticacion.verificaToken, (req, res) => {
    var id = req.params.id;

    Usuario.findByIdAndRemove(id, (err, usuarioBorrado) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al borrar usuario',
                errors: err
            });
        }

        if (!usuarioBorrado) {
            return res.status(400).json({
                ok: false,
                mensaje: 'No existe usuario con ese ID',
                errors: { message: 'No existe usuario con ese ID' } // err se reemplazo por ese mensaje
            });
        }

        res.status(200).json({
            ok: true,
            usuario: usuarioBorrado
        });
    });
});



module.exports = app;