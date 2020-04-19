// Esto es mi servidor Express
// Requires
var express = require('express');
var mongoose = require('mongoose');




// Inicializar variables
var app = express();


// Conexión a la base de datos
mongoose.connection.openUri('mongodb://localhost:27017/hospitalDB', (err, res) => {
    if (err) throw err; // en JavaScript si se ejecuta el throw, ya no ejecuta más nada

    console.log('Base de datos: \x1b[32m%s\x1b[0m', 'on-line');
});



// Rutas
app.get('/', (req, res, next) => {
    res.status(200).json({
        ok: true,
        mensaje: 'Petición realizada correctamente'
    });
});



// Escuchar peticiones

// app.listen(3000, function() {
//})
app.listen(3000, () => { // se puede definir cualquier puerto
    console.log('Express server en puerto 3000: \x1b[32m%s\x1b[0m', 'on-line');
});