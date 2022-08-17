const express = require('express')
const session = require('express-session')
const mongoose = require('mongoose')
const passport = require('passport')
const { Strategy: LocalStrategy } = require('passport-local')
const flash = require('connect-flash')
const dotenv = require('dotenv')
const parseArgs = require('minimist')
const cluster = require('cluster')

const numCPUs = require('os').cpus().length
 


dotenv.config()

/* const args = yargs(process.argv.slice(2))
  .alias({
    puerto: 'p'
  })
  .default({
    puerto: 8080
  })
  .argv */

const options = {
  default: {
    port: 8080,
    type: 'FORK'

  }
}
options.alias = {
  p: 'port',
  t: 'type'
} 

const args = parseArgs(process.argv.slice(2), options) 

mongoose.connect(`mongodb://${process.env.DB_HOST}:${process.env.DB_PORT}/desafioSesion`)
const User = require('./models/user')

const { createHash, isValidPassword } = require('./utils')

const app = express()
app.use(express.static('./public'))
app.set('view engine', 'ejs')

app.use(flash())

app.use(session({
  secret: 'qwerty',
  resave: true,
  saveUninitialized: true,
  cookie: {
    maxAge: 100000,
  }
}))

app.use(passport.initialize())
app.use(passport.session())

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

passport.use('login', new LocalStrategy((username, password, done) => {
  return User.findOne({username})
  .then(user => {
    if(!user) {
      return done(null, false, {message: 'Nombre de usuario incorrecto'})
    }

    if(!isValidPassword(user.password, password)){
      return done(null, false, {message: 'Contraseña incorrecta'})

    }
    return done(null, user)
  })
  .catch(err=> done(err))
}))

passport.use('signup', new LocalStrategy({
  passReqToCallback: true
},(req, username, password, done) => {
  return User.findOne({username})
  .then(user => {
    if(user) {
      return done(null, false, {message: 'El nombre de usuario ya existe'})
    }

    const newUser = new User()
    newUser.username = username
    newUser.password = createHash(password)
    newUser.email =req.body.email

    return newUser.save()

  })
  .then(user => done(null, user))
  .catch(err=> done(err))
}))

passport.serializeUser((user, done) => {
  console.log('serializeUser')
  done(null, user._id)

})

passport.deserializeUser((id, done) => {
  console.log('deserializeUser')
  User.findById(id,(err,user) => {
    done(err, user)
  }) 
})

 app.get('/login', (req, res) => {
    return res.render('login', {message: req.flash('error')}) //EJS
   
}) 

app.get('/info', (req, res) =>{
  return res.render('info',{
    arg: `Argumentos de entrada: ${JSON.stringify(args,null,2)}`,
    path: `Path de ejecucion: ${process.execPath}`,
    so: `Nombre de la plataforma: ${process.platform}`,
    pid: `Process ID: ${process.pid}`,
    version: `Version de Node: ${process.version}`,
    carpeta: `Carpeta del proyecto: ${process.cwd()}`,
    memoria: `Memoria total reservada: ${JSON.stringify(process.memoryUsage(), null, 2)}`,
    cpus: `Numeros de CPUs: ${numCPUs}`
  })
})

app.get('/signup', (req, res) => {
  return res.render('signup', {message: req.flash('error')}) //EJS
 
}) 

app.post('/login', passport.authenticate('login', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}))


app.post('/signup', passport.authenticate('signup', {
  successRedirect: '/',
  failureRedirect: '/signup',
  failureFlash: true
}))


/* const sessionOn = function(req, res, next) {
  if (!req.session.user)
    return res.redirect('/logout')
  else
    return next()
}  
app.get('/', sessionOn, (req, res) => {

  return res.render('home',{name:req.session.user}) //EJS
}) 
*/
app.get('/', (req,res,next) => {
  if(req.isAuthenticated()){
    return next()
  }
  return res.redirect('login')

}, (req, res) => {
  return res.render('home',{
    name:req.user.username,
    email:req.user.email
  }) //EJS
})
app.get('/logout', (req, res) => {
    const name = req.session.user
    return req.session.destroy(err => {
        if (!err) {
        return res.render('logout', {name:req.user.username}) //EJS
        }

        return res.render({ error: err })
    })
})

 app.get('/visitas', (req, res) =>{
  return res.end(`Visitas: ${visitas++}`)
})

const numRandoms = (num) => {
  return new Promise((resolve, reject) => {
    for (let i=0 ; i < num; i++){
      //numeros
    }
  })
}
app.get('/api/randoms', (req, res) =>{
  let cant = Number(req.query.cant)
 
  if(isNaN(cant)){
    cant = 100000
    
   
    const computo = fork(numRandoms(cant))
    
      return res.end(`Me tiro esto: ${computo}`)
    
  } 
  else {
    
    const computo = fork(numRandoms(cant))
    
      return res.end(`Me tiro estop: ${numeros}`)
    
  } 
})    


PORT = args.port

if(args.type === 'FORK'){
  console.log(`Nodo primario ${process.pid} corriendo`)
  app.listen(PORT, process.env.HOST, () => console.log(`Servidor corriendo en http://${process.env.HOST}:${PORT}`))
}else if((args.type === 'CLUSTER') && (cluster.isMaster)){
  console.log(`Nodo primario ${process.pid} corriendo`)
  
  for(let i = 0; i < numCPUs; i++){
    cluster.fork()
  }

 }else{
  console.log(`Nodo worker corriendo en el proceso ${process.pid}`)
  app.listen(PORT, process.env.HOST, () => console.log(`Servidor corriendo en http://${process.env.HOST}:${PORT}`))
 }


 // ******  EJECUTAR EL SERVIDOR CON  FOREVER   ********
/*
info:    Forever processes running
data:        uid  command                            script                                                                     forever pid   id logfile                          uptime
data:    [0] oD8P "C:\Program Files\nodejs\node.exe" C:\Users\aeram\Documents\CoderHouse\Backend\Desafios\proxy\main.js         9428    17572    C:\Users\aeram\.forever\oD8P.log 0:0:0:1.076
data:    [1] r_in "C:\Program Files\nodejs\node.exe" C:\Users\aeram\Documents\CoderHouse\Backend\Desafios\proxy\main.js -p 8081 16724   7460     C:\Users\aeram\.forever\r_in.log 0:0:0:1.061 
*/


 // ******  EJECUTAR EL SERVIDOR CON  PM2   ********

/*
┌─────┬─────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id  │ name    │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├─────┼─────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0   │ main    │ default     │ 1.0.0   │ cluster │ 17660    │ 0      │ 1    │ stopped   │ 0%       │ 0b       │ aeram    │ disabled │
│ 1   │ main    │ default     │ 1.0.0   │ cluster │ 11432    │ 0      │ 1    │ stopped   │ 0%       │ 0b       │ aeram    │ disabled │
│ 2   │ main    │ default     │ 1.0.0   │ cluster │ 18212    │ 0      │ 1    │ stopped   │ 0%       │ 0b       │ aeram    │ disabled │
│ 3   │ main    │ default     │ 1.0.0   │ cluster │ 9120     │ 0      │ 1    │ stopped   │ 0%       │ 0b       │ aeram    │ disabled │
│ 4   │ main    │ default     │ 1.0.0   │ cluster │ 6136     │ 0      │ 1    │ stopped   │ 0%       │ 0b       │ aeram    │ disabled │
│ 5   │ main    │ default     │ 1.0.0   │ cluster │ 15884    │ 0      │ 1    │ stopped   │ 0%       │ 0b       │ aeram    │ disabled │
│ 6   │ main    │ default     │ 1.0.0   │ cluster │ 14812    │ 3s     │ 0    │ online    │ 86%      │ 61.7mb   │ aeram    │ disabled │
│ 7   │ main    │ default     │ 1.0.0   │ cluster │ 8116     │ 3s     │ 0    │ online    │ 81.2%    │ 54.1mb   │ aeram    │ disabled │
└─────┴─────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
*/
