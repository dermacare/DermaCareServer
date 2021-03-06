var express = require('express')
var profileRouter = express.Router()
var User = require('../models/user')
var Favorites = require('../models/favorites')
var Comparison = require('../models/comparison')
var cors = require('cors')
const mongo = require('../mongo')
const bodyParser = require('body-parser')
// const jwt = require('jsonwebtoken')

profileRouter.use(bodyParser.json())
var origins = ['http://localhost:8080', 'http://dermacare.eastus.cloudapp.azure.com:8080']
profileRouter.use(cors({ origin: origins, credentials: true }))

// const secret = 'mysecretsshhh'

function intersectArrays (a, b) {
  var sorteda = a.concat().sort()
  var sortedb = b.concat().sort()
  var common = []
  var ai = 0
  var bi = 0

  while (ai < a.length && bi < b.length) {
    if (JSON.stringify(sorteda[ai]) === JSON.stringify(sortedb[bi])) {
      common.push(sorteda[ai])
      ai++
      bi++
    } else if (JSON.stringify(sorteda[ai]) < JSON.stringify(sortedb[bi])) {
      ai++
    } else {
      bi++
    }
  }
  console.log(common)
  return common
}

profileRouter.post('/login', function (req, res, next) {
  console.log(JSON.stringify(req.body))
  // confirm that user typed same password twice
  if (req.body.password !== req.body.passwordConf) {
    return res.status(400).json({ 'error': 'Passwords do not match.' })
  }

  if (req.body.email &&
    req.body.username &&
    req.body.password &&
    req.body.passwordConf) {
    var userData = {
      email: req.body.email,
      username: req.body.username,
      password: req.body.password
    }

    User.create(userData, function (error, user) {
      if (error) {
        return res.status(401).json({ 'error': 'User with this email or username already exists.' })
      } else {
        req.session.userId = user._id
        // const token = jwt.sign({ email: req.body.logemail }, secret, { expiresIn: 50000 })
        return res.status(200).json({ 'token': user._id })
      }
    })
  } else if (req.body.logemail && req.body.logpassword) {
    User.authenticate(req.body.logemail, req.body.logpassword, function (error, user) {
      if (error || !user) {
        return res.status(401).json({ 'error': 'Wrong email or password.' })
      } else {
        req.session.userId = user._id
        // const token = jwt.sign({ email: req.body.logemail }, secret, { expiresIn: 50000 })
        return res.status(200).json({ 'token': user._id })
      }
    })
  } else {
    return res.status(400).json({ 'error': 'All fields required.' })
  }
})

// GET route after registering
profileRouter.get('/', function (req, res, next) {
  var userId = req.session.userId || req.headers.token
  if (userId === null || userId === 'null' || userId === '') {
    return res.status(401).json({ error: 'Please log in to see this page' })
  }
  console.log('UserId: ' + userId)
  User.findById(userId)
    .exec(function (error, user) {
      if (error) {
        return next(error)
      } else {
        if (user === null) {
          return res.status(401).json({ error: 'Please log in to see this page' })
        } else {
          return res.status(200).json({ username: user.username, email: user.email })
        }
      }
    })
})

// GET route after registering
profileRouter.get('/favorites', function (req, res, next) {
  var userId = req.session.userId || req.headers.token
  if (userId === null || userId === 'null' || userId === '') {
    return res.status(401).json({ error: 'Please log in to see this page' })
  }
  console.log('UserId: ' + userId)
  User.findById(userId)
    .exec(function (error, user) {
      if (error) {
        return next(error)
      }
      if (user === null) {
        return res.status(401).json({ error: 'Please log in to see this page' })
      }
      Favorites.find({ userId: userId })
        .exec(function (error, favorites) {
          if (error) {
            return next(error)
          }
          if (favorites === null || favorites.length === 0) {
            return res.status(400).json({ error: 'No products in the list' })
          }
          var productsIds = []
          for (var i = 0; i < favorites.length; i++) {
            productsIds.push(favorites[i].productId.toString())
          }

          console.log(JSON.stringify(productsIds))
          mongo.getById('products', productsIds, null, (err, result) => {
            if (err) {
              return res.status(500).json({ error: 'Failed to complete request' })
            }
            if (result.length !== 0) {
              return res.status(200).json(result)
            }
            return res.status(400).json({ error: 'No matched data' })
          })
        })
    })
})

// GET route after registering
profileRouter.post('/favorites/add', function (req, res, next) {
  var userId = req.session.userId || req.headers.token
  if (userId === null || userId === 'null' || userId === '') {
    return res.status(401).json({ error: 'Please log in to see this page' })
  }
  console.log('UserId: ' + userId)
  User.findById(userId)
    .exec(function (error, user) {
      if (error) {
        return next(error)
      }
      if (user === null) {
        return res.status(401).json({ error: 'Please log in to see this page' })
      }
      var productId = req.body.productId

      Favorites.findOne({ userId: userId, productId: productId }, function (error, doc) {
        if (error) {
          return next(error)
        }
        if (doc === null) {
          Favorites.create({ userId: userId, productId: productId }, function (error, doc) {
            if (error) {
              return next(error)
            }
            console.log('Inserted: ', doc)
            return res.status(201).end()
          })
        } else {
          console.log('Found: ', doc)
          return res.status(400).json({ error: 'This product is already added to favorites'})
        }
      })
    })
})

// GET route after registering
profileRouter.delete('/favorites/:id', function (req, res, next) {
  var userId = req.session.userId || req.headers.token
  if (userId === null || userId === 'null' || userId === '') {
    return res.status(401).json({ error: 'Please log in to see this page' })
  }
  console.log('UserId: ' + userId)
  User.findById(userId)
    .exec(function (error, user) {
      if (error) {
        console.log('Error: ', error)
        return next(error)
      }
      if (user === null) {
        return res.status(401).json({ error: 'Please log in to see this page' })
      }
      const productId = req.params.id
      Favorites.findOne({ userId: userId, productId: productId }, function (error, doc) {
        if (error) {
          return next(error)
        }
        if (doc === null) {
          console.log('Found: ', doc)
          return res.status(400).json({ error: 'Product is not found in favorites.'})
        }
        Favorites.remove({ _id: doc._id }, function (error, doc) {
          if (error) {
            return next(error)
          }
          console.log('Inserted: ', doc)
          return res.status(204).end()
        })
      })
    })
})

// GET route after registering
profileRouter.get('/comparison', function (req, res, next) {
  var userId = req.session.userId || req.headers.token
  if (userId === null || userId === 'null' || userId === '') {
    return res.status(401).json({ error: 'Please log in to see this page' })
  }
  console.log('UserId: ' + typeof (userId))
  User.findById(userId)
    .exec(function (error, user) {
      if (error) {
        return next(error)
      }
      if (user === null) {
        return res.status(401).json({ error: 'Please log in to see this page' })
      }
      Comparison.find({ userId: userId })
        .exec(function (error, comparison) {
          if (error) {
            return next(error)
          }
          if (comparison === null || comparison.length === 0) {
            return res.status(400).json({ error: 'No products in the list' })
          }
          var productsIds = []
          for (var i = 0; i < comparison.length; i++) {
            productsIds.push(comparison[i].productId.toString())
          }

          console.log(JSON.stringify(productsIds))
          mongo.getById('products', productsIds, null, (err, result) => {
            if (err) {
              return res.status(500).json({ error: 'Failed to complete request' })
            }
            if (result.length !== 0) {
              return res.status(200).json(result)
            }
            return res.status(400).json({ error: 'No matched data' })
          })
        })
    })
})

// GET route after registering
profileRouter.post('/comparison/add', function (req, res, next) {
  var userId = req.session.userId || req.headers.token
  if (userId === null || userId === 'null' || userId === '') {
    return res.status(401).json({ error: 'Please log in to see this page' })
  }
  console.log('UserId: ' + userId)
  User.findById(userId)
    .exec(function (error, user) {
      if (error) {
        return next(error)
      }
      if (user === null) {
        return res.status(401).json({ error: 'Not authorized! Go back!'})
      }
      var productId = req.body.productId
      Comparison.find({ userId: userId })
        .exec(function (error, comparison) {
          if (error) {
            return next(error)
          }
          if (comparison !== null && comparison.length >= 2) {
            return res.status(400).json({ error: 'Cannot add more than 2 objects in comparison list'})
          }

          Comparison.findOne({ userId: userId, productId: productId }, function (error, doc) {
            if (error) {
              return next(error)
            }
            if (doc === null) {
              Comparison.create({ userId: userId, productId: productId }, function (error, doc) {
                if (error) {
                  return next(error)
                }
                console.log('Inserted: ', doc)
                return res.status(201).end()
              })
            } else {
              console.log('Found: ', doc)
              return res.status(400).json({ error: 'This product is already added to comparison'})
            }
          })
        })
    })
})

profileRouter.use('/comparison/compare', function (req, res, next) {
  var userId = req.session.userId || req.headers.token
  if (userId === null || userId === 'null' || userId === '') {
    return res.status(401).json({ error: 'Please log in to see this page' })
  }
  console.log('UserId: ' + userId)
  User.findById(userId)
    .exec(function (error, user) {
      if (error) {
        return next(error)
      }
      if (user === null) {
        return res.status(401).json({ error: 'Not authorized! Go back!'})
      }
      Comparison.find({ userId: userId })
        .exec(function (error, comparison) {
          if (error) {
            return next(error)
          }
          if (comparison === null || comparison.length !== 2) {
            return res.status(400).json({ error: 'Comparison list should contain 2 products'})
          }

          const id1 = comparison[0].productId.toString()
          const id2 = comparison[1].productId.toString()

          console.log('id1: ', id1)
          console.log('id2: ', id2)
          mongo.getById('products', [id1, id2], null, (err, result) => {
            if (err) {
              return res.status(500).json({ error: 'Failed to complete request' })
            }
            console.log(result)
            if (result != null && result.length !== 0) {
              var product1 = result[0]
              var product2 = result[1]
              product1['score'] = Math.round(Math.random() * 5)
              product2['score'] = Math.round(Math.random() * 5)

              var ingredients1 = product1.ingredients
              var ingredients2 = product2.ingredients

              console.log('Ummm ', ingredients1[0], ingredients2[0])
              // console.log(ingredients1.diff(ingredients2))
              var commonIngs = intersectArrays(ingredients1, ingredients2)

              mongo.getById('ingredients', commonIngs, null, (err, ingResult) => {
                if (err) {
                  return res.status(500).json({ error: 'Something went wrong.' })
                }
                var resJson = {}
                delete product1.ingredients
                delete product2.ingredients

                resJson['products'] = [product1, product2]
                resJson['common_ingredients'] = ingResult

                return res.status(200).json(resJson)
              })
            } else {
              return res.status(404).json({ error: 'No matched data' })
            }
          })
        })
    })
})

// GET route after registering
profileRouter.delete('/comparison/:id', function (req, res, next) {
  var userId = req.session.userId || req.headers.token
  if (userId === null || userId === 'null' || userId === '') {
    return res.status(401).json({ error: 'Please log in to see this page' })
  }
  console.log('UserId: ' + userId)
  User.findById(userId)
    .exec(function (error, user) {
      if (error) {
        console.log('Error: ', error)
        return next(error)
      }
      if (user === null) {
        return res.status(401).json({ error: 'Not authorized! Go back!' })
      }
      const productId = req.params.id
      Comparison.findOne({ userId: userId, productId: productId }, function (error, doc) {
        if (error) {
          return next(error)
        }
        if (doc === null) {
          console.log('Found: ', doc)
          return res.status(404).json({ error: 'Product is not found in comparison.' })
        }
        Comparison.remove({ _id: doc._id }, function (eRRor, doc) {
          if (error) {
            return next(error)
          }
          console.log('Inserted: ', doc)
          return res.status(204).end()
        })
      })
    })
})

// GET for logout logout
profileRouter.get('/logout', function (req, res, next) {
  if (req.session) {
    // delete session object
    req.session.destroy(function (err) {
      if (err) {
        return next(err)
      }
      return res.status(201).end()
    })
  }
})

module.exports = profileRouter
