/* Created by Leo on 06/08/2015. */
'use strict';

angular.module('quiApp')
  .controller('MemberInfoCtrl', ['$scope','cache', function ($scope, cache) {
    var infos = cache.infos();
    var p1 = new google.maps.LatLng(infos.pos.latitude, infos.pos.longitude);
    var p2 = new google.maps.LatLng($scope.modal.context.pos.latitude, $scope.modal.context.pos.longitude);
    $scope.distance = google.maps.geometry.spherical.computeDistanceBetween(p1,p2);

    //cache.pos
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
  }]);
