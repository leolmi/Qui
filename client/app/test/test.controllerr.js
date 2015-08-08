/* Created by Leo on 08/08/2015. */
'use strict';

angular.module('quiApp')
  .controller('TestCtrl', ['$scope', function ($scope) {
    $scope.items=[ 'Ciccio', 'Ugo', 'Franca', 'Rolando' ];

    var _index = 0;

    $scope.add = function() {
      _index++;
      $scope.items.push('Item'+_index);
    };

    $scope.reset = function() {
      $scope.items = [];
    };

    $scope.buttons = [{
      icon:'fa-plus-circle',
      action:$scope.add
    },{
      icon:'fa-eraser',
      action:$scope.reset
    }];
  }]);
