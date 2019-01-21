const express = require('express')
const mongo = require('../mongo')

const productsRouter = express.Router()

productsRouter.use('/products/:id', function (req, res, next) {
  console.log('Request Id:', req.params.id)
  // TODO return product by id
  next()
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
