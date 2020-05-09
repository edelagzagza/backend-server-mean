var express = require('express');
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');

var SEED = require('../config/config').SEED;

var app = express();

var Usuario = require('../models/usuario');

// Declaración para Google verificación integridad
var CLIENT_ID = require('../config/config').CLIENT_ID;
const { OAuth2Client } = require('google-auth-library');
const usuario = require('../models/usuario');
const client = new OAuth2Client(CLIENT_ID);


// ==========================================================
// Autenticación de Google
//
// para la verificación se requiere instalar "npm install google-auth-library --save"
// ==========================================================
async function verify(token) {
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: CLIENT_ID, // Specify the CLIENT_ID of the app that accesses the backend
        // Or, if multiple clients access the backend:
        //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
    });

    const payload = ticket.getPayload();
    console.log(payload);
    // const userid = payload['sub'];  // lo documento Fernando
    // If request specified a G Suite domain:
    //const domain = payload['hd'];

    return { // Lo agregó Fernando para sólo del payload obtener lo que necesitamos
        nombre: payload.name,
        email: payload.email,
        img: payload.picture,
        google: true
            // payload    // para ver todo lo que regresa el payload
    };
}


app.post('/google', async(req, res) => {
    var token = req.body.token;
    var googleUser = await verify(token) // como "verify" es una función async, la podemos trabajar como si fuera una promesa
        .catch(e => { // y para eso es necesario, el truco de poner "async" en "app.post('/google', async (req, res) => {"
            return res.status(403).json({
                ok: false,
                mensaje: 'Token no válido'
            });
        });

    Usuario.findOne({ email: googleUser.email }, (err, usuarioDB) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Usuario no existe',
                errors: err
            });
        }

        if (usuarioDB) {
            if (usuarioDB.google === false) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Debe de usar autenticación email y password'
                });
            } else {
                // Crear token nuevamente de google!!!
                var token = jwt.sign({ usuario: usuarioDB }, SEED, { expiresIn: 14400 }); // 4 hrs

                res.status(200).json({
                    ok: true,
                    usuario: usuarioDB,
                    token: token,
                    id: usuarioDB._id
                });
            }
        } else {
            // El usuario no existe... hay que crearlo
            // var usuario = new Usuario();

            // usuario.nombre = googleUser.name;
            // usuario.email = googleUser.email;
            // usuario.img = googleUser.img;
            // usuario.google = true;
            // usuario.password = ':) encriptado'; // esto es registro de Google, y cuando quiera autenticarse de forma normal email y password
            // jamás podrá autenticarse, porque el password no coincidirá

            var usuario = new Usuario({
                nombre: googleUser.nombre,
                email: googleUser.email,
                img: googleUser.img,
                google: true,
                password: '.'
            });

            usuario.save((err, usuarioDB) => {
                if (err) {
                    return res.status(400).json({
                        ok: false,
                        message: 'Error al crear usuario con cuenta google',
                        errors: err
                    });
                }

                var token = jwt.sign({ usuario: usuarioDB }, SEED, { expiresIn: 14400 }); // 4 hrs


                res.status(200).json({
                    ok: true,
                    usuario: usuarioDB,
                    token: token,
                    id: usuarioDB._id
                });
            });
        }
    });

    // return res.status(200).json({
    //     ok: true,
    //     mensaje: 'Ok Google',
    //     googleUser: googleUser
    // });
})



// ==========================================================
// Autenticación normal
// ==========================================================

app.post('/', (req, res) => {
    var body = req.body;

    Usuario.findOne({ email: body.email }, (err, usuarioDB) => {

        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar usuario',
                errors: err
            });
        }

        if (!usuarioDB) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Credenciales incorrectas - email',
                errors: err
            });
        }

        if (!bcrypt.compareSync(body.password, usuarioDB.password)) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Credenciales incorrectas - password',
                errors: err
            });
        }

        // Crear token!!!
        usuarioDB.password = 'encriptado';
        var token = jwt.sign({ usuario: usuarioDB }, SEED, { expiresIn: 14400 }); // 4 hrs


        res.status(200).json({
            ok: true,
            usuario: usuarioDB,
            token: token,
            id: usuarioDB._id
        });
    });

});



module.exports = app;
