(function () {
  'use strict';

  angular.module('soundFlower.services', [])

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
        $resource('/files/:fileId');
      }
    ]);

}());
