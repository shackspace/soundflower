(function () {
  'use strict';

  angular.module('soundFlower.controllers', [])

    .controller('ChannelsController', [
      '$scope',
      function ($scope) {

        $scope.channels = [
          {
            id: 1,
            state: 0,
            file: null,
            name: 'First channel'
          },
          {
            id: 2,
            state: 0,
            file: 2,
            name: 'First channel'
          },
          {
            id: 3,
            state: 1,
            file: 1,
            name: 'First channel'
          }
        ];

        $scope.files = [
          {
            id: 1,
            name: 'sound1.mp3'
          },
          {
            id: 2,
            name: 'sound2.mp3'
          },
          {
            id: 3,
            name: 'sound3.mp3'
          },
          {
            id: 4,
            name: 'sound4.mp3'
          }
        ];

        $scope.play = function (channel) {
          channel.state = 1;
        };

        $scope.stop = function (channel) {
          channel.state = 0;
        };

      }
    ]);

}());
