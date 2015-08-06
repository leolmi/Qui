/* Created by Leo on 04/08/2015. */
'use strict';

angular.module('quiApp')
  .controller('LoginGroupCtrl', ['$scope','$rootScope','Auth','$location','cache', function ($scope,$rootScope,Auth,$location,cache) {
    $scope.version = '1.0.0';
    $scope.errors = {};
    $scope.user = {};
    cache.reset();

    function resetErrors(skipsub) {
      if (!skipsub)
        $scope.submitted = false;
      $scope.errors = {};
    }

    if (!$rootScope.errors)
      resetErrors();

    $scope.login = function(form) {
      $scope.submitted = true;

      if(form.$valid) {
        Auth.login({
          group: $scope.user.group,
          password: $scope.user.password
        })
          .then(function() {
            // Logged in, redirect to home
            Auth.isLoggedInAsync(function(){
              var group = Auth.getCurrentUser();
              cache.init(group, $scope.user.nick, function() {
                $location.path('/main');
              });
            });

          })
          .catch( function(err) {
            $scope.errors.other = err.message;
          });
      }
    };
  }]);
