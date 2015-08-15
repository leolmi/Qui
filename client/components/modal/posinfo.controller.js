/* Created by Leo on 06/08/2015. */
'use strict';

angular.module('quiApp')
  .controller('PosInfoCtrl', ['$scope','cache','Logger', function ($scope, cache, Logger) {
    var infos = cache.infos();
    var p1 = new google.maps.LatLng(infos.pos.latitude, infos.pos.longitude);
    var p2 = new google.maps.LatLng($scope.modal.context.pos.latitude, $scope.modal.context.pos.longitude);
    $scope.distance = google.maps.geometry.spherical.computeDistanceBetween(p1,p2);
    $scope.isme = ($scope.distance==0);
    $scope.items = [];

    $scope.modal.context.route = {
      calc: false,
      origin:{},
      destination:{},
      waypts:[],
      mode:'car'
    };

    $scope.mode = 'car';
    $scope.togglemode = function() {
      switch ($scope.modal.context.route.mode) {
        case 'car':
          $scope.modal.context.route.mode = 'walk';
          break;
        default:
          $scope.modal.context.route.mode = 'car';
          break;
      }
    };


    function checkSelection(item) {
      if (cache.util.isSamePos(item, $scope.modal.context.pos))
        $scope.modal.context.route.destination = item;
      if (cache.util.isSamePos(item, infos.pos))
        $scope.modal.context.route.origin = item;
    }

    function getItem(o) {
      var item = o.k ? {
        name: o.k,
        latitude: o.v.last().latitude,
        longitude: o.v.last().longitude
      } : {
        name:cache.util.getMarkerPointDesc(o),
        latitude: o.latitude,
        longitude: o.longitude
      };
      checkSelection(item);
      return item;
    }

    infos.members.forEach(function(m){
      $scope.items.push(getItem(m));
    });
    infos.points.forEach(function(p){
      $scope.items.push(getItem(p));
    });
  }]);
