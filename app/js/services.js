(function () {
  'use strict';

  angular.module('soundFlower.services', ['ngResource'])

    .factory('channels', [
      '$resource',
      function ($resource) {
        return $resource('/channels/:channelId/:action/:fileId', {}, {
          'play': {method: 'GET', params: {'action': 'play'}},
          'stop': {method: 'GET', params: {'action': 'stop'}}
        });
      }
    ])

    .factory('files', [
      '$resource',
      function ($resource) {
        return $resource('/files/:fileId');
      }
    ])

    .factory('cancelClick', [
      function () {
        return function (event) {
          var handler = event.target.onclick;
          event.target.onclick = function (event) {
            event.stopPropagation();
            event.target.onclick = handler;
            return false;
          };
        };
      }
    ])

    .factory('underscore', [
      '$window',
      function ($window) {
        return $window._.noConflict();
      }
    ]);
}());
