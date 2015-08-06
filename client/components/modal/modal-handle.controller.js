///**
// * Created by Leo on 22/06/2015.
// */
//'use strict';
//
//angular.module('due2App')
//  .controller('ModalHandleCtrl', ['$scope','Util', function ($scope,Util) {
//    $scope.modal.state.real_date = Util.toDate($scope.modal.state.date);
//    $scope.dateOptions = {
//      formatYear: 'yy',
//      startingDay: 1
//    };
//
//    $scope.open = function($event) {
//      $event.preventDefault();
//      $event.stopPropagation();
//      $scope.opened = true;
//    };
//
//    $scope.syncdate = function() {
//      var d = new Date($("#timepicker-handle").val());
//      $scope.modal.state.date = Util.toDays(d);
//    };
//
//  }]);
