(function () {
  'use strict';

  angular.module('soundFlower.controllers', [])

    .controller('ChannelsController', [
      '$scope', 'channels', 'files',
      function ($scope, channels, files) {

        $scope.channels = channels.query();
        $scope.files = files.query();


        $scope.play = function (channel) {
          channel.state = 1;

          channels.play({
            channelId: 1,
            fileId: channel.fileId
          });
        };

        $scope.stop = function (channel) {
          channel.state = 0;

          channels.stop({
            channelId: 1
          });
        };

      }
    ]);

}());
