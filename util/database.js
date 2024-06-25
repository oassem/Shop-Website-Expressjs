const mongodb = require('mongodb')
const MongoClient = mongodb.MongoClient
let _db;

const mongoConnect = (callback) => {
    MongoClient.connect('mongodb+srv://omarelghazalynweave:HM5ip9T6LomkmVpX@cluster0.hbxmz04.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0').then(conn => {
        console.log('connected...')
        _db = conn.db()
        callback()
    })
}

const getDb = () => {
    if (_db) {
        return _db
    }

    throw 'No database found!'
}

exports.mongoConnect = mongoConnect
exports.getDb = getDb