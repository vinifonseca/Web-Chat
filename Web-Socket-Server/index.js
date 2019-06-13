"use strict";
process.title = 'node-chat';

var webSocketServer = require('websocket').server;
var http = require('http');

var history = [ ];
var clients = [ ];

var server = http.createServer(function(request, response) {});

server.listen(process.env.PORT || 5000, function() {

});

var wsServer = new webSocketServer({
  httpServer: server
});

wsServer.on('request', function(request) {
  var connection = request.accept(null, request.origin); 
  var index = clients.push(connection) - 1;

  if (history.length > 0) {
    connection.sendUTF(JSON.stringify(history));
  }

  connection.on('message', function(message) {
    if(!message.utf8Data) {
      return;
    }
    var data = JSON.parse(message.utf8Data);
    var obj = {
        uid: data.uid,
        time: data.time,
        content: data.content,
        sender: data.sender
    };

    history.push(obj);
    history = history.slice(-100);
    var json = JSON.stringify(history);
    for (var i=0; i < clients.length; i++) {
        clients[i].sendUTF(json);
    }
  });

  connection.on('close', function(connection) { 
    clients.splice(index, 1);       
  });
});