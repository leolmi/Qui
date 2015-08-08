/* Created by Leo on 05/08/2015. */
'use strict';

angular.module('quiApp')
    .directive('scroller', ['$document','$rootScope', function ($document,$rootScope) {
    return {
      restrict: 'A',
      link: function (scope, elm, atr) {
        var WHEELDELTA = 12;
        var s_color = atr.scrollerColor || '#222';
        var s_width = atr.scrollerWidth || '6';
        var scr = angular.element('<div class="scroller" style="background-color: '+s_color+'; width: '+s_width+'px;"></div>');
        var target = elm.find('.scroller-target');
        elm.append(scr);
        var startY, initialMouseY;

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

        /**
         * Calcola la dimensione (height) dello scroller
         * dando per buona la dimensione del contenuto
         * @returns {number}
         */
        function getScrollerHeight() {
          var hC = elm.innerHeight();   //altezza contenitore
          var hT = target.height();     //altezza del contenuto
          //lo scroller è visibile se l'altezza del contenuto è maggiore di quella del contenitore
          //scollerheight:
          //  l'altezza dello scroller rispetto all'altezza disponibile
          //  è proporzionale all'altezza del contenitore rispetto al contenuto
          // >>  hC / hT = hS / hC    >>   hS = hC^2 / hT
          return (hT > hC) ? (hC * hC) / hT : 0;
        }

        /**
         * Calcola la posizione (top) dello scroller
         * dando per buona la posizione del contenuto
         * @returns {number}
         */
        function getScrollerTopByContent() {
          var hC = elm.innerHeight();   //altezza contenitore
          var hT = target.height();     //altezza del contenuto
          var tT = -target[0].offsetTop;  ///offset().top; //top del contenuto
          //lo scroller è visibile se l'altezza del contenuto è maggiore di quella del contenitore
          //scollertop:
          //  la posizione dello scroller rispetto all'altezza disponibile
          //  è proporzionale alla posizione del contenuto rispetto al contenitore
          // >>  tT / hT = sT / hC   >>   sT = (hC + tT) / hT
          return (hT > hC) ? (hC * tT) / hT : 0;
        }

        /**
         * Calcola la posizione (top) del contenuto
         * dando per buona la posizione dello scroller
         * @returns {number}
         */
        function getContentTopByScroller() {
          var hC = elm.innerHeight();   //altezza contenitore
          var hT = target.height();     //altezza del contenuto
          var sT = scr[0].offsetTop;
          //lo scroller è visibile se l'altezza del contenuto è maggiore di quella del contenitore
          //contenttop:
          //  la posizione del contenuto rispetto alla sua altezza complessiva
          //  è proporzionale alla posizione dello scroller rispetto all'altezza disponibile
          // >>  tT / hT = sT / hC   >>   tT = (sT * hT) / hC
          var top = (hT > hC) ? (sT * hT) / hC : 0;
          //if (top > 0) top = 0;
          return top;
        }

        /**
         * Verifica la visibilità dello scroller
         */
        function checkVisibility() {
          var hC = elm.innerHeight();   //altezza contenitore
          var hT = target.height();     //altezza del contenuto
          if (hT > hC) {
            scr.removeClass('hidden');
          }
          else {
            scr.addClass('hidden');
          }
        }

        /**
         * Aggiorna la posizione del contenuto
         * dando per buona la posizione dello scroller
         */
        function refreshByScroller() {
          var cT = getContentTopByScroller();
          target.css({'top': -cT + 'px'});
          checkVisibility();
        }

        /**
         * Aggiorna l'altezza e la posizione dello scroller
         * dando per buona la posizione del contenuto
         */
        function refreshByContent(){
          var sH = getScrollerHeight();
          var sT = getScrollerTopByContent();
          scr.css({height: sH + 'px', top: sT + 'px'});
          checkVisibility();
        }


        scope.$watch(function () {
          return target.height() + '.' + elm.innerHeight() + '.' + target.width();
        }, function () {
          refreshByContent();
        });

        function moveDown() {
          var hC = elm.innerHeight(); //altezza contenitore
          var hT = target.height(); //altezza target (contenuto)
          if (hT > hC)
            target.css({'top': (hC - hT) + 'px'});
          refreshByContent();
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
          var hC = elm.innerHeight();
          var hS = scr.innerHeight();
          top = (top < 0) ? 0 : top;
          if (top + hS > hC)
            top = hC - hS;

          scr.css({top: top + 'px'});
          refreshByScroller();
        }

        function mousewheel(ev) {
          var e = window.event || ev;
          var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
          var dy = delta * WHEELDELTA;
          dy = scr[0].offsetTop - dy;
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

        refreshByContent();
      }
    }
  }]);
