/* Created by Leo on 05/08/2015. */
'use strict';

var _ = require('lodash');
var Chat = require('./chat.model');

// Get list of chat message
exports.index = function(req, res) {
  var filter = {
    group: req.user._id
  };
  Chat.find(filter, function (err, msgs) {
    if (err)
      return handleError(res, err);
    return res.json(200, msgs);
  });
};

// Inserts a new message in the DB.
exports.insert = function(req, res) {
  if (req.body._id)
    delete req.body._id;
  Chat.create(req.body, function (err, msg) {
    if (err)
      return handleError(res, err);
    return res.json(201, msg);
  });
};
