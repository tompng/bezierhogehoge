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

var buffer=[];
ioserver.on('connection',function(socket){
  console.log('connect');
  socket.on('data',function(data){
    buffer.push(data);
     socket.broadcast.emit('data',data);
     socket.emit('data',data);
  });
  socket.emit('init',buffer);
  socket.on('disconnect',function(){});
});
