const express = require("express")
const boody_parser = require("body-parser")
const mysql = require("mysql")
const path = require("path")
const bcrypt = require("bcryptjs")

const app = express()

var conection = mysql.createConnection({
    host: "gestorcursos.caq3kx9dup6r.us-east-2.rds.amazonaws.com",
    user: "admin",
    password: "12345678",
    database: "gestorcursos"
})

conection.connect((err) => {
    if (err) throw err;
    console.log("estoy conectado")
})

app.set("views engine", "pug")
app.set("views", path.join(__dirname, "/views"))
app.use(boody_parser.urlencoded({ extended: true }))


//############################################## login (validacion de seguridad)

const session = require("express-session")
app.use(session({
    secret: "secret",
    resave: true,
    saveUninitialized: true
}))

app.get("/", (req, res) => {
    res.redirect("/login")
})

app.get("/login", (req, res) => {
    res.render("login.pug")
})

app.post("/login", async(req, res) => {
    var correo = req.body.correo
    var clave = req.body.clave
    let passwor = await bcrypt.hash(clave, 8);

    if (correo && clave) {
        conection.query("select * from user where correo= ?", [correo], async(err, result) => {
            if (result.length == 0 || !(await bcrypt.compare(clave, result[0].clave))) {
                //dejar mensaje de clave o user incorrecto
                res.render("login.pug", { alert_valides: true, alert_peprecenci: false })
            } else {
                res.redirect("/alumnos")
            }
        })
    } else {
        res.render("login.pug", { alert_precencia: true, alert_valides: false })
    }

})


//############################################### crear usuario

app.get("/crear_usuario", (req, res) => {
    res.render("create_user.pug")
})

app.post("/crear_usuario", async(req, res) => {
        var correo = req.body.correo
        var nombre = req.body.nombre
        var apellido = req.body.apellido
        var clave = req.body.clave
        let passwor = await bcrypt.hash(clave, 8);
        conection.query("select * from user where correo= ?", [correo], (err, result) => {
            if (result.length == 0) {
                var sql = "insert into user(correo,nombre,apellido,clave) "
                sql = sql + "value('" + correo + "','" + nombre + "','" + apellido + "','" + passwor + "')"
                conection.query(sql, (err) => {
                    if (err) throw err;
                    res.render("create_user.pug", { usuario_creado: true, usuario_ya_existente: false })
                })
            } else {
                res.render("create_user.pug", { usuario_ya_existente: true, usuario_creado: false })
            }
        })
    })
    //############################################### vista de datos

app.get("/alumnos", (req, res) => {
    conection.query("select * from alumno;", (err, resul) => {
        if (err) throw err;
        res.render("list_students.pug", { alumnos: resul });
    })
})

app.get("/cursos", (req, res) => {
    conection.query("select * from curso;", (err, resul) => {
        res.render("list_course.pug", { cursos: resul });
    })
})

app.post("/alumnos_inscritos", (req, res) => {
    var curso = req.body.cod_curso
    conection.query("select * from alumno where curso_inscrito= '" + curso + "' ;", (err, result_alumno) => {
        if (err) throw err;
        conection.query("select * from curso where cod_curso= '" + curso + "' ;", (err, result_curso) => {
            if (err) throw err;
            res.render("alumnos_inscritos.pug", { alumnos: result_alumno, curso: result_curso })
        })
    })
})

//############################################################ agregar alumno

app.get("/agrear_alumno", (req, res) => {
    conection.query("select * from curso;", (err, result) => {
        if (err) throw err;
        res.render("add_students.pug", { cursos: result });
    })
})

app.post("/add_student_to_sql", (req, res) => {
    var matricula = req.body.matricula
    var nombre = req.body.nombre
    var apellido = req.body.apellido
    var curso = req.body.curso

    if (curso == "" || curso == null) {
        var sql = "insert into alumno(matricula,nombre,apellido,curso_inscrito) value(" + matricula + ",'" + nombre + "','" + apellido + "','');"
        conection.query(sql, (err, resul) => {
            if (err) throw err;
            console.log("se agrego correctamente el alumno " + nombre + " a la base de datos")
        })
    } else {
        sql = "insert into alumno(matricula,nombre,apellido,curso_inscrito) value(" + matricula + ",'" + nombre + "','" + apellido + "','" + curso + "');"
        conection.query(sql, (err, resul) => {
            if (err) throw err;
            console.log("se agrego correctamente el alumno " + nombre + " a la base de datos")
        })
    }
    res.redirect("/alumnos")
})

//########################################################### elimar alumno

app.post("/delect_students", (req, res) => {
    var id = req.body.id
    conection.query("delete from alumno where id=" + id + ";", (err, resul) => {
        if (err) throw err;
    })
    res.redirect("/alumnos")
})

//########################################################### agregar curso

app.get("/agrear_curso", (req, res) => {
    res.render("add_course.pug")
})

app.post("/add_course_to_sql", (req, res) => {
    var nombre = req.body.nombre
    var cod_curso = req.body.cod_curso
    var capacidad = req.body.capacidad

    var sql = 'insert into curso(cod_curso,nombre,capacidad,cupos)'
    sql = sql + ' value("' + cod_curso + '","' + nombre + '",' + capacidad + ',' + capacidad + ');'
    conection.query(sql, (err, resul) => {
        if (err) throw err;
        console.log("se a agregado correctamente  el curso " + nombre + " e la base de datos")
    })
    res.redirect("/cursos")
})

//##########################################################inscribir un alumno a un curso

app.post("/inscribir_curso", (req, res) => {
    var id = req.body.id
    conection.query("select * from alumno where id=" + id + " ;", (err, resul_alumno) => {
        if (err) throw err;
        conection.query("select * from curso;", (err, resul_cursos) => {
            if (err) throw err;
            res.render("inscribir_curso.pug", { alumno: resul_alumno, cursos: resul_cursos })
        })
    })
})

app.post("/inscribir_alumno_en_curso", (req, res) => {
    var id = req.body.id
    var curso = req.body.curso
    conection.query("select * from alumno where id=" + id + " ;", (err, alumno) => {
        if (err) throw err;
        conection.query("delete from alumno where id=" + id + ";", (err, res_noT) => {
            if (err) throw err;
            var sql = "insert into alumno(matricula,nombre,apellido,curso_inscrito)"
            sql = sql + " value('" + alumno[0].matricula + "','" + alumno[0].nombre + "','" + alumno[0].apellido + "','" + curso + "');"
            conection.query(sql, (err, resul) => {
                if (err) throw err;
                console.log("se a incrito corresctameta a " + alumno[0].nombre + " en el curso " + curso)
            })
        })
    })
    res.redirect("/alumnos")
})



app.listen(8000, () => {
    console.log("funcionado")
    console.log("el puerto escuchando http://localhost:8000")
})