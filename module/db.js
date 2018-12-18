const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;

exports.connect = function _connDb(table, callback) {
  const client = new MongoClient('mongodb://127.0.0.1:27017', { useNewUrlParser: true });
  client.connect(err => {
    if (err) {
      callback(err)
    } else {
      const db = client.db('productmanage')
      const collection = db.collection(table)
      callback(null, client, collection)
    }
  })
}

exports.ObjectId = ObjectId