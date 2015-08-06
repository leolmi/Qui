/* Created by Leo on 05/08/2015. */
'use strict';

var chat = require('./chat.model');

exports.register = function(socket) {
  chat.schema.post('save', function (msg) {
    onSave(socket, msg);
  });
};

function onSave(socket, msg, cb) {
  socket.emit('chat:save', msg);
}
