/* Created by Leo on 09/08/2015. */
'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var PointSchema = new Schema({
  group: String,
  member: String,
  latitude: Number,
  longitude: Number,
  name: String,
  notes: String
});

module.exports = mongoose.model('Point', PointSchema);
