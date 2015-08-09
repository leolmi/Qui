/* Created by Leo on 09/08/2015. */
'use strict';

var _ = require('lodash');
var Point = require('./point.model');


function handleError(res, err) {
  return res.send(500, err);
}

// Get list of group activity
exports.index = function(req, res) {
  var filter = {
    group: req.user._id
  };
  Point.find(filter, function (err, group) {
    if (err)
      return handleError(res, err);
    return res.json(200, group);
  });
};
