const express = require('express')
const mongo = require('../mongo')

const productsRouter = express.Router()

productsRouter.use('/products/:id', function (req, res, next) {
  console.log('Requested Id:', req.params.id)
  const id = req.params.id
  mongo.getById('products', [id], null, (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to complete request' })
    }
    console.log(result)
    if (result != null && result.length !== 0) {
      if (result.length > 1) {
        return res.status(500).json({ message: 'Something went wrong.' })
      }
      var product = result[0]
      var ingredients = product.ingredients
      mongo.getById('ingredients', ingredients, null, (err, ingResult) => {
        if (err) {
          return res.status(500).json({ message: 'Something went wrong.' })
        }
        console.log(ingResult)
        product.ingredients = ingResult
        return res.status(200).json(product)
      })
    } else {
      return res.status(404).json({ message: 'No matched data' })
    }
  })
})

productsRouter.get('/products', (req, res) => {
  const query = req.query.query || ''
  console.log('Query: ' + query)

  let sortCriteria = { posted_date: -1 }
  mongo.get('products', { name: { $regex: new RegExp(query, 'i') } }, { name: 1 }, sortCriteria, (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to complete request' })
    }
    if (result.length !== 0) {
      return res.status(200).json(result)
    }
    res.status(404).json({ message: 'No matched data' })
  })
})

module.exports = productsRouter
