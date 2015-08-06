/**
 * Populate DB with sample data on server start
 * to disable, edit config/environment/index.js, and set `seedDB: false`
 */

'use strict';

var User = require('../api/user/user.model');
var Chat = require('../api/chat/chat.model');
var Group = require('../api/group/group.model');

User.find({}).remove(function() {
  User.create({
    provider: 'local',
    group: 'Test',
    password: 'test'
  }, {
    provider: 'local',
    role: 'admin',
    group: 'Admin',
    password: 'admin'
  }, function () {
    console.log('finished populating users');
  });
});

Chat.find({}).remove(function() {
  console.log('finished clearing chat');
});

Group.find({}).remove(function() {
  console.log('finished clearing groups');
});
