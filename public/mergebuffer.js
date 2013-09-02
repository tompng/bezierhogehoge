function MergeBufferBase(listener){
  this.merged=[];
  this.unmerged=[];
  this.listener=listener;
}

MergeBufferBase.prototype.push=function(data, merge){
  if(merge){
    this.merged.push(data);
    var forward=false;
    if(this.unmerged.length>0&&this.unmerged[0].id==data.id){
      this.unmerged.shift();
      forward=true;
    }
    this.listener.merge(data,this.unmerged,forward);
  }else{
    this.unmerged.push(data);
    this.listener.merge(null,this.unmerged,false);
  }
}

function MergeBuffer(listener){
  this.buffer=new MergeBufferBase(this);
  this.listener=listener;
  this.merged={};
  this.unmerged={};
}
function consume(objects,data,del){
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
        if(del)delete objects[op.src];
        else objects[op.src]=null;
        objects[op.dst]=obj2;
      }break;
      case 'split':{
        var obj=objects[op.src];
        if(del)delete objects[op.src];
        else objects[op.src]=null;
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
MergeBuffer.prototype.merge=function(data,buffer,forward){
  if(data){
    consume(this.merged,data,true);
  }
  this.unmerged={};
  this.unmerged.__proto__=this.merged;
  for(var i=0;i<buffer.length;i++){
    consume(this.unmerged,buffer[i],false);
  }
  this.listener.update(this.unmerged);
}

MergeBuffer.prototype.push=function(data,merge){
  this.buffer.push(data,merge);
}
