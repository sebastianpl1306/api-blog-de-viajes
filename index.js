const express = require('express');
const mysql = require('mysql');

const app = express();

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

const databasePool = {
    connectionLimit: 20,
    host: 'localhost',
    user: 'root',
    password: '12345',
    database: 'blog_de_viajes',
    port: 3307
}

const pool = mysql.createPool(databasePool);

app.get('/api/v1/publicaciones', function (request, response) {
    pool.getConnection((error, connection) =>{
        const busqueda = ( request.query.busqueda ) ? request.query.busqueda : "";
        let modificadorConsulta = "";
        if (busqueda != "") {
            modificadorConsulta = `
                WHERE
                titulo LIKE '%${busqueda}%' OR
                resumen LIKE '%${busqueda}%' OR
                contenido LIKE '%${busqueda}%'
            `;
        }

        let consulta = `
            SELECT * FROM
            publicaciones
            ${modificadorConsulta}`;
        connection.query(consulta, (error, filas)=>{
            response.status(200);
            response.json({data: filas});
        })
        connection.release();
    })
})

app.get('/api/v1/publicaciones/:id', function (request, response) {
    pool.getConnection((error, connection) =>{
        const consulta = `
            SELECT * FROM
            publicaciones
            WHERE id = ${connection.escape(request.params.id)}`;
        connection.query(consulta, (error, filas)=>{
            if (filas.length > 0) {
                response.status(200);
                response.json({data: filas[0]})
            }else{
                response.status(404);
                response.json({errors: ["No se encontro la publicación"]});
            }
        })
        connection.release();
    });
});

app.get('/api/v1/autores', function (request, response) {
    pool.getConnection((error, connection) =>{
        let consulta = `
            SELECT * FROM
            autores`;
        connection.query(consulta, (error, filas)=>{
            response.status(200);
            response.json({data: filas});
        })
        connection.release();
    })
})

app.get('/api/v1/autores/:id', (request, response) =>{
    pool.getConnection((error, connection)=>{
        const consulta = `
            SELECT * FROM autores 
            RIGHT JOIN publicaciones 
            ON publicaciones.autor_id = autores.id
            WHERE autores.id = ${connection.escape(request.params.id)};`;
        
            console.log(consulta);
        connection.query(consulta, (error, filas)=>{
            if (filas.length > 0) {
                let actualAutor = null;
                const autores = [];
                filas.forEach(autor => {
                    if (autor.pseudonimo != actualAutor) {
                        actualAutor = autor.pseudonimo;
                        autores.push({
                            id: autor.autor_id,
                            pseudonimo: autor.pseudonimo,
                            avatar: autor.avatar,
                            publicaciones: []
                        });
                    }
                    autores[autores.length-1].publicaciones.push({
                        id: autor.id,
                        titulo: autor.titulo,
                        resumen: autor.resumen,
                        votos: autor.votos
                    })
                });
                response.status(200);
                response.json({data: autores});
            }else{
                response.status(404);
                response.json({errors: ["No se encontro el autor"]});
            }
        })
        
        connection.release();
    })
})

app.post('/api/v1/autores', (request, response) =>{
    pool.getConnection((error, connection) =>{
        const pseudonimo = request.body.pseudonimo.toLowerCase().trim();
        const email = request.body.email.trim();
        const contrasena = request.body.contrasena;

        const errores = []

        if (!pseudonimo || pseudonimo == "") {
        errores.push("pseudonimo inválido")
        }
        if (!email || email == "") {
        errores.push("email inválida")
        }
        if (!contrasena || contrasena == "") {
        errores.push("contrasena inválido")
        }

        if (errores.length > 0) {
            response.status(400)
            response.json({ errors: errores })
        }

        const consultaEmail = `
            SELECT * FROM autores
            WHERE email = ${connection.escape(email)}`;

        connection.query(consultaEmail, (error, filas) =>{
            if(filas.length > 0){
                response.status(400);
                response.json({ errors: 'Email duplicado' });
            }else{
                const consultaPseudonimo = `
                SELECT * FROM autores
                WHERE pseudonimo = ${connection.escape(pseudonimo)}`;
                connection.query(consultaPseudonimo, (error, filas) =>{
                    if (filas.length > 0) {
                        response.status(400);
                        response.json({ errors: 'pseudonimo duplicado' });
                    }else{
                        const agregarRegistro = `
                            INSERT INTO autores
                            (email, contrasena, pseudonimo)
                            VALUES 
                            (${connection.escape(email)},
                            ${connection.escape(contrasena)},
                            ${connection.escape(pseudonimo)})`;

                        connection.query(agregarRegistro, (error, filas) =>{
                            const nuevoId = filas.insertId;
                            const queryConsulta = `SELECT * FROM autores WHERE id=${connection.escape(nuevoId)}`;
                            connection.query(queryConsulta, function (error, filas, campos) {
                                response.status(201);
                                response.json({ data: filas[0] });
                            })
                        })
                    }
                })
            }
        })
        connection.release();
    })
});

app.post('/api/v1/publicaciones', (request, response) =>{
    pool.getConnection((error, connection) =>{
        const email = request.query.email;
        const contrasena = request.query.contrasena;

        const consulta = `
            SELECT id, email, pseudonimo, avatar FROM
            autores
            WHERE
            email = ${connection.escape(email)} AND
            contrasena = ${connection.escape(contrasena)};`;
        
        connection.query(consulta, (error, filas) =>{
            if (filas.length > 0) {
                const nuevoId = filas[0].id;
                const date = new Date();
                const fecha = `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`
                const insertarPublicacion = `
                    INSERT INTO
                    publicaciones
                    (titulo, resumen, contenido, autor_id, fecha_hora)
                    VALUES
                    (
                        ${connection.escape(request.body.titulo)},
                        ${connection.escape(request.body.resumen)},
                        ${connection.escape(request.body.contenido)},
                        ${connection.escape(nuevoId)},
                        ${connection.escape(fecha)}
                    )`;
                connection.query(insertarPublicacion, function (error, filas, campos) {
                    const nuevoId = filas.insertId;
                    const queryConsulta = `SELECT * FROM publicaciones WHERE id=${connection.escape(nuevoId)}`;
                    connection.query(queryConsulta, function (error, filas, campos) {
                        response.status(201);
                        response.json({ data: filas[0] });
                    })
                });
            }else{
                response.status(400);
                response.json({ errors: 'email o contraseña incorrectos' });
            }
        })
        connection.release();
    })
});

app.delete('/api/v1/publicaciones/:id', (request, response)=>{
    pool.getConnection((error, connection)=>{
        const email = request.query.email;
        const contrasena = request.query.contrasena;

        const consulta = `
            SELECT id, email, pseudonimo, avatar FROM
            autores
            WHERE
            email = ${connection.escape(email)} AND
            contrasena = ${connection.escape(contrasena)};`;
        connection.query(consulta, (error, filas) =>{
            if (filas.length > 0) {
                const idAutores = filas[0].id;
                const query = `SELECT * FROM publicaciones WHERE id=${request.params.id} AND autor_id=${idAutores}`;
                connection.query(query, (error, filas, campos) => {
                    if (filas.length > 0) {
                        const queryDelete = `DELETE FROM publicaciones WHERE id = ${request.params.id};`;
                        connection.query(queryDelete, (error, filas , campos) => {
                            response.status(204);
                            response.json();
                        })
                    }else{
                        response.status(404);
                        response.send({errors: ["No se encuentra esa tarea o no pertenece al autor"]})
                    }
                })
            }else{
                response.status(400);
                response.json({ errors: ['email o contraseña incorrectos']});
            }
        });

        connection.release();
    })
})

app.listen(8080, () =>{
    console.log("Servidor corriendo");
});