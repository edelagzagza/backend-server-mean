var express = require('express');

// var SEED = require('../config/config').SEED;
var mdAutenticacion = require('../middlewares/autenticacion');

var app = express();

var Medico = require('../models/medico');


// =====================================================================
// Obtener todos los médicos de la base de datos
// =====================================================================
app.get('/', (req, res, next) => {

    var desde = req.query.desde || 0;
    desde = Number(desde); // hardcoding para asegurar que es número

    // Usuario.find({}, (err, usuarios) => {
    Medico.find({})
        .skip(desde) // empezar "desde"
        .limit(5) // de 5 en 5
        .populate('usuario', 'nombre email')
        .populate('hospital')
        .exec((err, medicos) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error cargando médicos',
                    errors: err
                });
            }

            Medico.count({}, (err, conteo) => { // a futuro poner rutina de cacheo de error (la de arriba)
                res.status(200).json({
                    ok: true,
                    medicos: medicos,
                    total: conteo
                });
            });

            // res.status(200).json({
            //     ok: true,
            //     medicos: medicos
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
// Actualizar médico
// =====================================================================
app.put('/:id', mdAutenticacion.verificaToken, (req, res) => {
    var id = req.params.id;
    var body = req.body;

    Medico.findById(id, (err, medico) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar médico',
                errors: err
            });
        }

        if (!medico) {
            return res.status(400).json({
                ok: false,
                mensaje: 'El médico con el id: ' + id + ' no existe',
                errors: { message: 'No existe médico con ese ID' } // err se reemplazo por ese mensaje
            });
        }

        medico.nombre = body.nombre;
        medico.usuario = req.usuario._id;
        // medico.hospital = body.hospital._id; // mejor sólo recibirémos el hospital
        medico.hospital = body.hospital;

        medico.save((err, medicoGuardado) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Error al actualizar médico',
                    errors: err
                });
            }

            res.status(200).json({
                ok: true,
                medico: medicoGuardado
            });

        });

    });

});




// =====================================================================
// Crear un nuevo médico
// =====================================================================
app.post('/', mdAutenticacion.verificaToken, (req, res) => {
    var body = req.body;
    var medico = new Medico({
        nombre: body.nombre, // la img la recibiremos de otra parte
        usuario: req.usuario._id,
        // hospital: body.hospital._id  // mejor sólo recibirémos el hospital
        hospital: body.hospital
    });

    medico.save((err, medicoGuardado) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Error al crear médico',
                errors: err
            });
        }

        res.status(201).json({
            ok: true,
            medico: medicoGuardado
        });
    });
});


// =====================================================================
// Borrar médico
// =====================================================================
app.delete('/:id', mdAutenticacion.verificaToken, (req, res) => {
    var id = req.params.id;

    Medico.findByIdAndRemove(id, (err, medicoBorrado) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al borrar médico',
                errors: err
            });
        }

        if (!medicoBorrado) {
            return res.status(400).json({
                ok: false,
                mensaje: 'No existe médico con ese ID',
                errors: { message: 'No existe médico con ese ID' } // err se reemplazo por ese mensaje
            });
        }

        res.status(200).json({
            ok: true,
            medico: medicoBorrado
        });
    });
});



module.exports = app;