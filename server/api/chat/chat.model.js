/* Created by Leo on 05/08/2015. */
'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var ChatSchema = new Schema({
  group: String,
  member: String,
  text: String,
  timestamp: Number,
  action: String
});

module.exports = mongoose.model('Chat', ChatSchema);
