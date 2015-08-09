/* Created by Leo on 09/08/2015. */
'use strict';

var point = require('./point.model');

exports.register = function(socket) {
  group.schema.post('save', function (pnt) {
    onSave(socket, pnt);
  });
  group.schema.post('remove', function (pnt) {
    onRemove(socket, pnt);
  });
};

function onSave(socket, pnt, cb) {
  socket.emit('point:save', pnt);
}
function onRemove(socket, pnt, cb) {
  socket.emit('point:remove', pnt);
}
