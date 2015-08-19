/* Created by Leo on 19/08/2015. */
'use strict';

angular.module('quiApp')
  .directive('ngSecondClick', ['$timeout',function ($timeout) {
    return {
      restrict: 'A',
      link: function (scope, elm, atr) {
        var escope =  angular.element(elm[0]).scope();
        var _waiting = false;
        var DELAY = atr.ngSecondClickDelay || 1000;

        function handle(e){
          if (!atr.ngSecondClick) return;
          if (_waiting){
            _waiting = false;
            e.preventDefault();
            e.stopPropagation();
            escope[atr.ngSecondClick]();
          }
          else {
            start();
          }
        }

        function start() {
          _waiting = true;
          $timeout(function () {
            _waiting = false;
          }, DELAY);
        }

        elm.bind('click', handle);

        scope.$on("$destroy", function () {
          elm.unbind('click', handle);
        });
      }
    }
  }]);
