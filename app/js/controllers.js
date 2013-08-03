(function () {
  'use strict';

  angular.module('soundFlower.controllers', [])

    .controller('ChannelsController', [
      '$scope', 'channels', 'files',
      function ($scope, channels, files) {

        $scope.channels = channels.query();


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
    ])

    .controller('InterfaceController', [
      '$scope', '$document',
      function ($scope, $document) {

        $scope.files = [];

        var offset;
        var movingNode;
        var connectLine;

        $scope.startMove = function ($event, node) {
          movingNode = node;
          offset = {
            x: $event.x - movingNode.x,
            y: $event.y - movingNode.y
          };
        };

        $scope.updateNode = function ($event, node) {
          if (movingNode) {
            movingNode.x = $event.x - offset.x;
            movingNode.y = $event.y - offset.y;
          }
        };

        $scope.stopMove = function () {
          movingNode = null;
        };


        $scope.fileNodes = [];

        function createFileNode(file) {
          return {
            file: file,
            x: Math.floor(Math.random() * $document[0].width),
            y: Math.floor(Math.random() * $document[0].height)
          };
        }

        $scope.$on('addFile', function (evt, file) {
          var fileNode = createFileNode(file);

          $scope.fileNodes.push(fileNode);
          console.log('addFile', $scope.fileNodes);
        });
      }
    ])

    .controller('MenuController', [
      '$scope', '$rootScope', 'files',
      function ($scope, $rootScope, files) {
        $scope.files = files.query();

        $scope.addSound = function (file) {
          $rootScope.$broadcast('addFile', file);
        };
      }
    ]);


}());
