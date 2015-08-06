/* Created by Leo on 05/08/2015. */
'use strict';

angular.module('quiApp')
  .factory('cache', ['$http','socket','util','$timeout',function($http,socket,u,$timeout) {
    function Infos() {
      return {
        errors:[],
        user:{},
        group:{},
        items:[],
        messages:[],
        current:[],
        pos:{
          latitude: null,
          longitude: null,
          accuracy: null,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
          timestamp: null
        },
        locationOptions:{
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 75000
        }
      };
    }
    var _infos = Infos();
    var _active = false;

    /**
     * Se l'utente esiste viene notificata la sua dipartita dal gruppo
     */
    function leaveGroup(cb) {
      cb = cb || angular.noop;
      if (_infos.user.nick){
        pushPos({ action: 'exit' }, function() {
          cb()
        });
      } else cb();
    }

    function reset() {
      _active = false;
      _infos = Infos();
      localStorage.clear();
      socket.unsyncUpdates('group');
      socket.unsyncUpdates('chat');
    }

    function readMessages(cb) {
      cb = cb || angular.noop;
      $http.get('/api/chat')
        .success(function(msgs) {
          _infos.messages = msgs;
          socket.syncUpdates('chat', _infos.messages);
          cb()
        })
        .error(function(err){
          cb(err);
        });
    }
    function readGroup(cb) {
      cb = cb || angular.noop;
      $http.get('/api/group')
        .success(function(items) {
          _infos.items = items;
          socket.syncUpdates('group', _infos.items);
          cb();
        })
        .error(function(err){
          cb(err);
        });
    }


    function saveLocal() {
      var linfo = {
        group: _infos.group,
        nick: _infos.user.nick
      };
      var content = JSON.stringify(linfo);
      localStorage.setItem("QUI-STORE", content);
    }

    function loadLocal() {
      var content = localStorage.getItem("QUI-STORE");
      if (!content || content.length <= 0) return;
      try {
        var linfo = JSON.parse(content);
        if (linfo && linfo.group)
          init(linfo.group, linfo.nick);
      }
      catch (err) {
        localStorage.clear();
      }
    }

    function init(g, nick, cb) {
      cb = cb || angular.noop;
      _active = true;
      _infos.group = g;
      _infos.user = {
        nick: nick
      };
      saveLocal();
      readMessages();
      readGroup(function() {
        readPosition();
        cb();
      });

    }

    function check(o) {
      if (!o) return false;
      o.group = _infos.group._id;
      o.member = _infos.user.nick;
      return true;
    }


    function pushPos(pos, cb){
      cb = cb || angular.noop;
      if (!check(pos)) return cb();
      $http.post('/api/group', pos)
        .success(function(item){ cb(null, item) })
        .error(function(err){ cb(err); });
    }

    function pushMsg(txt, cb){
      cb = cb || angular.noop;
      if (!txt) return;
      var msg ={
        text: txt,
        timestamp: (new Date()).getTime()
      };
      if (!check(msg)) return cb();
      $http.post('/api/chat', msg)
        .success(function(msg){ cb(null, msg) })
        .error(function(err){ cb(err); });
    }

    function addInfo(arr, title, value, post) {
      if (value != undefined)
        arr.push({title: title, value: value, post: post});
    }

    function keepValues(t, s) {
      _.keys(t).forEach(function(pn){
        if (_.has(s, pn))
          t[pn] = s[pn];
      });
    }

    function getInfos(pos) {
      var infos = [];
      addInfo(infos, 'Latitudine', pos.latitude, '\'');
      addInfo(infos, 'Longitudine', pos.longitude, '\'');
      addInfo(infos, 'Scarto', pos.accuracy, 'm');
      addInfo(infos, 'Altezza', pos.altitude, 'm');
      addInfo(infos, 'Precisione Altezza', pos.altitudeAccuracy, 'm');
      addInfo(infos, 'Declinazione', pos.heading, '°');
      addInfo(infos, 'Velocità', pos.speed, 'm/s');
      addInfo(infos, 'Data', u.getDate(pos.timestamp), '');
      return infos;
    }

    function Pos(xpos) {
      return {
        latitude: xpos.coords.latitude,
        longitude: xpos.coords.longitude,
        accuracy: xpos.coords.accuracy,
        altitude: xpos.coords.altitude,
        altitudeAccuracy: xpos.coords.altitudeAccuracy,
        heading: xpos.coords.heading,
        speed: xpos.coords.speed,
        timestamp: xpos.timestamp
      }
    }



    function isTheSame(pos) {
      return (
        pos.latitude==_infos.pos.latitude &&
        pos.longitude==_infos.pos.longitude &&
        pos.altitude==_infos.pos.altitude);
    }
    function hposition(xpos){
      var pos = Pos(xpos);
      if (!isTheSame(pos)) {
        pushPos(pos, function() { readPositionTimeout(); });
        keepValues(_infos.pos, pos);
      }
      else readPositionTimeout();
    }

    function herror(err, noread){
      var msg = err && err.message ? err.message : 'An unknown error occurred.';
      if (err.code) {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            _infos.errors.push("User denied the request for Geolocation.");
            break;
          case err.POSITION_UNAVAILABLE:
            _infos.errors.push("Location information is unavailable.");
            break;
          case err.TIMEOUT:
            _infos.errors.push("The request to get user location timed out.");
            break;
          case err.UNKNOWN_ERROR:
            _infos.errors.push("An unknown error occurred.");
            break;
          default :
            _infos.errors.push(msg);
            break;
        }
      }
      else {
        _infos.errors.push(msg);
      }
      if (!noread)
        readPositionTimeout();
    }

    function readPositionTimeout() {
      if (_active)
        $timeout( function(){ readPosition(); }, 1000, false);
    }

    function readPosition() {
      if (!_active) return;
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(hposition, herror, _infos.locationOptions);
      }
      else {
        _infos.errors.push("Geolocation is not supported by this browser.");
      }
    }

    loadLocal();

    return {
      infos: function() { return _infos; },
      reset:reset,
      init:init,
      getInfos:getInfos,
      pushPos:pushPos,
      pushMsg:pushMsg,
      leaveGroup:leaveGroup
    };
  }]);
