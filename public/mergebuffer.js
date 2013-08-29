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
MergeBuffer.prototype.merge=function(data,buffer,forward){
  console.log('merge',data,buffer);
  if(data){
    for(var i=0;i<data.operations.length;i++){
      var op=data.operations[i];
      if(!op.src||this.merged[op.src]){
        if(op.src)delete this.merged[op.src];
        for(var id in op.dst){
          this.merged[id]=op.dst[id];
        }
      }
    }
  }
  this.unmerged={};
  this.unmerged.__proto__=this.merged;
  for(var i=0;i<buffer.length;i++){
    for(var j=0;j<buffer[i].operations.length;j++){
      var op=buffer[i].operations[j];
      if(!op.src||this.unmerged[op.src]){
        delete this.unmerged[op.src];
        this.unmerged[op.src]=null;
        for(var id in op.dst){
          this.unmerged[id]=op.dst[id]
        }
      }
    }
  }
  this.listener.update(this.unmerged);
}

MergeBuffer.prototype.push=function(data,merge){
  this.buffer.push(data,merge);
}
