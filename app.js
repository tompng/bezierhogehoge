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
['bezier.js','polymath.js','multitouch.js','mergebuffer.js','historyconsumer.js'].forEach(function(file){
  console.log(file);
  app.get('/'+file,function(req,res){res.sendfile('public/'+file);});
})

var server=http.createServer(app).listen(PORT);

var ioserver = io.listen(server);

var buffer=[];
var index=0;
ioserver.on('connection',function(socket){
  console.log('connect');
  socket.on('data',function(data){
    if(data.type=='revert'){
      for(var i=0;i<buffer.length;i++){
        if(buffer[i].id==data.dst){
          index=i+1;break;
        }
      }
    }else if(data.type=='save'){
      buffer=[data.data];
      index=1;
    }else{
      buffer[index++]=data;
      while(buffer.length>index)buffer.pop();
    }
    socket.broadcast.emit('data',data);
    socket.emit('data',data);
  });
  socket.emit('init',{buffer:buffer,index:index});
  socket.on('disconnect',function(){});
});
