// Esto es mi servidor Express
// Requires
var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');


// Inicializar variables
var app = express();


// Body Parser Node
// parse application/x-www-form-urlencoded  // parse application/json
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());



// Importar rutas
var appRoutes = require('./routes/app');
var usuarioRoutes = require('./routes/usuario');
var loginRoutes = require('./routes/login');


// Conexión a la base de datos
mongoose.connection.openUri('mongodb://localhost:27017/hospitalDB', (err, res) => {
    if (err) throw err; // en JavaScript si se ejecuta el throw, ya no ejecuta más nada

    console.log('Base de datos: \x1b[32m%s\x1b[0m', 'on-line');
});


// Rutas
app.use('/usuario', usuarioRoutes);
app.use('/login', loginRoutes);
app.use('/', appRoutes);


// Escuchar peticiones

// app.listen(3000, function() {
//})
app.listen(3000, () => { // se puede definir cualquier puerto
    console.log('Express server en puerto 3000: \x1b[32m%s\x1b[0m', 'on-line');
});