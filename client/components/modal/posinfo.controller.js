/* Created by Leo on 06/08/2015. */
'use strict';

angular.module('quiApp')
  .controller('PosInfoCtrl', ['$scope','cache','Logger', function ($scope, cache, Logger) {
    var infos = cache.infos();
    var p1 = new google.maps.LatLng(infos.pos.latitude, infos.pos.longitude);
    var p2 = new google.maps.LatLng($scope.modal.context.pos.latitude, $scope.modal.context.pos.longitude);
    $scope.distance = google.maps.geometry.spherical.computeDistanceBetween(p1,p2);
    //$scope.from = undefined;
    //$scope.to = undefined;
    $scope.isme = ($scope.distance==0);

    $scope.mode = 'car';
    $scope.togglemode = function() {
      switch ($scope.mode) {
        case 'car': $scope.mode='walk'; break;
        default: $scope.mode='car'; break;
      }
    };

    $scope.data = {
      items: [],
      from: undefined,
      to: undefined
    };

    function checkSelection(item) {
      if (cache.util.isSamePos(item, $scope.modal.context.pos))
        $scope.data.to = item;
      if (cache.util.isSamePos(item, infos.pos))
        $scope.data.from = item;
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
      $scope.data.items.push(getItem(m));
    });
    infos.points.forEach(function(p){
      $scope.data.items.push(getItem(p));
    });


    $scope.calc = function() {
      if (!$scope.data.from || !$scope.data.to) return;
      cache.calcway($scope.data.from,$scope.data.to,$scope.mode);
    };
  }]);
