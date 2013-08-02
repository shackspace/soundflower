(function () {
  'use strict';

  angular.module('soundFlower', ['soundFlower.filters', 'soundFlower.services', 'soundFlower.directives', 'soundFlower.controllers']).
    config(['$routeProvider', function ($routeProvider) {
      $routeProvider.when('/', {templateUrl: 'partials/start.html', controller: 'StartController'});
      $routeProvider.otherwise({redirectTo: '/'});
    }]);

}());


