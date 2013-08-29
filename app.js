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
  var operations=[];
  for(var i=0;i<data.operations.length;i++){
    var op=data.operations[i];
    if(op.src&&!objects[op.src])continue;
    operations.push(op);
    switch(op.type){
      case 'move':{
        var obj=objects[op.src];
        for(var j=0;j<obj.length;j++){
          obj[j].x+=op.dx;
          obj[j].y+=op.dy;
        }
        delete objects[op.src];
        objects[op.dst]=obj;
      }break;
      case 'change':{
        if(op.src)delete objects[op.src];
        for(var id in op.dst){
          objects[id]=op.dst[id];
        }
      }break;
    }
  }
  data.operations=operations;
  if(operations.length)return true;
}
ioserver.on('connection',function(socket){
  console.log('connect');
  socket.on('data',function(data){
    if(consume(data)){
      socket.broadcast.emit('data',data);
      socket.emit('data',data);
    }
  });
  socket.emit('data',{operations:[{type:'change',dst:objects}]})
  socket.on('disconnect',function(){});
});
