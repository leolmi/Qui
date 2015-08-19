'use strict';


angular.module('quiApp')
  .factory('initializer', function($window, $q){

    //Google's url for async maps initialization accepting callback function
    var asyncUrl = 'https://maps.googleapis.com/maps/api/js?libraries=geometry,places&callback=',
      mapsDefer = $q.defer();

    //Callback function - resolving promise after maps successfully loaded
    $window.googleMapsInitialized = mapsDefer.resolve;

    //Async loader
    var asyncLoad = function(asyncUrl, callbackName) {
      var script = document.createElement('script');
      script.src = asyncUrl + callbackName;
      document.body.appendChild(script);
    };
    //Start loading google maps
    asyncLoad(asyncUrl, 'googleMapsInitialized');

    //Usage: initializer.mapsInitialized.then(callback)
    return {
      mapsInitialized : mapsDefer.promise
    };
  })
  .controller('MainCtrl', ['$scope','$location','$rootScope','$window','maps','Auth','$http','socket','initializer','$timeout','cache','util','Logger','Modal', function ($scope,$location,$rootScope,$window,maps,Auth,$http,socket,initializer,$timeout,cache,u,Logger,Modal) {
    var _markers_member = [];
    var _markers_point = [];
    $scope.loading = true;
    $scope.page = 'user';
    $scope.getDate = u.getDate;
    $scope.share = false;
    $scope.centerlocked = false;
    var _firstcenter = false;
    //var _infowindow = null;
    var _stopwatchitems = undefined;
    var _stopwatchmsg = undefined;

    $scope.cache = function() { return cache.infos() };

    function initWatchers() {
      _stopwatchitems = $scope.$watch(
        function () { return JSON.stringify($scope.cache().items); },
        function () { refreshMarkers(); });

      _stopwatchmsg = $scope.$watch(
        function () { return JSON.stringify($scope.cache().messages); },
        function () { $rootScope.$broadcast('SCROLLER-DOWN', {id: 'scroller-msg'}); });

      refreshMarkers();
    }

    function resetWatchers() {
      if (_stopwatchitems)
        _stopwatchitems();
      _stopwatchitems = null;
      if (_stopwatchmsg)
        _stopwatchmsg();
      _stopwatchmsg = null;
    }

    initializer.mapsInitialized.then(function() {
      maps.createContext(google, $scope.centerMap, function(ctx) {
        $scope.context = ctx;
        initWatchers();
        $scope.loading = false;
      });
      //_infowindow = new google.maps.InfoWindow({
      //  content: "<strong>yes</strong>"
      //});
    }, function(err){
      $scope.error = err ? err.message : 'Errori nel caricamento della mappa!';
      $scope.loading = false;
      refreshMarkers();
      checkErrors();
    });


    function checkErrors() {
      if ($scope.error)
        Logger.error('Attenzione', $scope.error)
    }

    function clearMarkers(markers, cb) {
      cb = cb || angular.noop;
      var old = [];
      u.for(markers, function(m){
        old.push(m.title);
        m.setMap(null);
      });
      cb();
      return old;
    }

    var modalWelcome = Modal.confirm.popup();
    function welcome() {
      var opt = {
        title: 'Benvenuto nel gruppo '+$scope.cache().group.group+', '+$scope.cache().user.nick ,
        template: Modal.TEMPLATE_WELCOME,
        ok: true,
        show:{
          footer:true
        }
      };
      modalWelcome(opt);
      $scope.cache().welcomed = true;
      cache.update();
    }

    function amI(member){ return (member==$scope.cache().user.nick); }

    function getIcon(name) {
      return {
        url: 'assets/images/' + name + '.png',
        size: new google.maps.Size(32, 32),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(16, 32)
      }
    }

    /**
     * Aggiorna i markers dei membri
     */
    function refreshMembersMarkers(cb){
      var old = clearMarkers(_markers_member, function() { _markers_member=[]; });
      var cur = [];
      var members = cache.refreshMembers();
      members.forEach(function (g) {
        var pos = g.v.last();
        var member = g.k;
        var latLng = new google.maps.LatLng(pos.latitude, pos.longitude);
        var icon = getIcon('member');
        var m = new google.maps.Marker({
          map: $scope.context.map,
          label: member[0],
          position: latLng,
          title: member,
          icon: icon
        });
        google.maps.event.addListener(m, 'click', function() {
          //_infowindow.open($scope.context.map,m);
          var e = _.find($scope.members, function(mmb) { return cache.util.isSamePos(mmb.k, m.title); });
          if (e) $scope.details(e);
        });
        _markers_member.push(m);
        cur.push(member);
        if (amI(member))
          $scope.mypos = cache.getInfos(pos, 'time');
      });
      cb(members, old, cur);
    }

    /**
     * Aggiorna i markers dei punti condivisi
     */
    function refreshPointsMarkers(cb){
      var old = clearMarkers(_markers_point, function() { _markers_point=[]; });
      var cur = [];
      var points = cache.infos().points;
      points.forEach(function(p, i){
        var desc = cache.util.getMarkerPointDesc(p, 8);
        var latLng = new google.maps.LatLng(p.latitude, p.longitude);
        var icon = getIcon('point');
        var m = new google.maps.Marker({
          map: $scope.context.map,
          label: '' + (i + 1),
          position: latLng,
          title: desc,
          icon: icon
        });
        google.maps.event.addListener(m, 'click', function() {
          //_infowindow.open($scope.context.map,m);
          var e = _.find($scope.points, function(pnt) { return cache.util.isSamePos(pnt, m.position); });
          if (e) $scope.details(e);
        });

        _markers_point.push(m);
        cur.push(desc);
      });
      cb(points, old, cur);
    }

    /**
     * Aggiorna i markers sulla mappa
     */
    function refreshMarkers() {
      try {
        refreshMembersMarkers(function(members, old, cur){
          var mbm = _.difference(cur, old);
          // la presenza dell'utente corrente
          var index = mbm.indexOf($scope.cache().user.nick);
          if (index >= 0) {
            // La prima volta che viene rilevata la presenza del membro
            // oppure se la centratura è bloccata
            // viene centrata la sua posizione
            if (!_firstcenter || $scope.centerlocked)
              $scope.center();
            mbm.splice(index, 1);
            _firstcenter = true;
            //Se il membro corrente non ha mai ricevuto il form di benvenuto, viene mostrato
            if (!$scope.cache().welcomed)
              welcome();
          }
          //Rileva la presenza di nuovi membri
          if (mbm.length > 0)
            Logger.info('Si sono aggiunti nuovi membri!', mbm.join());
          mbm = _.difference(old, cur);
          //Rileva la presenza dei membri fuoriusciti
          if (mbm.length > 0)
            Logger.info('Alcuni membri sono usciti dal gruppo!', mbm.join());

          $scope.members = members;
        });
        refreshPointsMarkers(function(points, old, cur){
          var pnts = _.difference(cur, old);
          //Rileva la presenza di nuovi punti
          if (pnts.length > 0)
            Logger.info('Nuove posizioni condivise!', pnts.join());
          pnts = _.difference(old, cur);
          //Rileva l'eliminazione di punti condivisi
          if (pnts.length > 0)
            Logger.info('Alcune posizioni sono state eliminate!', pnts.join());

          $scope.points = points;
        });
      }
      catch (err) {
      }
    }

    $scope.logout = function() {
      resetWatchers();
      cache.leaveGroup(function() {
        Auth.logout();
        $location.path('/login');
      });
    };

    $scope.$on('$destroy',function() {
      resetWatchers();
    });

    /**
     * Centra la mappa
     * @param pos
     * @param [finder]
     */
    $scope.centerMap = function(pos, finder){
      // il centro è considerato più in alto per
      // lasciare lo spazio al monitor
      var bounds = $scope.context.map.getBounds();
      if (!bounds) return;
      var dl = bounds.getNorthEast().lat() - bounds.getSouthWest().lat();
      var H = angular.element($window).height();
      var ddl = (200 * dl)/(2*H);

      // Calcola le coordinate del centro
      var latLng = new google.maps.LatLng((pos.latitude || pos.G)-ddl, (pos.longitude || pos.K));

      // Imposta il centro della mappa
      $scope.context.map.setCenter(latLng);

      var mrk = finder ? finder() : null;
      if (mrk) {
        // Se ha trovato il marker lo anima
        mrk.setAnimation(google.maps.Animation.BOUNCE);
        $timeout(function() { mrk.setAnimation(null); }, 1000);
      }
    };

    $scope.center = function(m) {
      if (!$scope.context.map) return;
      var member = m ? m.k : $scope.cache().user.nick;
      var location = m ? m.v.last() : $scope.cache().pos;

      if (amI(member) && !_firstcenter)
        _firstcenter = true;

      $scope.centerMap(location, function() { return _.find(_markers_member, function(mrk){ return mrk.title==member}); });
    };

    $scope.centerPoint = function(p) {
      if (!$scope.context.map || !p) return;

      $scope.centerMap(p, function() { return _.find(_markers_point, function(pnt){ return cache.util.isSamePos(pnt.position,p); }); });
    };

    $scope.swipe = function() {
      switch ($scope.page) {
        case 'user': $scope.page = 'chat'; break;
        case 'chat': $scope.page = 'group'; break;
        case 'group':
        default: $scope.page = 'user'; break;
      }
    };

    $scope.hkey = function(e){
      switch (e.keyCode) {
        case 13:
          e.preventDefault();
          cache.pushMsg($scope.message, function() {
            $scope.message = null;
          });
          break;
      }
    };

    var modalInvite = Modal.confirm.popup(function(opt){
      //Logger.info('TODO','invita gli amici nel gruppo: '+JSON.stringify(opt));
      //cache.invite(opt.mails, cache.user);
      //TODO: invita altri membri nel gruppo
    });
    $scope.invite = function() {
      var info = cache.infos();
      var opt = {
        title: 'Invita altre persone nel gruppo indicandone la mail',
        template: Modal.TEMPLATE_INVITE,
        ok:true,
        cancel:true,
        fixedmessage:'Ciao, '+info.user.nick+' ti invita ad entrare nel gruppo "'+info.group.group+'":'+
        'vai sul sito '+cache.product.name.toLowerCase()+'.herokuapp.com ed inserisci il nome del gruppo con password "'+info.group.password+'",'+
        ' assegnati un nick per farti riconoscere ed accedi all\'area riservata.',
        message:'',
        emails:''
      };
      modalInvite(opt);
    };

    $scope.sharepos = function() {
      $scope.share = !$scope.share;
    };
    var modalPoints = Modal.confirm.popup(function(opt) {
      cache.sharePos(opt.pos);
      $scope.share = false;
    });
    $scope.sharethis = function() {
      var bounds = $scope.context.map.getBounds();
      var latNE = bounds.getNorthEast().lat();
      var lngNE = bounds.getNorthEast().lng();
      var latSW = bounds.getSouthWest().lat();
      var lngSW = bounds.getSouthWest().lng();
      var opt = {
        title:'Condividi la posizione',
        template: Modal.TEMPLATE_POINT,
        ok:true,
        cancel:true,
        pos:{
          latitude: latNE + ((latSW - latNE)/2),
          longitude: lngSW + ((lngNE - lngSW)/2),
          timestamp: (new Date()).getTime()
        }
      };
      modalPoints(opt);
    };

    function getWayPoints(items){
      var pnts = [];
      items.forEach(function(p){
        if (p.selected)
          pnts.push({
            location: maps.getLatLng(google, p),
            stopover: false
          });
      });
      return pnts;
    }

    var modalDetails = Modal.confirm.popup(function(opt) {
      if (opt.calc && opt.route.origin && opt.route.destination){
        $scope.loading = true;
        var pnts = getWayPoints(opt.route.items);
        var route = maps.routeInfo($scope.context, opt.route.origin, opt.route.destination, pnts, opt.route.mode);
        maps.calcRoute($scope.context, route, function(err){
          $scope.loading = false;
          if (err)
            Logger.error('Errori', err);
          else
            $scope.showroute();
        });
      }
    });
    $scope.details = function(o) {
      var opt = {
        title: o.k ?
          'Dettagli del membro: '+ o.k + ',  ('+ o.k[0]+') sulla mappa' :
          'Dettagli della posizione condivisa',
        template: Modal.TEMPLATE_POSINFO,
        ok:{text:'Fatto'},
        pos: o.v ? o.v.last() : o,
        member: o.v ? cache.getInfos(o.v.last()) : cache.getInfos(o),
        ctx: $scope.context,
        nick: o.k ? o.k : cache.util.getMarkerPointDesc(o, 8),
        calc: false,
        buttons:[{
          caption:'Calcola Percorso',
          action: function() { opt.calc = true; },
          close: true
        }]
      };
      modalDetails(opt);
    };

    var modalRoute = Modal.confirm.popup();
    $scope.showroute = function() {
      var opt = {
        title: 'Percorso',
        ok:{text:'Fatto'},
        template: Modal.TEMPLATE_INFOLIST,
        infos: maps.getRouteInfos($scope.context),
        buttons:[{
          caption:'Cancella',
          action: function() { maps.clearRoute($scope.context); },
          close: true
        }]
      };
      modalRoute(opt);
    };

    $scope.lockcenter = function() {
      $scope.centerlocked = !$scope.centerlocked;
    };

    $scope.isDebug = function() {
      return cache.isDebug();
    };

    $scope.toggleDebug = function() {
      cache.toggleDebug();
      //$scope.$apply();
    };
  }]);
