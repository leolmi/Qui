/* Created by Leo on 04/08/2015. */
'use strict';

var _ = require('lodash');
var Group = require('./group.model');

// Get list of group activity
exports.index = function(req, res) {
  var filter = {
    group: req.user._id
  };
  Group.find(filter, function (err, group) {
    if (err)
      return handleError(res, err);
    return res.json(200, group);
  });
};

function handle(pos, cb){
  if (!pos.action) return cb(false);
  switch (pos.action.toLowerCase()){
    case 'exit':
      Group.find({group:pos.group, member:pos.member})
        .remove(function(){ cb(true); });
      break;
    default :
      cb(true);
  }
}

// Inserts a new item in the DB or exec actions.
exports.insert = function(req, res) {
  console.log('[INSERT]: '+JSON.stringify(req.body));
  if (req.body._id)
    delete req.body._id;

  handle(req.body, function(handled){
    if (handled) return res.json(200);
    Group.create(req.body, function (err, item) {
      if (err)
        return handleError(res, err);
      console.log('[iserted item]: ' + JSON.stringify(item));
      return res.json(201, item);
    });
  });
};
