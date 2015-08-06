/* Created by Leo on 04/08/2015. */
'use strict';

angular.module('quiApp')
  .directive('compareTo',[function() {
    return {
      require: "ngModel",
      scope: { otherModelValue:"=compareTo", compareIf:"=" },
      link: function(scope, elm, atr, ngModel) {
        ngModel.$validators.compareTo = function(modelValue) {
          if (scope.compareIf!=undefined && !scope.compareIf) return true;
          return modelValue == scope.otherModelValue;
        };

        scope.$watch("otherModelValue", function() {
          ngModel.$validate();
        });

        scope.$watch("compareIf", function() {
          ngModel.$validate();
        })
      }
    };
  }])
  .controller('LoginGroupCtrl', ['$scope','$rootScope','$timeout','Auth','$location','cache','Logger', function ($scope,$rootScope,$timeout,Auth,$location,cache,Logger) {
    $scope.product = cache.product;
    $scope.errors = {};
    $scope.user = {};
    cache.reset();
    $scope.onnewgroup = false;

    function resetErrors(skipsub) {
      if (!skipsub) {
        $scope.submitted = false;
        $scope.newgroup = false;
      }
      $scope.errors = {};
    }

    if (!$rootScope.errors)
      resetErrors();

    function setMode(newgroup) {
      $scope.$apply(function () { $scope.newgroup = newgroup; });
    }

    function beginSubmit(newgroup, cb) {
      cb = cb || angular.noop;
      $scope.errors = {};
      $scope.newgroup = newgroup;
      $scope.submitted = true;
      $timeout(cb, 100);
    }

    function goMain() {
      Auth.isLoggedInAsync(function () {
        var group = Auth.getCurrentUser();
        cache.init(group, $scope.user.nick, function () {
          $location.path('/main');
        });
      });
    }

    $scope.login = function(form) {
      beginSubmit(false, function() {
        if (form.$valid) {
          Auth.login({
            group: $scope.user.group,
            password: $scope.user.password
          })
            .then(function () {
              // Logged in, redirect to main
              goMain();
            })
            .catch(function (err) {
              $scope.errors.other = err.message;
            });
        }
      });
    };

    $scope.creategroup = function (form) {
      beginSubmit(true, function() {
        if(form.$valid) {
          Auth.createUser({
            group: $scope.user.group,
            password: $scope.user.password
          })
            .then( function() {
              // Group created, redirect to main
              goMain();
            })
            .catch( function(err) {
              err = err.data;
              $scope.errors = {};

              // Update validity of form fields that match the mongoose errors
              angular.forEach(err.errors, function(error, field) {
                form[field].$setValidity('mongoose', false);
                $scope.errors[field] = error.message;
              });
            });
        }
      });
    };
  }]);
