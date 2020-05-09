'use strict';

var express = require('express');
var app = express();

var Hospital = require('../models/hospital');
var Medico = require('../models/medico');
var Usuario = require('../models/usuario');


// ==========================================================
// Búsqueda por colección
// ==========================================================
app.get('/coleccion/:tabla/:busqueda/', (req, res) => {

    var busqueda = req.params.busqueda;
    var tabla = req.params.tabla;
    var expreg = new RegExp(busqueda, 'i'); // para evitar poner /busqueda/i en el find

    var promesa;

    switch (tabla) {
        case 'usuarios':
            promesa = buscarUsuarios(busqueda, expreg);
            break;

        case 'medicos':
            promesa = buscarMedicos(busqueda, expreg);
            break;

        case 'hospitales':
            promesa = buscarHospitales(busqueda, expreg);
            break;

        default:
            res.status(400).json({
                ok: false,
                mensaje: 'Los tipos de búsqueda solo son: usuarios, medicos y hospitales',
                error: { message: 'Tipo de tabla/colección no válida' }
            });
    }

    promesa.then(data => {
        res.status(200).json({
            ok: true,
            [tabla]: data // no es la palabra tabla lo que quiero... quiero lo que hay dentro de tabla
        });
    });



});


// ==========================================================
// Búsqueda general
// ==========================================================

app.get('/todo/:busqueda', (req, res, next) => {

    var busqueda = req.params.busqueda;
    var expreg = new RegExp(busqueda, 'i'); // para evitar poner /busqueda/i en el find


    Promise.all([
        buscarHospitales(busqueda, expreg),
        buscarMedicos(busqueda, expreg),
        buscarUsuarios(busqueda, expreg)
    ]).then(respuestas => {
        res.status(200).json({
            ok: true,
            hospitales: respuestas[0],
            medicos: respuestas[1],
            usuarios: respuestas[2]
        });
    });

    // buscarHospitales(busqueda, expreg)  // esto fue para buscar solo en hospitales
    //     .then(hospitales => {
    //         res.status(200).json({
    //             ok: true,
    //             hospitales: hospitales
    //         });
    //     });
});


function buscarHospitales(busqueda, expreg) {
    return new Promise((resolve, reject) => {
        // Hospital.find({ nombre: expreg }, (err, hospitales) => {  // se eliminó para hacer el populate y detallar los datos del usuario que lo creó
        Hospital.find({ nombre: expreg })
            .populate('usuario', 'nombre email')
            .exec((err, hospitales) => {
                if (err) {
                    reject('Error al cargar hospitales', err);
                } else {
                    resolve(hospitales)
                }
            });
    });
}


function buscarMedicos(busqueda, expreg) {
    return new Promise((resolve, reject) => {
        // Medico.find({ nombre: expreg }, (err, medicos) => {  // se eliminó para hacer el populate y detallar los datos del usuario que lo creó y hospital
        Medico.find({ nombre: expreg })
            .populate('usuario', 'nombre email')
            .populate('hospital')
            .exec((err, medicos) => {
                if (err) {
                    reject('Error al cargar médicos', err);
                } else {
                    resolve(medicos)
                }
            });
    });
}


function buscarUsuarios(busqueda, expreg) {
    return new Promise((resolve, reject) => {
        Usuario.find({}, 'nombre email role') // find() busca todo y regresa todos los campos
            .or([{ 'nombre': expreg }, { 'email': expreg }])
            .exec((err, usuarios) => {
                if (err) {
                    reject('Error al cargar usuarios', err);
                } else {
                    resolve(usuarios);
                }
            });
    });
}


module.exports = app;