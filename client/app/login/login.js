/* Created by Leo on 04/08/2015. */
'use strict';

angular.module('quiApp')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/login', {
        templateUrl: 'app/login/login.html',
        controller: 'LoginGroupCtrl'
      })
  });
