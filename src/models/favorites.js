var mongoose = require('mongoose')
var bcrypt = require('bcrypt')

var FavoritesSchema = new mongoose.Schema({
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

var Favorites = mongoose.model('Favorites', FavoritesSchema)
module.exports = Favorites
