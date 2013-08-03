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
      '$scope', '$document', 'underscore', 'channels', 'cancelClick', '$http', '$timeout',
      function ($scope, $document, _, Channels, cancelClick, $http, $timeout) {

        // drag ang drop
        var offset;
        var moved = false;
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
            moved = true;
            movingNode.x = $event.x - offset.x;
            movingNode.y = $event.y - offset.y;
          }
        };

        $scope.stopMove = function ($event) {
          if (moved) {
            cancelClick($event);
          }
          moved = false;
          movingNode = null;
        };

        // node linking
        $scope.connections = [];

        function startConnection(node) {
          currentConnection = {
            start: node,
            end: {
              x: node.x,
              y: node.y
            }
          };

          $scope.connections.push(currentConnection);
        }

        function endConnection(node) {
          var temp;
          if (currentConnection) {
            currentConnection.end = node;
            movingNode = null;

            if (currentConnection.start.channel) {
              temp = currentConnection.end;
              currentConnection.end = currentConnection.start;
              currentConnection.start = temp;
            }


            console.log(currentConnection);

            currentConnection = null;
          }
        }

        $scope.makeConnection = function ($event, node) {
          $event.stopPropagation();
          if (!currentConnection) {
            startConnection(node);
          } else {
            endConnection(node);
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

        function getConnectedChannels(fileNode) {

          function isConnectedWithFileNode(connection) {
            return connection.start === fileNode;
          }

          function getChannel(connection) {
            return connection.end.channel;
          }

          return _($scope.connections)
            .chain()
            .filter(isConnectedWithFileNode)
            .map(getChannel)
            .value();
        }

        function stopPlaying(channels) {
          _(channels)
            .each(function (channel) {
              $http.get('/channels/' + channel.id + '/stop');
            });
        }

        function startPlaying(channels, fileId, callback) {
          var result;

          _(channels)
            .each(function (channel) {
              result = $http.get('/channels/' + channel.id + '/play/' + fileId);
            });

          result.then(callback);
        }

        $scope.toggleState = function (fileNode) {
          fileNode.state = fileNode.state ? 0 : 1;

          if (fileNode.timeout) {
            $timeout.cancel(fileNode.timeout);
          }

          var channels = getConnectedChannels(fileNode);

          if (fileNode.state === 0) {
            stopPlaying(channels);
          } else {
            startPlaying(channels, fileNode.file.id, function (result) {

              var time = parseFloat(result.data, 10) * 1000;

              fileNode.timeout = $timeout(function () {
                fileNode.state = 0;
              }, time);

            });
          }
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

        Channels.query(function (channels) {
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
