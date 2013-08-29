"use strict";

var io = require('socket.io');

process.on('uncaughtException',function(error) {
  console.log(error,error.stack);
});

var server = io.listen(3333);

var objects = {};
function consume(data){
  for(var i=0;i<data.operations.length;i++){
    var op=data.operations[i];
    if(op.src&&!objects[op.src])continue;
    if(op.src)delete objects[op.src];
    for(var id in op.dst){
      objects[id]=op.dst[id];
    }
  }
}
server.on('connection',function(socket){
  console.log('connect');
  socket.on('data',function(data){
    consume(data);
    socket.broadcast.emit('data',data);
    socket.emit('data',data);
  });
  socket.emit('data',{operations:[{dst:objects}]})
  socket.on('disconnect',function(){});
});