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
    ])

    .controller('InterfaceController', [
      '$scope',
      function ($scope) {

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


        $scope.connectLine = function (node) {

          if (!connectLine) {
            connectLine = {
              start: node,
              end: {
                x: node.x,
                y: node.y
              }
            };

            movingNode = connectLine.end;

            $scope.lines.push(connectLine);

          } else {
            connectLine.end = node;
            movingNode = null;
          }

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


        $scope.nodes = [
          {x: 0,  y: 0, color: 'red'},
          {x: 100,  y: 100, color: 'yellow'}
        ];

        $scope.lines = [
        ];


      }
    ]);

}());
