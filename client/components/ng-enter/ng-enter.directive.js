/* Created by Leo on 16/08/2015. */
'use strict';

angular.module('quiApp')
  .directive('ngEnter', [function() {
    return {
      restrict: 'A',
      link: function (scope, elm, atr) {
        var escope =  angular.element(elm[0]).scope();
        function handle(e){
            if (e.keyCode==13 && atr.ngEnter)
              escope[atr.ngEnter]();
        }

        elm.bind('keydown', handle);

        scope.$on("$destroy", function () {
          elm.unbind('keydown', handle);
        });
      }
    }
  }]);
