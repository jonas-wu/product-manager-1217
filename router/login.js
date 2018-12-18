var express = require('express')
let ejs = require('ejs')
var bodyParser = require('body-parser')
var session = require('express-session')
var createHash = require('create-hash')
var multiparty = require('multiparty');
var util = require('util');
var fs = require('fs')

var db = require('../module/db')

var router = express.Router()

router.get('/', (req, res) => {
  res.render('login/')
})

router.post('/doLogin', (req, res) => {
  // console.log(req.body)
  const username = req.body.username
  let password = req.body.password
  if (username && password) {
    const hash = createHash('sha224')
    password = hash.update(password).digest('hex')
    db.connect('user', (err, client, collection) => {
      if (err) {
        console.log(err);
        res.send(err.message)
      } else {
        const filter = {username: username, password:password}
        collection.findOne(filter)
          .then(data => {
            client.close()
            // console.log('data', data);
            if (data) {
              req.session.userinfo = data
              req.app.locals.userinfo = data
              res.redirect('/product')
            } else {
              res.end('<script>alert("login failed");location.href="/login"</script>')
            }
          })
          .catch(err => {
            client.close()
            console.log(err);
            res.end(`<script>alert(${err.message});location.href="/login"</script>`)
          })
      }
    })
  } else {
    res.end('<script>alert("login failed");location.href="/login"</script>')
  }
})

router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.log(err)
    } else {
      req.app.locals.userinfo = null
      res.redirect('/login')
    }
  })
})

module.exports = router