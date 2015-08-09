/* Created by Leo on 04/08/2015. */
'use strict';

var _ = require('lodash');
var Group = require('./group.model');


function handleError(res, err) {
  return res.send(500, err);
}

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
      //Rimuove tutte le rilevazione del membro in uscita
      Group.find({group:pos.group, member:pos.member})
        .remove(function(){ cb(true); });
      break;
    case 'invite':
      console.log('[INVITE]: '+JSON.stringify(pos.mails));
      //TODO: manda le email di invito

      break;
    //case 'point':
    //  console.log('[POINT]: '+JSON.stringify(pos.point));
    //  //TODO: condivide una posizione nel gruppo
    //
    //  break;
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


// Verifica che il membro non sia già presente nel gruppo
exports.check = function(req, res) {
  var infos = req.body;
  console.log('[CHECK]: '+JSON.stringify(req.body));
  var err = new Error('Unspecified member!');
  if (!infos || !infos.group || !infos.member)
    return handleError(res, err);
  Group.find({group:infos.group, member:infos.member}, function(err, items) {
    if (err) return handleError(res, err);
    err = new Error('The specified member is already in use.');
    if (items && items.length>0) return handleError(res, err);
    return res.json(200);
  });
};
