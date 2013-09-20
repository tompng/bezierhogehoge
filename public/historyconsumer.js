//history={index:0, snapshots:[]}
function cosumeRevert(history,data){
  for(var i=0;i<history.snapshots.length;i++){
    if(history.snapshots[i].id==data.id){
      history.index=i+1;
      return;
    }
  }
}
function consumeSave(history,data){
  history.snapshots=[];
  history.index=0;
  consumeData(history,data);
}
function consume(history,data){
  if(data.type=='revert')consumeRevert(history,data);
  else if(data.type=='save')consumeSave(history,data);
  else consumeData(history,data);
}
function consumeData(histroy,data){
  var before=history.snapshots[history.index-1]||{};
  var objects=history.snapshots[history.index++]={};
  for(var i in before){objects[i]=before[i];}
  while(history.snapshots.length>history.index)history.snapshots.pop();
  for(var i=0;i<data.operations.length;i++){
    var op=data.operations[i];
    if(op.src&&!objects[op.src])continue;
    switch(op.type){
      case 'move':{
        var obj=objects[op.src];
        var obj2=[];
        for(var j=0;j<obj.length;j++){
          var p=obj[j];
          obj2[j]={
            x:p.x+op.dx,y:p.y+op.dy,
            dx:p.dx,dy:p.dy,
            ln:p.ln,lp:p.lp
          };
        }
        delete objects[op.src];
        objects[op.dst]=obj2;
      }break;
      case 'split':{
        var obj=objects[op.src];
        delete objects[op.src];
        for(var id in op.dst){
          var range=op.dst[id];
          objects[id]=bezierSplit(obj,range[0],range[1]);
        }
      }break;
      case 'new':{
        objects[op.id]=op.data;
      }break;
    }
  }
}