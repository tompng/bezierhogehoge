"use strict";
var PORT=3333;
var http=require('http');
var io=require('socket.io');
var express=require('express');

process.on('uncaughtException',function(error) {
  console.log(error,error.stack);
});
var app=express();
app.get('/',function(req,res){res.sendfile('public/index.html');});
['bezier.js','polymath.js','multitouch.js','mergebuffer.js'].forEach(function(file){
  console.log(file);
  app.get('/'+file,function(req,res){res.sendfile('public/'+file);});
})

var server=http.createServer(app).listen(PORT);

var ioserver = io.listen(server);

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
ioserver.on('connection',function(socket){
  console.log('connect');
  socket.on('data',function(data){
    consume(data);
    socket.broadcast.emit('data',data);
    socket.emit('data',data);
  });
  socket.emit('data',{operations:[{dst:objects}]})
  socket.on('disconnect',function(){});
});
