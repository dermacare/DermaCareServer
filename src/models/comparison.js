var mongoose = require('mongoose')
var bcrypt = require('bcrypt')

var ComparisonSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    unique: false,
    required: true,
    trim: false
  },
  productId: {
    type: String,
    unique: false,
    required: true,
    trim: false
  }
})

var Comparison = mongoose.model('Comparison', ComparisonSchema)
module.exports = Comparison

