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
      '$scope', '$document', 'channels',
      function ($scope, $document, channels) {

        // drag ang drop
        var offset;
        var movingNode;
        var currentConnection;

        $scope.startMove = function ($event, node) {
          $event.stopPropagation();
          movingNode = node;
          offset = {
            x: $event.x - movingNode.x,
            y: $event.y - movingNode.y
          };
        };

        $scope.moveNode = function ($event, node) {
          if (movingNode) {
            movingNode.x = $event.x - offset.x;
            movingNode.y = $event.y - offset.y;
          }
        };

        $scope.stopMove = function ($event) {
          $event.stopPropagation();
          movingNode = null;
        };

        // node linking
        $scope.connections = [];

        $scope.startConnection = function (node) {
          currentConnection = {
            start: node,
            end: {
              x: node.x,
              y: node.y
            }
          };

          $scope.connections.push(currentConnection);
        };

        $scope.endConnection = function (node) {
          if (currentConnection) {
            currentConnection.end = node;
            movingNode = null;
            currentConnection = null;
          }
        };

        $scope.cancelConnection = function ($event) {
          $event.stopPropagation();
          $scope.removeConnection(currentConnection);
        };

        $scope.removeConnection = function (connection) {
          var connections = $scope.connections;
          var deleteIndex = connection.indexOf(connection);

          connections.splice(deleteIndex, 1);
        };

        $scope.moveConnection = function ($event) {
          if (currentConnection) {
            currentConnection.end.x = $event.x;
            currentConnection.end.y = $event.y;
          }
        };

        // file nodes
        $scope.fileNodes = [];

        function createFileNode(file) {
          return {
            state: 0,
            file: file,
            x: Math.floor(Math.random() * $document[0].width),
            y: Math.floor(Math.random() * $document[0].height)
          };
        }

        $scope.toggleState = function (fileNode) {
          fileNode.state = fileNode.state ? 0 : 1;
        };

        $scope.$on('addFile', function (evt, file) {
          var fileNode = createFileNode(file);
          $scope.fileNodes.push(fileNode);
        });

        // output nodes
        function createOutputNode(channel) {
          return {
            channel: channel,
            x: Math.floor(Math.random() * $document[0].width),
            y: Math.floor(Math.random() * $document[0].height)
          };
        }

        channels.query(function (channels) {
          $scope.channelNodes = channels.map(createOutputNode);
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
