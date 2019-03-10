var express = require('express')
var profileRouter = express.Router()
var User = require('../models/user')
var Favorites = require('../models/favorites')
var Comparison = require('../models/comparison')
const mongo = require('../mongo')
const bodyParser = require('body-parser')
// POST route for updating data

profileRouter.use(bodyParser.json())

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
    var err = new Error('Passwords do not match.')
    err.status = 400
    res.send('passwords dont match')
    return next(err)
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
        return next(error)
      } else {
        req.session.userId = user._id
        return res.status(201).end()
      }
    })
  } else if (req.body.logemail && req.body.logpassword) {
    User.authenticate(req.body.logemail, req.body.logpassword, function (error, user) {
      if (error || !user) {
        var err = new Error('Wrong email or password.')
        err.status = 401
        return next(err)
      } else {
        req.session.userId = user._id
        return res.status(201).end()
      }
    })
  } else {
    var err = new Error('All fields required.')
    err.status = 400
    return next(err)
  }
})

// GET route after registering
profileRouter.get('/', function (req, res, next) {
  User.findById(req.session.userId)
    .exec(function (error, user) {
      if (error) {
        return next(error)
      } else {
        if (user === null) {
          var err = new Error('Not authorized! Go back!')
          err.status = 401
          return next(err)
        } else {
          return res.status(200).json({ username: user.username, email: user.email })
        }
      }
    })
})

// GET route after registering
profileRouter.get('/favorites', function (req, res, next) {
  User.findById(req.session.userId)
    .exec(function (error, user) {
      if (error) {
        return next(error)
      }
      if (user === null) {
        var err = new Error('Not authorized! Go back!')
        err.status = 401
        return next(err)
      }
      Favorites.find({ userId: req.session.userId })
        .exec(function (error, favorites) {
          if (error) {
            return next(error)
          }
          if (favorites === null) {
            var err = new Error('No favorites')
            err.status = 400
            return next(err)
          }
          return res.status(200).json(favorites)
        })
    })
})

// GET route after registering
profileRouter.post('/favorites/add', function (req, res, next) {
  User.findById(req.session.userId)
    .exec(function (error, user) {
      if (error) {
        return next(error)
      }
      if (user === null) {
        var err = new Error('Not authorized! Go back!')
        err.status = 401
        return next(err)
      }
      var productId = req.body.productId

      Favorites.findOne({ userId: req.session.userId, productId: productId }, function (error, doc) {
        if (error) {
          return next(error)
        }
        if (doc === null) {
          Favorites.create({ userId: req.session.userId, productId: productId }, function (error, doc) {
            if (error) {
              return next(error)
            }
            console.log('Inserted: ', doc)
            return res.status(201).end()
          })
        } else {
          console.log('Found: ', doc)
          var err = new Error('This product is already added to favorites')
          err.status = 400
          return next(err)
        }
      })
    })
})

// GET route after registering
profileRouter.delete('/favorites/:id', function (req, res, next) {
  User.findById(req.session.userId)
    .exec(function (error, user) {
      if (error) {
        console.log('Error: ', error)
        return next(error)
      }
      if (user === null) {
        var err = new Error('Not authorized! Go back!')
        console.log('Error: ', err)
        err.status = 401
        return next(err)
      }
      const productId = req.params.id
      Favorites.findOne({ userId: req.session.userId, productId: productId }, function (error, doc) {
        if (error) {
          return next(error)
        }
        if (doc === null) {
          console.log('Found: ', doc)
          var err = new Error('Product is not found in favorites.')
          err.status = 404
          return next(err)
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
  User.findById(req.session.userId)
    .exec(function (error, user) {
      if (error) {
        return next(error)
      }
      if (user === null) {
        var err = new Error('Not authorized! Go back!')
        err.status = 401
        return next(err)
      }
      Comparison.find({ userId: req.session.userId })
        .exec(function (error, comparison) {
          if (error) {
            return next(error)
          }
          if (comparison === null) {
            var err = new Error('No comparison')
            err.status = 400
            return next(err)
          }
          return res.status(200).json(comparison)
        })
    })
})

// GET route after registering
profileRouter.post('/comparison/add', function (req, res, next) {
  User.findById(req.session.userId)
    .exec(function (error, user) {
      if (error) {
        return next(error)
      }
      if (user === null) {
        var err = new Error('Not authorized! Go back!')
        err.status = 401
        return next(err)
      }
      var productId = req.body.productId
      Comparison.find({ userId: req.session.userId })
        .exec(function (error, comparison) {
          if (error) {
            return next(error)
          }
          if (comparison !== null && comparison.length >= 2) {
            var err = new Error('Cannot add more than 2 objects in comparison list')
            err.status = 400
            return next(err)
          }

          Comparison.findOne({ userId: req.session.userId, productId: productId }, function (error, doc) {
            if (error) {
              return next(error)
            }
            if (doc === null) {
              Comparison.create({ userId: req.session.userId, productId: productId }, function (error, doc) {
                if (error) {
                  return next(error)
                }
                console.log('Inserted: ', doc)
                return res.status(201).end()
              })
            } else {
              console.log('Found: ', doc)
              var err = new Error('This product is already added to comparison')
              err.status = 400
              return next(err)
            }
          })
        })
    })
})

profileRouter.use('/comparison/compare', function (req, res, next) {
  User.findById(req.session.userId)
    .exec(function (error, user) {
      if (error) {
        return next(error)
      }
      if (user === null) {
        var err = new Error('Not authorized! Go back!')
        err.status = 401
        return next(err)
      }
      Comparison.find({ userId: req.session.userId })
        .exec(function (error, comparison) {
          if (error) {
            return next(error)
          }
          if (comparison === null || comparison.length !== 2) {
            var err = new Error('Comparison list should contain 2 products')
            err.status = 400
            return next(err)
          }

          const id1 = comparison[0].productId.toString()
          const id2 = comparison[1].productId.toString()

          console.log('id1: ', id1)
          console.log('id2: ', id2)
          mongo.getById('products', [id1, id2], null, (err, result) => {
            if (err) {
              return res.status(500).json({ message: 'Failed to complete request' })
            }
            console.log(result)
            if (result != null && result.length !== 0) {
              var product1 = result[0]
              var product2 = result[1]
              var ingredients1 = product1.ingredients
              var ingredients2 = product2.ingredients
              console.log('Ummm ', ingredients1[0], ingredients2[0])
              // console.log(ingredients1.diff(ingredients2))
              var commonIngs = intersectArrays(ingredients1, ingredients2)

              mongo.getById('ingredients', commonIngs, null, (err, ingResult) => {
                if (err) {
                  return res.status(500).json({ message: 'Something went wrong.' })
                }
                // console.log(ingResult)
                // product1.ingredients = ingResult
                return res.status(200).json(ingResult)
              })
            } else {
              return res.status(404).json({ message: 'No matched data' })
            }
          })
        })
    })
})

// GET route after registering
profileRouter.delete('/comparison/:id', function (req, res, next) {
  User.findById(req.session.userId)
    .exec(function (error, user) {
      if (error) {
        console.log('Error: ', error)
        return next(error)
      }
      if (user === null) {
        var err = new Error('Not authorized! Go back!')
        console.log('Error: ', err)
        err.status = 401
        return next(err)
      }
      const productId = req.params.id
      Comparison.findOne({ userId: req.session.userId, productId: productId }, function (error, doc) {
        if (error) {
          return next(error)
        }
        if (doc === null) {
          console.log('Found: ', doc)
          var err = new Error('Product is not found in comparison.')
          err.status = 404
          return next(err)
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
