const mongodb = require('mongodb')
const config = require('config')
const _config = config.get('database')

const url = `mongodb://${_config.host}:${_config.port}`
const client = new mongodb.MongoClient(url, { useNewUrlParser: true })

client.connect(err => {
  if (err) {
    console.error('Failed to connect to MongoDB: ' + err.message)
    return
  }
  db = client.db(_config.name)
  console.log('Connected to MongoDB at ' + url)
})

const getDocuments = (collection, query, projection, sort, callback) => {
  if (!db) return callback(new Error('DB not connected'))
  if (sort === null) {
    sort = { posted_date: -1 }
  }
  db.collection(collection)
    .find(query)
    .project(projection)
    .sort(sort)
    .toArray((err, docs) => {
      callback(err, docs)
    })
}

process.on('SIGINT', () => {
  console.log('\nClosing DB connection')
  client.close()
  console.log('DB connection closed')
  process.exit(0)
})

module.exports = {
  get: getDocuments
}
