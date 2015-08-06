///* global $ */
///* global angular */
///**
// * Created by Leo on 18/06/2015.
// */
//'use strict';
//
//angular.module('quiApp')
//  .controller('ModalEditCtrl', ['$scope','$timeout','Util','Cache', function ($scope,$timeout,Util,Cache) {
//		$scope.modal.item.real_date = Util.toDate($scope.modal.item.date);
//		$scope.dateOptions = {
//      formatYear: 'yy',
//      startingDay: 1
//    };
//    //$scope.modal.buttons.push({
//    //  classes: 'btn-primary onleft',
//    //  text: 'Handle',
//    //  click: function() {
//    //  }
//    //})
//
//    $scope.cache = Cache.data;
//
//		$scope.open = function($event) {
//      $event.preventDefault();
//      $event.stopPropagation();
//      $scope.opened = true;
//    };
//
//    $scope.toggleType = function() {
//      $scope.modal.item.type = $scope.modal.item.type=='in' ? 'out' : 'in';
//    };
//
//    $scope.syncdate = function() {
//      var d = new Date($("#timepicker-edit").val());
//      $scope.modal.item.date = Util.toDays(d);
//    };
//
//    $scope.toggleAuto = function() {
//      $scope.modal.item.automatic = !$scope.modal.item.automatic;
//    };
//
//    $scope.deleteState = function(index) {
//      $scope.modal.item.state.splice(index, 1);
//    };
//
//    $scope.getDateStr = function(n) {
//      return Util.toDateStr(n);
//    };
//
//    function refreshData() {
//      Util.injectData($scope.modal.item);
//    }
//
//    refreshData();
//	}]);
