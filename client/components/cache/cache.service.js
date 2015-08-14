/* Created by Leo on 05/08/2015. */
'use strict';

angular.module('quiApp')
  .filter('groupBy', [function() {
    return function (list, field, type) {
      var filtered = [];
      type = type || 'member';
      list.forEach(function (item) {
        if (item.type==type) {
          var ex = _.find(filtered, function (o) {
            return o.k == item[field];
          });
          if (ex)
            ex.v.push(item);
          else
            filtered.push({k: item[field], v: [item]});
        }
      });
      return filtered;
    };
  }])
  .factory('cache', ['$rootScope','$http','socket','util','$timeout','groupByFilter','Logger',function($rootScope,$http,socket,u,$timeout,groupBy,Logger) {
    var TYPE_MEMEBER = 'member';
    var TYPE_POINT = 'point';
    var _product = {
      name:'?',
      version: '?'
    };
    var _data = {
      ismodal: false
    };
    function EmptyPos() {
      return {
        latitude: null,
        longitude: null,
        accuracy: null,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
        timestamp: null
      };
    }
    function Infos() {
      var infos = {
        errors:[],
        user:{},
        group:{},
        items:[],
        messages:[],
        current:[],
        members:[],
        points:[],
        welcomed:false,
        pos:EmptyPos(),
        locationOptions:{
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 75000
        }
      };
      return infos;
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

    /**
     * Resetta la cache
     */
    function reset() {
      _active = false;
      _infos = Infos();
      localStorage.clear();
      socket.unsyncUpdates('group');
      socket.unsyncUpdates('chat');
    }

    /**
     * Legge i messaggi della chat dal server
     * @param [cb]
     */
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

    /**
     * Legge le posizioni rilevate nel gruppo
     * @param [cb]
     */
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

    /**
     * Salva i dati utente sullo store locale
     */
    function saveLocal() {
      var linfo = {
        group: _infos.group,
        nick: _infos.user.nick,
        welcomed: _infos.welcomed
      };
      var content = JSON.stringify(linfo);
      localStorage.setItem("QUI-STORE", content);
    }

    /**
     * Carica i dati utente dallo store locale
     */
    function loadLocal() {
      var content = localStorage.getItem("QUI-STORE");
      if (!content || content.length <= 0) return;
      try {
        var linfo = JSON.parse(content);
        if (linfo && linfo.group)
          init(linfo.group, linfo.nick, null, linfo.welcomed);
      }
      catch (err) {
        localStorage.clear();
      }
    }

    /**
     * Questa funzione permette di interpretare il risultato della geolocalizzazione
     * e, al termine, eseguire una callback.
     * @param cb
     * @returns {Function}
     */
    function hresp(cb) {
      cb = cb || angular.noop;
      return function(resp) {
        if (resp.code){
          herror(resp);
          cb();
        }
        else {
          hposition(resp, cb);
        }
      }
    }

    function loadAppInfo(cb) {
      cb = cb || angular.noop;
      $http.get('/api/info')
        .success(function(infos){
          _product.name = infos.product.name;
          _product.version = infos.product.version;
          cb(_product);
        });
    }

    /**
     * Inizializza la cache
     * @param g
     * @param nick
     * @param [cb]
     * @param [welcomed]
     */
    function init(g, nick, cb, welcomed) {
      cb = cb || angular.noop;
      _active = true;
      _infos.pos = EmptyPos();
      _infos.group = g;
      _infos.welcomed = welcomed==true ? true : false;
      _infos.user = {
        nick: nick
      };
      loadAppInfo();
      saveLocal();
      readMessages();
      var h = hresp(function() {
        readGroup(cb);
      });
      readPosition(h);
    }

    /**
     * Valida l'oggetto assegnandogli il gruppo ed il membro
     * @param o
     * @param type
     * @returns {boolean}
     */
    function check(o, type) {
      if (!o) return false;
      type = type || TYPE_MEMEBER;
      o.group = _infos.group._id;
      o.member = _infos.user.nick;
      if(!o.type) o.type = type;
      return true;
    }

    /**
     * Invia i dati posizionali
     * @param pos
     * @param [cb]
     * @returns {*}
     */
    function pushPos(pos, cb){
      cb = cb || angular.noop;
      if (!check(pos)) return cb();
      $http.post('/api/group', pos)
        .success(function(item){ cb(null, item) })
        .error(function(err){ cb(err); });
    }

    /**
     * Condivide una posizione
     * @param pos
     * @param desc
     * @param cb
     * @returns {*}
     */
    function sharePos(pos, cb) {
      cb = cb || angular.noop;
      if (!check(pos, TYPE_POINT)) return cb();
      pushPos(pos, function () {
        cb();
        readPositionTimeout();
      });
    }

    /**
     * Invia il messagio della chat
     * @param txt
     * @param [cb]
     * @returns {*}
     */
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

    /**
     * Aggiunge la voce di geolocalizzazione se ha un valore
     * @param arr
     * @param title
     * @param value
     * @param post
     */
    function addInfo(arr, title, value, post) {
      if (value != undefined)
        arr.push({title: title, value: value, post: post});
    }
    /**
     * restituisce un array con le info di geolocalizzazione valorizzate
     * @param pos
     * @param [format]
     * @returns {Array}
     */
    function getInfos(pos, format) {
      var infos = [];
      addInfo(infos, 'Latitudine', pos.latitude, '\'');
      addInfo(infos, 'Longitudine', pos.longitude, '\'');
      addInfo(infos, 'Accuratezza', pos.accuracy, 'm');
      addInfo(infos, 'Altezza', pos.altitude, 'm');
      addInfo(infos, 'Precisione Altezza', pos.altitudeAccuracy, 'm');
      addInfo(infos, 'Declinazione', pos.heading, '°');
      addInfo(infos, 'Velocità', pos.speed, 'm/s');
      addInfo(infos, 'Rilevazione', u.getDate(pos.timestamp, format), '');
      return infos;
    }

    /**
     * Restituisce un oggetto con i valori di geolocalizzazione
     * @param xpos
     * @returns {{latitude: Number, longitude: Number, accuracy: Number, altitude: Number, altitudeAccuracy: Number, heading: Number, speed: Number, timestamp: (null|*|Document.timestamp|Number)}}
     * @constructor
     */
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


    /**
     * Legge i valori delle proprietà corrispondenti
     * @param t
     * @param s
     */
    function keepValues(t, s) {
      _.keys(t).forEach(function(pn){
        if (_.has(s, pn))
          t[pn] = s[pn];
      });
    }

    /**
     * Restituisce vero se corrisponde alla posizione attuale
     * @param pos
     * @returns {boolean}
     */
    function isTheSame(pos) {
      return (
        pos.latitude==_infos.pos.latitude &&
        pos.longitude==_infos.pos.longitude &&
        pos.altitude==_infos.pos.altitude);
    }

    /**
     * Gestisce i dati posizionali
     * @param xpos
     * @param [cb]
     */
    function hposition(xpos, cb){
      cb = cb || angular.noop;
      var pos = Pos(xpos);
      if (!isTheSame(pos)) {
        pushPos(pos, function() {
          cb();
          readPositionTimeout();
        });
        keepValues(_infos.pos, pos);
      }
      else {
        cb();
        readPositionTimeout();
      }
    }

    /**
     * Gestisce l'errore nella rilevazione dei dati posizionali
     * @param err
     * @param noread
     */
    function herror(err, noread){
      _infos.errors.push(err.message);
      if (!noread)
        readPositionTimeout();
    }

    /**
     * Legge i dati posizionali dopo 1 sec.
     */
    function readPositionTimeout() {
      if (_active)
        $timeout( function(){ readPosition(hposition, herror); }, 1000, false);
    }

    /**
     * Effettua la richiesta di geolocalizzazione
     * @param hpos
     * @param [herr]
     */
    function readPosition(hpos, herr) {
      if (!_active) return;
      herr = herr || hpos;
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(hpos, herr, _infos.locationOptions);
      }
      else {
        _infos.errors.push("Geolocation is not supported by this browser.");
      }
    }

    /**
     * Aggiorna l'elenco dei membri del gruppo
     * @returns {*}
     */
    function refreshItems() {
      _infos.members = groupBy(_infos.items, 'member', TYPE_MEMEBER);
      _infos.points = _.filter(_infos.items, function(i) { return i.type==TYPE_POINT; });
      return _infos.members;
    }

    /**
     * Verifica la possibilità di ottenere i dati posizionali
     * @param [cb]
     * @returns {*}
     */
    function testGeo(cb) {
      cb = cb || angular.noop;
      if (!navigator.geolocation)
        return cb({code:'UNSUPPORTED', message:'Geolocation is not supported by this browser."'});
      navigator.geolocation.getCurrentPosition(cb, cb);
    }

    /**
     * Invia un invito a tutte le mail presenti nel testo passato
     * da parte del membro u
     * @param str
     * @param u
     */
    function invite(str, u) {
      if (!str) return;
      var mails = [];
      var rgx = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,6}/gi;
      var m;
      while ((m = rgx.exec(str)) !== null) {
        if (m.index === rgx.lastIndex) {
          rgx.lastIndex++;
        }
        if (m[0]) mails.push(m[0]);
      }
      if (mails.length <= 0) return;
      pushPos({
        action: 'invite',
        mails: mails,
        groupname: u.group,
        password: u.password,
        sender: u.nick
      });
    }

    function calcway(s,e,mode) {
      Logger.warning('[DA FARE]', 'Calcola il percorso da [' +
        s.latitude + ',' + s.longitude + '] a [' + e.latitude + ',' + e.longitude +
        '] in modalità:' + mode);
    }
    //$scope.calculating = true;
    //var origin = new google.maps.LatLng(55.930385, -3.118425);
    //var destination = new google.maps.LatLng(50.087692, 14.421150);
    //
    //var service = new google.maps.DistanceMatrixService();
    //service.getDistanceMatrix(
    //  {
    //    origins: [origin],
    //    destinations: [destination],
    //    travelMode: google.maps.TravelMode.WALKING,
    //    //transitOptions: TransitOptions,
    //    unitSystem: google.maps.UnitSystem.METRIC,
    //    //durationInTraffic: Boolean,
    //    //avoidHighways: Boolean,
    //    //avoidTolls: Boolean,
    //  }, function(resp, status){
    //    if (status == google.maps.DistanceMatrixStatus.OK) {
    //      resp.originAddresses
    //
    //      $scope.distance =
    //    }
    //    $scope.calculating = false;
    //  });

    function getMarkerPointCoordStr(p, prec) {
      if (prec) return (p.latitude.toFixed(prec) || p.G.toFixed(prec))+','+(p.longitude.toFixed(prec) || p.K.toFixed(prec));
      return (p.latitude || p.G)+','+(p.longitude || p.K);
    }
    function getMarkerPointDesc(p, prec) {
      return p.description ? p.description : getMarkerPointCoordStr(p, prec);
    }
    function isSamePos(p1, p2){
      return getMarkerPointCoordStr(p1) == getMarkerPointCoordStr(p2);
    }


    loadLocal();

    return {
      util:{
        getMarkerPointCoordStr:getMarkerPointCoordStr,
        getMarkerPointDesc:getMarkerPointDesc,
        isSamePos:isSamePos
      },
      TYPE_MEMEBER:TYPE_MEMEBER,
      TYPE_POINT:TYPE_POINT,
      loadAppInfo:loadAppInfo,
      update: saveLocal,
      testGeo: testGeo,
      data: _data,
      product: _product,
      infos: function () {
        return _infos;
      },
      reset: reset,
      init: init,
      invite: invite,
      getInfos: getInfos,
      pushMsg: pushMsg,
      sharePos:sharePos,
      leaveGroup: leaveGroup,
      refreshMembers: refreshItems,
      calcway:calcway
    };
  }]);
