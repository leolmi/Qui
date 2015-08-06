/**
 * Created by Leo on 27/03/2015.
 */
'use strict';

angular.module('quiApp')
  .directive('background', ['$rootScope', function ($rootScope) {
    return {
      restrict: 'E',
      link: function (scope, elm, atr) {
      }
    }
  }]);
