/* Created by Leo on 06/08/2015. */
'use strict';


angular.module('quiApp')
  .controller('WelcomeCtrl', ['$scope','cache', function ($scope, cache) {
    $scope.product = cache.product;
    $scope.infos = cache.infos();
    $scope.legacy = ['Entrando nel gruppo condividi posizione e messaggi, questi dati saranno momentaneamente storicizzati '+
      'sul server e saranno visibili a tutti i membri dl gruppo.',
      ' Se non desideri condividere tali informazioni puoi uscire dal gruppo e tutti i dati saranno automaticamente rimossi dal server'];
  }]);
