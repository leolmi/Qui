'use strict';


angular.module('quiApp')
  .factory('initializer', function($window, $q){

    //Google's url for async maps initialization accepting callback function
    var asyncUrl = 'https://maps.googleapis.com/maps/api/js?callback=',
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
  .filter('groupBy', [function() {
    return function (list, field) {
      var filtered = [];
      list.forEach(function (item) {
        var ex = _.find(filtered, function (o) {
          return o.k == item[field];
        });
        if (ex)
          ex.v.push(item);
        else
          filtered.push({k: item[field], v: [item]});
      });
      return filtered;
    };
  }])
  .controller('MainCtrl', ['$scope','$location','$rootScope','$window','Auth','$http','socket','initializer','$timeout','cache','util','groupByFilter','Logger', function ($scope,$location,$rootScope,$window,Auth,$http,socket,initializer,$timeout,cache,u,groupBy,Logger) {
    var _markers = [];
    $scope.loading = true;
    $scope.page = 'user';
    $scope.cache = cache.infos();
    $scope.getDate = u.getDate;
    var _firstcenter = false;

    initializer.mapsInitialized.then(function() {
      var options = {
        zoom: 14,
        center: new google.maps.LatLng(43.7681469,11.2527254),
        mapTypeId: google.maps.MapTypeId.ROADMAP
      };

      $scope.map = new google.maps.Map(document.getElementById('map-canvas'), options);

      $scope.loading = false;
    }, function(err){
      $scope.error = err ? err.message : 'Errori nel caricamento della mappa!';
    });

    function clearMarkers() {
      var old = [];
      u.for(_markers, function(m){
        old.push(m.title);
        m.setMap(null);
      });
      _markers = [];
      return old;
    }

    function amI(member){ return (member==$scope.cache.user.nick); }

    function refreshMarkers() {
      try {
        var old = clearMarkers();
        var cur = [];
        var members = groupBy($scope.cache.items, 'member');
        members.forEach(function (g) {
          var pos = g.v.last();
          var member = g.k;
          var latLng = new google.maps.LatLng(pos.latitude, pos.longitude);
          _markers.push(new google.maps.Marker({
            map: $scope.map,
            label: member[0],
            position: latLng,
            title: member
          }));
          cur.push(member);
          if (amI(member))
            $scope.mypos = cache.getInfos(pos);
        });

        var mbm = _.difference(cur, old);
        // la presenza dell'utente corrente
        var index = mbm.indexOf($scope.cache.user.nick);
        if (index>=0){
          if (!_firstcenter)
            $scope.center();
          mbm.splice(index,1);
          _firstcenter = true;
        }
        //mbm = _.difference(mbm, [$scope.cache.user.nick]);
        if (mbm.length>0)
          Logger.info('Si sono aggiunti nuovi membri!', mbm.join());
        mbm = _.difference(old, cur);
        if (mbm.length>0)
          Logger.info('Alcuni membri sono usciti dal gruppo!', mbm.join());

        $scope.members = members;
      }
      catch(err) { }
    }

    $scope.$watch(
      function() { return JSON.stringify($scope.cache.items); },
      function() { refreshMarkers() }
    );

    $scope.$watch(
      function() { return JSON.stringify($scope.cache.messages); },
      function() { $rootScope.$broadcast('SCROLLER-DOWN',{id:'scroller-msg'}); }
    );

    $scope.logout = function() {
      cache.leaveGroup(function() {
        Auth.logout();
        $location.path('/login');
      });
    };

    $scope.center = function(m) {
      if (!$scope.map) return;
      //u = u || $scope.user;
      var member = m ? m.k : $scope.cache.user.nick;
      var location = m ? m.v.last() : $scope.cache.pos;

      if (amI(member) && !_firstcenter)
        _firstcenter = true;

      // il centro è considerato più in alto per
      // lasciare lo spazio al monitor
      var bounds = $scope.map.getBounds();
      var dl = bounds.getNorthEast().lat() - bounds.getSouthWest().lat();
      var H = angular.element($window).height();
      var ddl = (200 * dl)/(2*H);

      // Calcola le coordinate del centro
      var latLng = new google.maps.LatLng(location.latitude-ddl, location.longitude);

      // Imposta il centro della mappa
      $scope.map.setCenter(latLng);
      // Ricerca il marker corrispondente
      var ex = _.find(_markers, function(mrk){ return mrk.title==member});
      if (!ex) return;
      // Se ha trovato il marker lo anima
      ex.setAnimation(google.maps.Animation.BOUNCE);
      $timeout(function() { ex.setAnimation(null); }, 1000);
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

    $scope.invite = function() {
      Logger.info('TODO','invita gli amici nel gruppo...');
    };

    $scope.details = function(m) {
      Logger.monitor('Dettagli','...');
      $timeout(function() {
        Logger.monitor('Dettagli ' + m.k, JSON.stringify(cache.getInfos(m.v.last())));
      }, 500);
    };

    refreshMarkers();
  }]);
