const mongoose = require('mongoose');

const demoRequestSchema = new mongoose.Schema({

  fullName: {
    type: String,
    required: true
  },

  phone: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true
  },

  breed: {
    type: String,
    required: true
  },

  quantity: {
    type: Number,
    required: true
  },

  address: {
    type: String,
    required: true
  },

  country: {
    type: String,
    required: true
  },

  state: {
    type: String,
    required: true
  },

  selfieImage: String,
  shopImage: String,

  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model(
  'DemoRequest',
  demoRequestSchema
);