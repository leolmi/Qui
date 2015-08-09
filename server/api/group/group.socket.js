/* Created by Leo on 04/08/2015. */
'use strict';

var group = require('./group.model');

exports.register = function(socket) {
  group.schema.post('save', function (item) {
    onSave(socket, item);
  });
  group.schema.post('remove', function (item) {
    onRemove(socket, item);
  });
};

function onSave(socket, item, cb) {
  socket.emit('group:save', item);
}
function onRemove(socket, item, cb) {
  socket.emit('group:remove', item);
}
