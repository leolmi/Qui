/* Created by Leo on 05/08/2015. */
'use strict';

angular.module('quiApp')
    .directive('scroller', ['$document','$rootScope', function ($document,$rootScope) {
    return {
      restrict: 'A',
      link: function (scope, elm, atr) {
        var WHEELDELTA = 12;
        var scr = angular.element('<div class="scroller"></div>');
        var target = elm.find('.scroller-target');
        elm.append(scr);
        var startY, initialMouseY;
        var _visible = false;

        target.css('position', 'absolute');
        elm.css('position', 'absolute');

        elm.bind('mousewheel', mousewheel);

        scr.bind('mousedown', function ($event) {
          startY = scr.prop('offsetTop');
          initialMouseY = $event.clientY;
          $document.bind('mousemove', mousemove);
          $document.bind('mouseup', mouseup);
          return false;
        });

        function refreshScrollerSize() {
          var hC = elm.innerHeight();
          var hT = target.height();
          var tT = target.offset().top;
          _visible = hT > hC;
          if (_visible) {
            scr.removeClass('hidden');
            var dtop = hC - tT - hT;
            var top = tT - dtop;
            if (dtop > 0) {
              if (top < 0) top = 0;
              target.css({'top': -top + 'px'});
            }
            tT = target.prop('offsetTop');
            var h = (hC * hC) / hT;
            top = (tT * hC) / hT;
            scr.css({height: h + 'px', top: top + 'px'});
          }
          else {
            scr.addClass('hidden');
            if (tT != 0)
              target.css({'top': '0'});
          }
        }

        scope.$watch(function () {
          return target.height() + '.' + elm.innerHeight() + '.' + target.width();
        }, function () {
          refreshScrollerSize();
        });

        function moveDown() {
          var hC = elm.innerHeight(); //altezza contenitore
          var hT = target.height(); //altezza target (contenuto)
          if (hT > hC) {
            target.css({'top': (hC - hT) + 'px'});
            refreshScrollerSize();
          }
        }

        $rootScope.$on('SCROLLER-DOWN', function (e, data) {
          if (data && data.id==atr.scroller)
            moveDown();
        });

        function mousemove(e) {
          var dy = e.clientY - initialMouseY;
          setpos(startY + dy);
          return false;
        }

        function setpos(top) {
          if (!_visible) return;
          var hC = elm.innerHeight();
          var hS = scr.innerHeight();
          var hT = target.height();
          top = (top < 0) ? 0 : top;
          if (top + hS > hC - 2)
            top = hC - hS - 2;

          scr.css({top: top + 'px'});
          if (target) {
            var ttop = ((top * hT) / hC) + hS;
            target.css({'top': -ttop + 'px'});
          }
        }

        function mousewheel(ev) {
          var e = window.event || ev;
          var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
          var dy = delta * WHEELDELTA;
          dy = scr.prop('offsetTop') - dy;
          setpos(dy);
          return false;
        }

        function mouseup() {
          $document.unbind('mousemove', mousemove);
          $document.unbind('mouseup', mouseup);
        }

        scope.$on("$destroy", function () {
          elm.unbind('mousewheel', mousewheel);
        });

        refreshScrollerSize();
      }
    }
  }]);
