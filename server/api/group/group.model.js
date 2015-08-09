/* Created by Leo on 04/08/2015. */
'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var GroupSchema = new Schema({
  group: String,
  member: String,
  type: String,
  description: String,
  latitude: Number,
  longitude: Number,
  accuracy: Number,
  altitude: Number,
  altitudeAccuracy: Number,
  heading: Number,
  speed: Number,
  timestamp: Number
});

module.exports = mongoose.model('Group', GroupSchema);
