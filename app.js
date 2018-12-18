var express = require('express')
let ejs = require('ejs')
var bodyParser = require('body-parser')
var session = require('express-session')
var createHash = require('create-hash')
var multiparty = require('multiparty');
var util = require('util');
var fs = require('fs')

var db = require('./module/db')
var index = require('./router/index')
var login = require('./router/login')
var user = require('./router/user')
var product = require('./router/product')

var app = express()
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.set('trust proxy', 1) // trust first proxy
app.use(session({
  secret: 'secret key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, maxAge: 1800000 },
  rolling: true,
}))

app.use(express.static('public'))

app.use('/upload', express.static('upload'))

app.set('view engine', 'ejs')
 
app.use('/', index)
app.use('/login', login)
app.use('/user', user)
app.use('/product', product)
 
app.listen(3001, '127.0.0.1')