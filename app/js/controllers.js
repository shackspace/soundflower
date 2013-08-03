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

          console.log(channel);

          channels.play({
            channelId: channel.id,
            fileId: channel.file
          });
        };

        $scope.stop = function (channel) {
          channel.state = 0;

          channels.stop({
            channelId: channel.id
          });
        };

      }
    ]);

}());
