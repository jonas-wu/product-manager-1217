var express = require('express')
let ejs = require('ejs')
var bodyParser = require('body-parser')
var session = require('express-session')
var createHash = require('create-hash')
var multiparty = require('multiparty');
var util = require('util');

var db = require('../module/db')

var router = express.Router()

router.use((req, res, next) => {
  if (req.session.userinfo && req.session.userinfo.username !== '') {
    next()
  } else {
    // console.log(req.url, 'redirect to /login')
    res.redirect('/login')
  }
})

router.get('/', (req, res) => {
  db.connect('user', (err, client, collection) => {
    if (err) {
      console.log(err);
      res.send(err.message)
    } else {
      collection.find().toArray((err, docs) => {
        client.close()
        if (err) {
          console.log(err)
          res.send(`<script>alert(${err.message})</script>`)
        } else {
          // console.log(docs)
          res.render('user/', {list: docs, search: ''})
        }
      })
    }
  })
})

router.get('/add', (req, res) => {
  res.render('user/add')
})

router.get('/edit', (req, res) => {
  const param = req.query
  if (param && param.id) {
    db.connect('user', (err, client, collection) => {
      if (err) {
        console.log(err);
        res.end(`<script>alert(${err.message});history.back()</script>`)
      } else {
        // console.log(param.id)
        collection.findOne({_id: new db.ObjectId(param.id)})
          .then(data => {
            client.close()
            // console.log(data)
            if (data) {
              res.render('user/edit', {data})
            } else {
              res.end(`<script>alert('can not find user');history.back()</script>`)
            }            
          })
          .catch(err => {
            client.close()
            res.end(`<script>alert(${err.message});history.back()</script>`)
          })
      }
    })
  } else {
    res.end(`<script>alert("id is null");history.back()</script>`)
  }
})

router.get('/delete', (req, res) => {
  const param = req.query
  if (param && param.id) {
    db.connect('user', (err, client, collection) => {
      if (err) {
        console.log(err);
        res.end(`<script>alert(${err.message});history.back()</script>`)
      } else {
        // console.log(param.id)
        collection.removeOne({_id: new db.ObjectId(param.id)})
          .then(ret => {
            client.close()
            // console.log(ret)
            if (ret) {
              res.redirect('/user')
              // res.end(`<script>history.back()</script>`)
            } else {
              res.end(`<script>alert('can not find user');history.back()</script>`)
            }            
          })
          .catch(err => {
            client.close()
            res.end(`<script>alert(${err.message});history.back()</script>`)
          })
      }
    })
  } else {
    res.end(`<script>alert("id is null");history.back()</script>`)
  }
})

router.post('/search', (req, res) => {
  const name = req.body.name.trim()
  db.connect('user', (err, client, collection) => {
    if (err) {
      console.log(err);
      res.send(err.message)
    } else {
      const filter = name ? {username: {$regex: `${name}`}} : null
      // console.log('filter', filter)
      collection.find(filter).toArray((err, docs) => {
        client.close()
        if (err) {
          console.log(err)
          res.send(`<script>alert(${err.message});history.back()</script>`)
        } else {
          // console.log(docs)
          res.render('user/', {list: docs, search: name})
        }
      })
    }
  })
})

router.post('/doAdd', (req, res) => {
  const username = req.body.username
  let password = req.body.password
  const desc = req.body.desc
  if (!username || !password) {
    res.end(`<script>alert('input name and password');history.back()</script>`)
    return
  }
  const hash = createHash('sha224')
  password = hash.update(password).digest('hex')
  const param = {
    username, password, desc
  }
  console.log(param)
  db.connect('user', (err, client, collection) => {
    if (err) {
      res.end(`<script>alert(${err.message});history.back()</script>`)
    } else {
      collection.findOne({username: username})
        .then(data => {
          // console.log('findOne', data)
          if (data) {
            client.close()
            res.end(`<script>alert('user already exist');history.back()</script>`)
          } else {
            collection.insertOne(param, (err, ret) => {
              client.close()
              if (err) {
                console.log(err)
                res.end(`<script>alert(${err.message});history.back()</script>`)
              } else {
                res.redirect('/user')
              }
            })
          }            
        })
        .catch(err => {
          client.close()
          res.end(`<script>alert(${err.message});history.back()</script>`)
        })
    }
  })
})

router.post('/doModify', (req, res) => {
  console.log(req.body)
  const username = req.body.username
  let password = req.body.password
  const desc = req.body.desc
  const _id = req.body._id
  if (!username || !password) {
    res.end(`<script>alert('input name and password');history.back()</script>`)
    return
  }
  const hash = createHash('sha224')
  password = hash.update(password).digest('hex')
  const param = {
    username, password, desc
  }
  console.log(param)

  db.connect('user', (err, client, collection) => {
    if (err) {
      res.end(`<script>alert(${err.message});history.back()</script>`)
    } else {
      collection.updateOne(
        {_id: new db.ObjectId(_id)}, 
        {$set: param})
        .then(ret => {
          client.close()
          // console.log(ret.result)
          res.redirect('/user')
        })
        .catch(err => {
          client.close()
          console.log(err)
          res.end(`<script>alert(${err.message});history.back()</script>`)
        })
    }
  })
})

module.exports = router