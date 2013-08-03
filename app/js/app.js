(function () {
  'use strict';

  angular.module('soundFlower', [
    'soundFlower.filters',
    'soundFlower.services',
    'soundFlower.directives',
    'soundFlower.controllers',
    'ngResource'
  ])
    .config(['$routeProvider', function ($routeProvider) {
      $routeProvider.when('/', {templateUrl: 'static/partials/interface.html', controller: 'InterfaceController'});
      $routeProvider.when('/old', {templateUrl: 'static/partials/channels.html', controller: 'ChannelsController'});
      $routeProvider.otherwise({redirectTo: '/'});
    }]);

}());


