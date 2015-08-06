/* Created by Leo on 04/08/2015. */
'use strict';

angular.module('quiApp')
  .directive('compareTo',[function() {
    return {
      require: "ngModel",
      scope: { otherModelValue:"=compareTo", compareIf:"=" },
      link: function(scope, elm, atr, ngModel) {
        /**
         * Questa direttiva confronta il valore passato con quello definito
         * nell'attributo otherModelValue (confronto delle password)
         * @param modelValue
         * @returns {boolean}
         */
        ngModel.$validators.compareTo = function(modelValue) {
          if (scope.compareIf!=undefined && !scope.compareIf) return true;
          return modelValue == scope.otherModelValue;
        };
        scope.$watch("otherModelValue", function() { ngModel.$validate(); });
        scope.$watch("compareIf", function() { ngModel.$validate(); })
      }
    };
  }])
  .controller('LoginGroupCtrl', ['$scope','$rootScope','$timeout','Auth','$location','cache','Logger', function ($scope,$rootScope,$timeout,Auth,$location,cache,Logger) {
    $scope.product = cache.product;
    $scope.errors = {};
    $scope.user = {};
    cache.reset();
    $scope.onnewgroup = false;

    /**
     * resetta gli errori di accesso
     * @param skipsub
     */
    function resetErrors(skipsub) {
      if (!skipsub) {
        $scope.submitted = false;
        $scope.newgroup = false;
      }
      $scope.errors = {};
    }

    if (!$rootScope.errors)
      resetErrors();

    /**
     * L'accesso vero e proprio è preceduto da una verifica
     * della disponibilità della geolocalizzazione
     * @param newgroup
     * @param cb
     */
    function beginSubmit(newgroup, cb) {
      cb = cb || angular.noop;
      $scope.errors = {};
      cache.testGeo(function (result) {
        if (result.code) {
          Logger.error('Errore sulla richiesta di geolocalizzazione', result.message);
        }
        else {
          $scope.newgroup = newgroup;
          $scope.submitted = true;
          $timeout(cb, 100);
        }
      });
    }

    /**
     * reindirizza alla pagina principale dopo
     * aver verificato l'utente ed inizializzato la cache
     */
    function goMain() {
      Auth.isLoggedInAsync(function () {
        var group = Auth.getCurrentUser();
        cache.init(group, $scope.user.nick, function () {
          $location.path('/main');
        });
      });
    }

    /**
     * Accede al gruppo esistente
     * @param form
     */
    $scope.login = function (form) {
      beginSubmit(false, function () {
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

    /**
     * Crea un nuovo gruppo
     * @param form
     */
    $scope.creategroup = function (form) {
      beginSubmit(true, function () {
        if (form.$valid) {
          Auth.createUser({
            group: $scope.user.group,
            password: $scope.user.password
          })
            .then(function () {
              // invia gli inviti se presenti
              cache.invite($scope.user.invite, $scope.user);
              // Group created, redirect to main
              goMain();
            })
            .catch(function (err) {
              err = err.data;
              $scope.errors = {};

              // Update validity of form fields that match the mongoose errors
              angular.forEach(err.errors, function (error, field) {
                form[field].$setValidity('mongoose', false);
                $scope.errors[field] = error.message;
              });
            });
        }
      });
    };
  }]);
