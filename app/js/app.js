(function () {
  'use strict';

  angular.module('soundFlower', [
      'soundFlower.filters',
      'soundFlower.services',
      'soundFlower.directives',
      'soundFlower.controllers',
      'ngResource'
    ]).
    config(['$routeProvider', function ($routeProvider) {
      $routeProvider.when('/', {templateUrl: 'static/partials/channels.html', controller: 'ChannelsController'});
      $routeProvider.when('/interface', {templateUrl: 'static/partials/interface.html', controller: 'InterfaceController'});
      $routeProvider.otherwise({redirectTo: '/'});
    }]);

}());


