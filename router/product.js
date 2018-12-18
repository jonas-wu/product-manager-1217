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

router.use((req, res, next) => {
  if (req.session.userinfo && req.session.userinfo.username !== '') {
    next()
  } else {
    // console.log(req.url, 'redirect to /login')
    res.redirect('/login')
  }
})

router.get('/', (req, res) => {
  db.connect('product', (err, client, collection) => {
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
          res.render('product/', {list: docs, search: ''})
        }
      })
    }
  })
})

router.get('/add', (req, res) => {
  res.render('product/add')
})

router.get('/edit', (req, res) => {
  const param = req.query
  if (param && param.id) {
    db.connect('product', (err, client, collection) => {
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
              res.render('product/edit', {data})
            } else {
              res.end(`<script>alert('can not find product');history.back()</script>`)
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
    db.connect('product', (err, client, collection) => {
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
              res.redirect('/product')
              // res.end(`<script>history.back()</script>`)
            } else {
              res.end(`<script>alert('can not find product');history.back()</script>`)
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

router.post('/doAdd', (req, res) => {
  var form = new multiparty.Form({
    maxFilesSize: 10000000,
    uploadDir: './upload'
  })
  form.parse(req, (err, fields, files) => {
    if (err) {
      res.send(err.message)
    } else {
      // console.log(fields)
      // console.log(files)
      let pic = null
      if (files.pic.length > 0 && files.pic[0].path) {
        if (files.pic[0].size > 0) {
          pic =  files.pic[0].path
        } else {
          fs.unlink(files.pic[0].path, err => {
            if (err) {
              console.log(err)
            }          
          })
        }
      }
      const param = {
        title: fields.title[0],
        price: fields.price[0],
        fee: fields.fee[0],
        desc: fields.description[0],
        pic: pic === null ? null : pic
      }
      console.log(param)
      db.connect('product', (err, client, collection) => {
        if (err) {
          res.end(`<script>alert(${err.message});history.back()</script>`)
        } else {
          collection.insertOne(param, (err, ret) => {
              client.close()
              if (err) {
                console.log(err)
                res.end(`<script>alert(${err.message});history.back()</script>`)
              } else {
                // console.log(ret.result)
                res.redirect('/product')
              }
            })
        }
      })
    }
  })
})

router.post('/doModify', (req, res) => {
  var form = new multiparty.Form({
    maxFilesSize: 10000000,
    uploadDir: './upload'
  })
  form.parse(req, (err, fields, files) => {
    if (err) {
      res.send(err.message)
    } else {
      // console.log(fields)
      // console.log(files)
      const param = {
        title: fields.title[0],
        price: fields.price[0],
        fee: fields.fee[0],
        desc: fields.description[0],
      }
      if (files.pic.length > 0 && files.pic[0].size > 0) {
        param.pic = files.pic[0].path
      } else if (files.pic[0].path) {
        fs.unlink(files.pic[0].path, err => {
          if (err) {
            console.log(err)
          }          
        })
      }
      console.log(param)
      db.connect('product', (err, client, collection) => {
        if (err) {
          res.end(`<script>alert(${err.message});history.back()</script>`)
        } else {
          collection.updateOne(
            {_id: new db.ObjectId(fields._id[0])}, 
            {$set: param})
            .then(ret => {
              client.close()
              // console.log(ret.result)
              res.redirect('/product')
            })
            .catch(err => {
              client.close()
              console.log(err)
              res.end(`<script>alert(${err.message});history.back()</script>`)
            })
        }
      })
    }
  })
})

router.post('/search', (req, res) => {
  const name = req.body.name.trim()
  db.connect('product', (err, client, collection) => {
    if (err) {
      console.log(err);
      res.send(err.message)
    } else {
      const filter = name ? {title: {$regex: `${name}`}} : null
      // console.log('filter', filter)
      collection.find(filter).toArray((err, docs) => {
        client.close()
        if (err) {
          console.log(err)
          res.send(`<script>alert(${err.message});history.back()</script>`)
        } else {
          // console.log(docs)
          res.render('product/', {list: docs, search: name})
        }
      })
    }
  })
})

module.exports = router