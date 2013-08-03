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
    ])

    .controller('InterfaceController', [
      '$scope', '$document', 'underscore', 'channels', 'cancelClick', '$http', '$timeout',
      function ($scope, $document, _, Channels, cancelClick, $http, $timeout) {

        // drag ang drop
        var offset;
        var moved = false;
        var movingNode;
        var currentConnection;
        var timedout;

        function removeElement(array, element) {
          var index = array.indexOf(element);
          if (index !== -1) {
            array.splice(index, 1);
          }
        }

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


        function updateVolume(volume, channel) {
          console.log(channel);
          $http.get('/channels/' + channel.id + '/volume/' + Math.ceil(volume * 100));
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

            if (currentConnection.end.channel && currentConnection.start.file) {

              updateVolume(currentConnection.start.volume, currentConnection.end.channel);

              currentConnection = null;

            } else {
              removeElement($scope.connections, currentConnection);
            }
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
          removeElement($scope.connections, currentConnection);
        };

        $scope.removeConnection = function (connection) {
          var fileNode;

          fileNode = connection.start;
          if (fileNode.state ===  1) {

            $http.get('/channels/' + connection.end.channel.id + '/stop');

            console.log(getConnectedChannels(fileNode).length);

            if (getConnectedChannels(fileNode).length === 1) {
              fileNode.state = 0;
            }
          }

          removeElement($scope.connections, connection);
        };

        $scope.moveConnection = function ($event) {
          if (currentConnection) {
            currentConnection.end.x = $event.x;
            currentConnection.end.y = $event.y;
          }
        };

        // file nodes
        $scope.fileNodes = [];


        $scope.changeVolume = function (fileNode) {
          var t = Math.asin(fileNode.volume);

          timedout = false;

          fileNode.volumeTimeout = $timeout(function () {

            timedout = true;

            if (!moved) {

              fileNode.interval = setInterval(function () {
                $scope.$apply(function () {
                  t += 0.02;
                  fileNode.volume = Math.abs(Math.sin(t));
                });
              }, 10);

            }

          }, 750);

        };


        $scope.setVolume = function ($event, fileNode) {
          if (fileNode.volumeTimeout) {
            $timeout.cancel(fileNode.volumeTimeout);
            fileNode.volumeTimeout = null;
          }

          if (fileNode.interval) {
            clearInterval(fileNode.interval);
            fileNode.interval = null;
          }

          if (!moved && timedout) {

            cancelClick($event);

            var channels = getConnectedChannels(fileNode);

            _(channels).each(_(updateVolume).partial(fileNode.volume));

            timedout = false;

          }
        };

        function createFileNode(file) {
          return {
            state: 0,
            file: file,
            volume: 0.75,
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
          var channels = getConnectedChannels(fileNode);

          if (channels.length > 0) {

            fileNode.state = fileNode.state ? 0 : 1;

            if (fileNode.timeout) {
              $timeout.cancel(fileNode.timeout);
            }


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
