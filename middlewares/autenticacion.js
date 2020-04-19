var jwt = require('jsonwebtoken');

var SEED = require('../config/config').SEED;



// =====================================================================
// Verificar token - manera optimizada para verificar token / en modulo separado
// =====================================================================
exports.verificaToken = function(req, res, next) {
    var token = req.query.token;
    jwt.verify(token, SEED, (err, decoded) => {
        if (err) {
            return res.status(401).json({
                ok: false,
                mensaje: 'Token incorrecto',
                errors: err
            });
        }

        req.usuario = decoded.usuario;
        next();
        // res.status(200).json({   // sólo fue para demostrar lo que viene en el decoded
        //     ok: true,            // con el next documentado
        //     decoded: decoded
        // });

    });
}